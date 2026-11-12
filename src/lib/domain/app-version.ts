// The running app's version, recorded in every saved period (meta.appVersion).
import { version } from "../../../package.json";

export const APP_VERSION: string = version;

/** Current time as an ISO string; domain functions take `now` as a parameter so tests can fix it. */
export const nowIso = (): string => new Date().toISOString();
