const OPENABLE = /\.(json|xlsx)$/i;

/** True when a dragged item carries files (not text selected inside an input). */
export function dragHasFiles(types: readonly string[] | undefined): boolean {
  return Array.from(types ?? []).includes("Files");
}

/** Only these file types can be opened by drag and drop. */
export function isOpenableFile(name: string): boolean {
  return OPENABLE.test(name);
}

export const UNSUPPORTED_DROP_MESSAGE = "Yalnız .json ve .xlsx dosyaları açılabilir.";
