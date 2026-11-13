import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { IDLE_LOCK_MS, LockController, resetNote, type Invoke } from "./lock.svelte";

type Handler = (args?: Record<string, unknown>) => unknown;

function fake(handlers: Record<string, Handler>) {
  const calls: Array<[string, Record<string, unknown> | undefined]> = [];
  const invoke: Invoke = async <T>(command: string, args?: Record<string, unknown>) => {
    calls.push([command, args]);
    const handler = handlers[command];
    if (!handler) throw new Error(`unexpected ${command}`);
    return (await handler(args)) as T;
  };
  return { invoke, calls };
}

const status = (over: Record<string, unknown> = {}) => ({
  configured: true,
  unlocked: false,
  retryAfterSec: null,
  resetPendingUntil: null,
  ...over,
});

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("LockController", () => {
  it("runs beforeLock (archive flush) before locking", async () => {
    const order: string[] = [];
    const { invoke } = fake({
      lock_status: () => status({ unlocked: true }),
      lock_now: () => void order.push("lock_now"),
    });
    const c = new LockController({ invoke, desktop: true });
    c.beforeLock = async () => void order.push("flush");
    await c.init();
    await c.lockNow();
    expect(order).toEqual(["flush", "lock_now"]);
    expect(c.state).toBe("locked");
  });

  it("web is always unlocked and never calls out", async () => {
    const { invoke, calls } = fake({});
    const c = new LockController({ invoke, desktop: false });
    await c.init();
    c.touch();
    expect(c.state).toBe("unlocked");
    expect(calls).toEqual([]);
  });

  it("walks setup -> showRecovery -> unlocked", async () => {
    const { invoke, calls } = fake({
      lock_status: vi
        .fn()
        .mockResolvedValueOnce(status({ configured: false }))
        .mockResolvedValue(status({ unlocked: true })),
      lock_setup: () => ({ recoveryCode: "ABCD-EFGH" }),
    });
    const c = new LockController({ invoke, desktop: true });
    await c.init();
    expect(c.state).toBe("setup");
    await c.setup("1234");
    expect(c.state).toBe("showRecovery");
    expect(c.recoveryCode).toBe("ABCD-EFGH");
    expect(calls[1]).toEqual(["lock_setup", { pin: "1234" }]);
    await c.finishRecovery();
    expect(c.state).toBe("unlocked");
    expect(c.recoveryCode).toBe("");
  });

  it("counts a wrong-PIN lockout down and unlocks on the right PIN", async () => {
    const answers = [
      { ok: false, retryAfterSec: 3 },
      { ok: true, retryAfterSec: null },
    ];
    const { invoke } = fake({ lock_status: () => status(), lock_unlock: () => answers.shift() });
    const c = new LockController({ invoke, desktop: true });
    await c.init();
    await c.unlock("0000");
    expect(c.state).toBe("locked");
    expect(c.error).toBe("Çok fazla hatalı deneme.");
    expect(c.retryAfterSec).toBe(3);
    vi.advanceTimersByTime(2000);
    expect(c.retryAfterSec).toBe(1);
    vi.advanceTimersByTime(1000);
    expect(c.retryAfterSec).toBeNull();
    await c.unlock("1234");
    expect(c.state).toBe("unlocked");
  });

  it("shows backend errors verbatim", async () => {
    const { invoke } = fake({
      lock_status: () => status(),
      lock_unlock: () => Promise.reject("PIN geçersiz."),
    });
    const c = new LockController({ invoke, desktop: true });
    await c.init();
    await c.unlock("1");
    expect(c.error).toBe("PIN geçersiz.");
  });

  it("recovers with a code and shows the new code", async () => {
    const { invoke, calls } = fake({
      lock_status: vi
        .fn()
        .mockResolvedValueOnce(status())
        .mockResolvedValue(status({ unlocked: true })),
      lock_recover: () => ({ recoveryCode: "NEW-CODE" }),
    });
    const c = new LockController({ invoke, desktop: true });
    await c.init();
    c.showRecoverForm();
    expect(c.state).toBe("recover");
    await c.recover("OLD-CODE", "5678");
    expect(calls.at(-1)).toEqual(["lock_recover", { recoveryCode: "OLD-CODE", newPin: "5678" }]);
    expect(c.state).toBe("showRecovery");
    expect(c.recoveryCode).toBe("NEW-CODE");
    await c.finishRecovery();
    expect(c.state).toBe("unlocked");
  });

  it("requests a reset and keeps the pending date", async () => {
    const until = "2030-01-02T10:30:00Z";
    const { invoke } = fake({
      lock_status: () => status(),
      lock_request_reset: () => ({ resetPendingUntil: until }),
    });
    const c = new LockController({ invoke, desktop: true });
    await c.init();
    c.showRecoverForm();
    await c.requestReset();
    expect(c.resetPendingUntil).toBe(until);
    expect(resetNote(until)).toContain("tarihinde gerçekleşecek.");
  });

  it("surfaces a pending reset from the status on the locked screen", async () => {
    const until = "2030-01-02T10:30:00Z";
    const { invoke } = fake({ lock_status: () => status({ resetPendingUntil: until }) });
    const c = new LockController({ invoke, desktop: true });
    await c.init();
    expect(c.state).toBe("locked");
    expect(c.resetPendingUntil).toBe(until);
  });

  it("locks after the idle timeout and activity postpones it", async () => {
    const { invoke, calls } = fake({
      lock_status: () => status({ unlocked: true }),
      lock_now: () => undefined,
    });
    const c = new LockController({ invoke, desktop: true });
    await c.init();
    vi.advanceTimersByTime(IDLE_LOCK_MS - 1000);
    c.touch();
    vi.advanceTimersByTime(IDLE_LOCK_MS - 1000);
    expect(c.state).toBe("unlocked");
    await vi.advanceTimersByTimeAsync(1000);
    expect(c.state).toBe("locked");
    expect(calls.some(([name]) => name === "lock_now")).toBe(true);
  });
});
