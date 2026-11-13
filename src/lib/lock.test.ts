import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import {
  IDLE_LOCK_MS,
  LockController,
  NEEDS_INITIAL_PIN,
  resetNote,
  type Invoke,
} from "./lock.svelte";

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

const ada = { id: "u1", name: "Ada Yılmaz", title: "Öğretmen" };
const row = (over: Record<string, unknown> = {}) => ({
  ...ada,
  hasPin: true,
  resetPendingUntil: null,
  ...over,
});
const status = (over: Record<string, unknown> = {}) => ({
  configured: true,
  unlocked: false,
  currentUser: null,
  ...over,
});

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

/** A controller that has booted to the user picker. */
async function pickerController(extra: Record<string, Handler> = {}, users: unknown[] = [row()]) {
  const f = fake({ lock_status: () => status(), users_list: () => users, ...extra });
  const c = new LockController({ invoke: f.invoke, desktop: true });
  await c.init();
  return { c, ...f };
}

describe("LockController", () => {
  it("runs beforeLock (archive flush) before locking, then shows the picker", async () => {
    const order: string[] = [];
    const { invoke } = fake({
      lock_status: () => status({ unlocked: true, currentUser: ada }),
      lock_now: () => void order.push("lock_now"),
      users_list: () => [row()],
    });
    const c = new LockController({ invoke, desktop: true });
    c.beforeLock = async () => void order.push("flush");
    await c.init();
    expect(c.currentUser).toEqual(ada);
    await c.lockNow();
    expect(order).toEqual(["flush", "lock_now"]);
    expect(c.state).toBe("pickUser");
    expect(c.currentUser).toBeNull();
    expect(c.users).toHaveLength(1);
  });

  it("web is always unlocked and never calls out", async () => {
    const { invoke, calls } = fake({});
    const c = new LockController({ invoke, desktop: false });
    await c.init();
    c.touch();
    expect(c.state).toBe("unlocked");
    expect(calls).toEqual([]);
  });

  it("walks firstUser -> showRecovery -> unlocked", async () => {
    const { invoke, calls } = fake({
      lock_status: vi
        .fn()
        .mockResolvedValueOnce(status({ configured: false }))
        .mockResolvedValue(status({ unlocked: true, currentUser: ada })),
      user_create: () => ({ user: ada, recoveryCode: "ABCD-EFGH" }),
    });
    const c = new LockController({ invoke, desktop: true });
    await c.init();
    expect(c.state).toBe("firstUser");
    await c.createFirstUser({ name: ada.name, title: ada.title, pin: "1234" });
    expect(c.state).toBe("showRecovery");
    expect(c.recoveryCode).toBe("ABCD-EFGH");
    expect(calls[1]).toEqual(["user_create", { name: ada.name, title: ada.title, pin: "1234" }]);
    await c.finishRecovery();
    expect(c.state).toBe("unlocked");
    expect(c.currentUser).toEqual(ada);
    expect(c.recoveryCode).toBe("");
  });

  it("picks a user, enters the PIN and unlocks as that user", async () => {
    const { c, calls } = await pickerController({ user_login: () => ({ ok: true }) });
    expect(c.state).toBe("pickUser");
    c.selectUser(c.users[0]);
    expect(c.state).toBe("pin");
    await c.unlock("1234");
    expect(calls.at(-1)).toEqual(["user_login", { userId: "u1", pin: "1234" }]);
    expect(c.state).toBe("unlocked");
    expect(c.currentUser).toEqual(ada);
  });

  it("returns to the picker from the PIN screen", async () => {
    const { c } = await pickerController();
    c.selectUser(c.users[0]);
    c.showPicker();
    expect(c.state).toBe("pickUser");
    expect(c.selectedUser).toBeNull();
  });

  it("sets an initial PIN for a user without one", async () => {
    const { c, calls } = await pickerController({ user_set_initial_pin: () => undefined }, [
      row({ hasPin: false }),
    ]);
    c.selectUser(c.users[0]);
    expect(c.state).toBe("initialPin");
    await c.setInitialPin("4321");
    expect(calls.at(-1)).toEqual(["user_set_initial_pin", { userId: "u1", pin: "4321" }]);
    expect(c.state).toBe("unlocked");
    expect(c.currentUser).toEqual(ada);
  });

  it("falls to initialPin when login says the PIN must be set", async () => {
    const { c } = await pickerController({ user_login: () => Promise.reject(NEEDS_INITIAL_PIN) });
    c.selectUser(c.users[0]);
    await c.unlock("1234");
    expect(c.state).toBe("initialPin");
  });

  it("counts a wrong-PIN lockout down and unlocks on the right PIN", async () => {
    const answers = [
      { ok: false, retryAfterSec: 3 },
      { ok: true, retryAfterSec: null },
    ];
    const { c } = await pickerController({ user_login: () => answers.shift() });
    c.selectUser(c.users[0]);
    await c.unlock("0000");
    expect(c.state).toBe("pin");
    expect(c.error).toBe("Çok fazla hatalı deneme.");
    expect(c.retryAfterSec).toBe(3);
    vi.advanceTimersByTime(2000);
    expect(c.retryAfterSec).toBe(1);
    vi.advanceTimersByTime(1000);
    expect(c.retryAfterSec).toBeNull();
    await c.unlock("1234");
    expect(c.state).toBe("unlocked");
  });

  it("says the PIN is wrong when there is no lockout", async () => {
    const { c } = await pickerController({
      user_login: () => ({ ok: false, retryAfterSec: null }),
    });
    c.selectUser(c.users[0]);
    await c.unlock("0000");
    expect(c.error).toBe("PIN yanlış.");
  });

  it("shows backend errors verbatim", async () => {
    const { c } = await pickerController({ user_login: () => Promise.reject("PIN geçersiz.") });
    c.selectUser(c.users[0]);
    await c.unlock("1");
    expect(c.error).toBe("PIN geçersiz.");
  });

  it("recovers a user with the school code and shows the new code", async () => {
    const { c, calls } = await pickerController({
      lock_recover: () => ({ recoveryCode: "NEW-CODE" }),
    });
    c.showRecoverForm();
    expect(c.state).toBe("recover");
    await c.recover("u1", "OLD-CODE", "5678");
    expect(calls.at(-1)).toEqual([
      "lock_recover",
      { recoveryCode: "OLD-CODE", userId: "u1", newPin: "5678" },
    ]);
    expect(c.state).toBe("showRecovery");
    expect(c.recoveryCode).toBe("NEW-CODE");
  });

  it("continues to the picker after recovery when the backend did not log in", async () => {
    const { c } = await pickerController({ lock_recover: () => ({ recoveryCode: "N" }) });
    await c.recover("u1", "OLD", "5678");
    await c.finishRecovery();
    expect(c.state).toBe("pickUser");
  });

  it("requests a reset and keeps the pending date on the user", async () => {
    const until = "2030-01-02T10:30:00Z";
    const { c, calls } = await pickerController({
      lock_request_reset: () => ({ resetPendingUntil: until }),
    });
    c.selectUser(c.users[0]);
    await c.requestReset();
    expect(calls.at(-1)).toEqual(["lock_request_reset", { userId: "u1" }]);
    expect(c.selectedUser?.resetPendingUntil).toBe(until);
    expect(c.users[0].resetPendingUntil).toBe(until);
    expect(resetNote(until)).toContain("tarihinde gerçekleşecek.");
  });

  it("surfaces a pending reset from the user list on the picker", async () => {
    const until = "2030-01-02T10:30:00Z";
    const { c } = await pickerController({}, [row({ resetPendingUntil: until })]);
    expect(c.users[0].resetPendingUntil).toBe(until);
  });

  it("keeps the current user in sync when they edit themselves", async () => {
    const { invoke } = fake({
      lock_status: () => status({ unlocked: true, currentUser: ada }),
      user_update: () => undefined,
    });
    const c = new LockController({ invoke, desktop: true });
    await c.init();
    await c.updateUser("u1", "Ada K.", "Müdür");
    expect(c.currentUser).toEqual({ id: "u1", name: "Ada K.", title: "Müdür" });
  });

  it("asks the audit log for 200 rows, optionally for one period", async () => {
    const { invoke, calls } = fake({
      lock_status: () => status({ unlocked: true, currentUser: ada }),
      audit_list: () => [],
    });
    const c = new LockController({ invoke, desktop: true });
    await c.init();
    await c.auditList(null);
    await c.auditList("2026-1");
    expect(calls.slice(-2)).toEqual([
      ["audit_list", { limit: 200, periodId: null }],
      ["audit_list", { limit: 200, periodId: "2026-1" }],
    ]);
  });

  it("locks after the idle timeout and activity postpones it", async () => {
    const { invoke, calls } = fake({
      lock_status: () => status({ unlocked: true, currentUser: ada }),
      lock_now: () => undefined,
      users_list: () => [row()],
    });
    const c = new LockController({ invoke, desktop: true });
    await c.init();
    vi.advanceTimersByTime(IDLE_LOCK_MS - 1000);
    c.touch();
    vi.advanceTimersByTime(IDLE_LOCK_MS - 1000);
    expect(c.state).toBe("unlocked");
    await vi.advanceTimersByTimeAsync(1000);
    expect(c.state).toBe("pickUser");
    expect(calls.some(([name]) => name === "lock_now")).toBe(true);
  });
});
