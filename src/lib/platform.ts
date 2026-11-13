import { toast } from "svelte-sonner";

/** True inside the Tauri v2 desktop shell; the single platform check of the app. */
export const isDesktop = (): boolean =>
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

/** Opens a URL in the system browser: the opener plugin on desktop (target=_blank does nothing there), a new tab on the web. */
export async function openExternal(url: string): Promise<void> {
  if (!isDesktop()) {
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }
  try {
    await (await import("@tauri-apps/plugin-opener")).openUrl(url);
  } catch {
    toast.error("Bağlantı açılamadı.");
  }
}

/** Svelte attachment for `<a href>` / `<Button href>`: on desktop a click goes through openExternal. */
export function externalLink(node: Element): () => void {
  const onClick = (event: Event) => {
    if (!isDesktop()) return;
    const href = node.getAttribute("href");
    if (!href) return;
    event.preventDefault();
    void openExternal(href);
  };
  node.addEventListener("click", onClick);
  return () => node.removeEventListener("click", onClick);
}
