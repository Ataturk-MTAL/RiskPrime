import { toast } from "svelte-sonner";
import { isDesktop } from "$lib/platform";

export interface DesktopSaveDeps {
  /** Native save dialog; resolves null when the user cancels. */
  pickPath(name: string, extension: string): Promise<string | null>;
  write(path: string, bytes: Uint8Array): Promise<void>;
}

const extensionOf = (name: string) => name.slice(name.lastIndexOf(".") + 1).toLowerCase();

/** Desktop save: dialog, then write. Resolves false (no error) when the user cancels. */
export async function saveToDisk(
  blob: Blob,
  name: string,
  deps: DesktopSaveDeps,
): Promise<boolean> {
  const path = await deps.pickPath(name, extensionOf(name));
  if (path === null) return false;
  await deps.write(path, new Uint8Array(await blob.arrayBuffer()));
  return true;
}

const tauriDeps: DesktopSaveDeps = {
  async pickPath(name, extension) {
    const { save } = await import("@tauri-apps/plugin-dialog");
    return save({
      defaultPath: name,
      filters: [{ name: extension.toUpperCase(), extensions: [extension] }],
    });
  },
  async write(path, bytes) {
    const { writeFile } = await import("@tauri-apps/plugin-fs");
    await writeFile(path, bytes);
  },
};

function downloadViaLink(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** The single place files are saved. Resolves whether the file was saved (false: desktop user cancelled). */
export async function downloadBlob(blob: Blob, name: string): Promise<boolean> {
  if (!isDesktop()) {
    downloadViaLink(blob, name);
    return true;
  }
  const saved = await saveToDisk(blob, name, tauriDeps);
  if (saved) toast.success(`Kaydedildi: ${name}`);
  return saved;
}

/** Saves a file served next to the app (e.g. static samples). */
export async function downloadUrl(url: string, name: string): Promise<boolean> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${name} indirilemedi (${response.status}).`);
  return downloadBlob(await response.blob(), name);
}
