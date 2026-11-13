/** True inside the Tauri v2 desktop shell; the single platform check of the app. */
export const isDesktop = (): boolean =>
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
