import { isDesktop } from "$lib/platform";

export type LockState =
  | "checking"
  | "firstUser"
  | "showRecovery"
  | "pickUser"
  | "pin"
  | "initialPin"
  | "recover"
  | "unlocked";
export type Invoke = <T>(command: string, args?: Record<string, unknown>) => Promise<T>;

export const IDLE_LOCK_MS = 10 * 60 * 1000;
const COUNTDOWN_TICK_MS = 1000;
export const AUDIT_LIMIT = 200;
export const PIN_PATTERN = /^\d{4,8}$/;
export const PIN_HINT = "PIN 4–8 haneli rakamlardan oluşmalıdır.";
/** Rust error for a user whose PIN was reset; answered by user_set_initial_pin. */
export const NEEDS_INITIAL_PIN = "Bu kullanıcı için yeni PIN belirlenmeli.";

export interface LockUser {
  id: string;
  name: string;
  title: string;
}

export interface UserRow extends LockUser {
  hasPin: boolean;
  resetPendingUntil: string | null;
}

export interface AuditRow {
  id: number;
  startedAt: string;
  at: string;
  userName: string;
  action: string;
  periodId: string | null;
  detail: string;
}

export interface NewUser {
  name: string;
  title: string;
  pin: string;
}

interface LockStatus {
  configured: boolean;
  unlocked: boolean;
  currentUser: LockUser | null;
}

const tauriInvoke: Invoke = async (command, args) =>
  (await import("@tauri-apps/api/core")).invoke(command, args);

/** Rust errors arrive as Turkish strings; they are shown as they are. */
export const errorMessage = (error: unknown): string =>
  typeof error === "string" ? error : error instanceof Error ? error.message : "Beklenmeyen hata.";

export const resetNote = (until: string): string =>
  `Sıfırlama ${new Date(until).toLocaleString("tr-TR", { dateStyle: "long", timeStyle: "short" })} tarihinde gerçekleşecek.`;

const toLockUser = ({ id, name, title }: LockUser): LockUser => ({ id, name, title });

/** App-lock state machine for the desktop shell; on the web it is always unlocked and never calls out. */
export class LockController {
  state = $state<LockState>("checking");
  error = $state("");
  busy = $state(false);
  recoveryCode = $state("");
  retryAfterSec = $state<number | null>(null);
  users = $state<UserRow[]>([]);
  selectedUser = $state<UserRow | null>(null);
  currentUser = $state<LockUser | null>(null);
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
      await this.#route(await this.#invoke<LockStatus>("lock_status"));
    } catch (e) {
      this.#enter("pickUser");
      this.error = errorMessage(e);
    }
  }

  /** First run: creates the first user, who is logged in; the school recovery code is shown once. */
  createFirstUser(user: NewUser) {
    return this.#run(async () => {
      const result = await this.#invoke<{ user: LockUser; recoveryCode: string | null }>(
        "user_create",
        { ...user },
      );
      this.currentUser = toLockUser(result.user);
      this.recoveryCode = result.recoveryCode ?? "";
      this.#enter(result.recoveryCode ? "showRecovery" : "unlocked");
    });
  }

  selectUser(user: UserRow) {
    this.selectedUser = user;
    this.#startCountdown(null);
    this.#enter(user.hasPin ? "pin" : "initialPin");
  }

  showPicker() {
    this.selectedUser = null;
    this.#startCountdown(null);
    this.#enter("pickUser");
  }

  unlock(pin: string) {
    return this.#run(async () => {
      const user = this.#selected();
      try {
        const result = await this.#invoke<{ ok: boolean; retryAfterSec: number | null }>(
          "user_login",
          { userId: user.id, pin },
        );
        if (result.ok) return this.#loggedIn(user);
        this.#startCountdown(result.retryAfterSec);
        this.error = result.retryAfterSec ? "Çok fazla hatalı deneme." : "PIN yanlış.";
      } catch (e) {
        if (errorMessage(e) !== NEEDS_INITIAL_PIN) throw e;
        this.#enter("initialPin");
      }
    });
  }

  setInitialPin(pin: string) {
    return this.#run(async () => {
      const user = this.#selected();
      await this.#invoke("user_set_initial_pin", { userId: user.id, pin });
      this.#loggedIn(user);
    });
  }

  showRecoverForm() {
    this.#enter("recover");
  }

  recover(userId: string, recoveryCode: string, newPin: string) {
    return this.#run(async () => {
      const result = await this.#invoke<{ recoveryCode: string }>("lock_recover", {
        recoveryCode,
        userId,
        newPin,
      });
      this.currentUser = this.users.find((u) => u.id === userId) ?? null;
      this.recoveryCode = result.recoveryCode;
      this.#enter("showRecovery");
    });
  }

  /** Starts the 24 h PIN reset for the selected user. */
  requestReset() {
    return this.#run(async () => {
      const user = this.#selected();
      const { resetPendingUntil } = await this.#invoke<{ resetPendingUntil: string }>(
        "lock_request_reset",
        { userId: user.id },
      );
      this.selectedUser = { ...user, resetPendingUntil };
      this.users = this.users.map((u) => (u.id === user.id ? { ...u, resetPendingUntil } : u));
    });
  }

  /** The new recovery code was saved: continue into the app (or the picker if the backend did not log in). */
  finishRecovery() {
    this.recoveryCode = "";
    return this.#run(async () => this.#route(await this.#invoke<LockStatus>("lock_status")));
  }

  /** Runs before locking (App sets it to flush the archive, which refuses writes while locked). */
  beforeLock: () => Promise<void> = async () => {};

  async lockNow() {
    await this.beforeLock();
    let failure = "";
    try {
      await this.#invoke("lock_now");
      await this.#loadUsers();
    } catch (e) {
      failure = errorMessage(e);
    }
    this.currentUser = null;
    this.selectedUser = null;
    this.#enter("pickUser");
    this.error = failure;
  }

  async usersList(): Promise<UserRow[]> {
    return (this.users = await this.#invoke<UserRow[]>("users_list"));
  }

  createUser(user: NewUser) {
    return this.#invoke("user_create", { ...user });
  }

  async updateUser(userId: string, name: string, title: string) {
    await this.#invoke("user_update", { userId, name, title });
    if (this.currentUser?.id === userId) this.currentUser = { id: userId, name, title };
  }

  resetUserPin(userId: string) {
    return this.#invoke("user_reset_pin", { userId });
  }

  removeUser(userId: string) {
    return this.#invoke("user_remove", { userId });
  }

  async change(pin: string, newPin: string) {
    await this.#invoke("user_change_pin", { pin, newPin });
  }

  async newRecoveryCode(pin: string) {
    return (await this.#invoke<{ recoveryCode: string }>("lock_new_recovery_code", { pin }))
      .recoveryCode;
  }

  auditList(periodId: string | null) {
    return this.#invoke<AuditRow[]>("audit_list", { limit: AUDIT_LIMIT, periodId });
  }

  lastEditor(periodId: string) {
    return this.#invoke<{ userName: string; at: string } | null>("periods_last_editor", {
      periodId,
    });
  }

  /** Call on pointer/keyboard activity; restarts the idle timer while unlocked. */
  touch() {
    if (!this.#desktop || this.state !== "unlocked") return;
    if (this.#idle) clearTimeout(this.#idle);
    this.#idle = setTimeout(() => void this.lockNow(), this.#idleMs);
  }

  #selected(): UserRow {
    if (!this.selectedUser) throw new Error("Kullanıcı seçilmedi.");
    return this.selectedUser;
  }

  #loggedIn(user: LockUser) {
    this.#startCountdown(null);
    this.currentUser = toLockUser(user);
    this.#enter("unlocked");
  }

  async #loadUsers() {
    this.users = await this.#invoke<UserRow[]>("users_list");
  }

  async #route(status: LockStatus) {
    if (!status.configured) return this.#enter("firstUser");
    if (status.unlocked) {
      this.currentUser = status.currentUser;
      return this.#enter("unlocked");
    }
    await this.#loadUsers();
    this.#enter("pickUser");
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
