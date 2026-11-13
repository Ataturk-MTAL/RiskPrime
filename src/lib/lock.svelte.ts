import { isDesktop } from "$lib/platform";

export type LockState = "checking" | "setup" | "showRecovery" | "locked" | "recover" | "unlocked";
export type Invoke = <T>(command: string, args?: Record<string, unknown>) => Promise<T>;

export const IDLE_LOCK_MS = 10 * 60 * 1000;
const COUNTDOWN_TICK_MS = 1000;
export const PIN_PATTERN = /^\d{4,8}$/;
export const PIN_HINT = "PIN 4–8 haneli rakamlardan oluşmalıdır.";

interface LockStatus {
  configured: boolean;
  unlocked: boolean;
  retryAfterSec: number | null;
  resetPendingUntil: string | null;
}

const tauriInvoke: Invoke = async (command, args) =>
  (await import("@tauri-apps/api/core")).invoke(command, args);

/** Rust errors arrive as Turkish strings; they are shown as they are. */
export const errorMessage = (error: unknown): string =>
  typeof error === "string" ? error : error instanceof Error ? error.message : "Beklenmeyen hata.";

export const resetNote = (until: string): string =>
  `Sıfırlama ${new Date(until).toLocaleString("tr-TR", { dateStyle: "long", timeStyle: "short" })} tarihinde gerçekleşecek.`;

/** App-lock state machine for the desktop shell; on the web it is always unlocked and never calls out. */
export class LockController {
  state = $state<LockState>("checking");
  error = $state("");
  busy = $state(false);
  recoveryCode = $state("");
  retryAfterSec = $state<number | null>(null);
  resetPendingUntil = $state<string | null>(null);
  #invoke: Invoke;
  #desktop: boolean;
  #idleMs: number;
  #countdown: ReturnType<typeof setInterval> | null = null;
  #idle: ReturnType<typeof setTimeout> | null = null;

  constructor({
    invoke = tauriInvoke,
    desktop = isDesktop(),
    idleMs = IDLE_LOCK_MS,
  }: { invoke?: Invoke; desktop?: boolean; idleMs?: number } = {}) {
    this.#invoke = invoke;
    this.#desktop = desktop;
    this.#idleMs = idleMs;
  }

  async init() {
    if (!this.#desktop) return this.#enter("unlocked");
    try {
      const status = await this.#invoke<LockStatus>("lock_status");
      this.#apply(status);
      this.#enter(!status.configured ? "setup" : status.unlocked ? "unlocked" : "locked");
    } catch (e) {
      this.error = errorMessage(e);
      this.#enter("locked");
    }
  }

  setup(pin: string) {
    return this.#run(async () => {
      this.recoveryCode = (
        await this.#invoke<{ recoveryCode: string }>("lock_setup", { pin })
      ).recoveryCode;
      this.#enter("showRecovery");
    });
  }

  unlock(pin: string) {
    return this.#run(async () => {
      const result = await this.#invoke<{ ok: boolean; retryAfterSec: number | null }>(
        "lock_unlock",
        { pin },
      );
      if (result.ok) {
        this.#startCountdown(null);
        this.resetPendingUntil = null;
        return this.#enter("unlocked");
      }
      this.#startCountdown(result.retryAfterSec);
      this.error = result.retryAfterSec ? "Çok fazla hatalı deneme." : "PIN yanlış.";
    });
  }

  recover(recoveryCode: string, newPin: string) {
    return this.#run(async () => {
      const result = await this.#invoke<{ recoveryCode: string }>("lock_recover", {
        recoveryCode,
        newPin,
      });
      this.recoveryCode = result.recoveryCode;
      this.#enter("showRecovery");
    });
  }

  requestReset() {
    return this.#run(async () => {
      this.resetPendingUntil = (
        await this.#invoke<{ resetPendingUntil: string }>("lock_request_reset")
      ).resetPendingUntil;
    });
  }

  /** The new recovery code was saved: continue into the app (or the PIN screen if the backend did not unlock). */
  finishRecovery() {
    this.recoveryCode = "";
    return this.#run(async () => {
      const status = await this.#invoke<LockStatus>("lock_status");
      this.#apply(status);
      this.#enter(status.unlocked ? "unlocked" : "locked");
    });
  }

  /** Runs before locking (App sets it to flush the archive, which refuses writes while locked). */
  beforeLock: () => Promise<void> = async () => {};

  async lockNow() {
    await this.beforeLock();
    try {
      await this.#invoke("lock_now");
    } catch (e) {
      this.error = errorMessage(e);
    }
    this.#enter("locked");
  }

  showRecoverForm() {
    this.#enter("recover");
  }

  showLocked() {
    this.#enter("locked");
  }

  async change(pin: string, newPin: string) {
    await this.#invoke("lock_change", { pin, newPin });
  }

  async newRecoveryCode(pin: string) {
    return (await this.#invoke<{ recoveryCode: string }>("lock_new_recovery_code", { pin }))
      .recoveryCode;
  }

  /** Call on pointer/keyboard activity; restarts the idle timer while unlocked. */
  touch() {
    if (!this.#desktop || this.state !== "unlocked") return;
    if (this.#idle) clearTimeout(this.#idle);
    this.#idle = setTimeout(() => void this.lockNow(), this.#idleMs);
  }

  #apply(status: LockStatus) {
    this.resetPendingUntil = status.resetPendingUntil;
    this.#startCountdown(status.retryAfterSec);
  }

  #enter(state: LockState) {
    this.state = state;
    this.error = "";
    if (this.#idle) clearTimeout(this.#idle);
    this.#idle = null;
    this.touch();
  }

  async #run(action: () => Promise<void>) {
    this.busy = true;
    this.error = "";
    try {
      await action();
    } catch (e) {
      this.error = errorMessage(e);
    } finally {
      this.busy = false;
    }
  }

  #startCountdown(seconds: number | null) {
    if (this.#countdown) clearInterval(this.#countdown);
    this.#countdown = null;
    this.retryAfterSec = seconds && seconds > 0 ? seconds : null;
    if (this.retryAfterSec === null) return;
    this.#countdown = setInterval(() => {
      const left = (this.retryAfterSec ?? 0) - 1;
      if (left > 0) return void (this.retryAfterSec = left);
      this.#startCountdown(null);
    }, COUNTDOWN_TICK_MS);
  }
}

export const lock = new LockController();
