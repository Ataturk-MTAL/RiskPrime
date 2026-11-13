// Excel templates people fill in and load with "Dosya aç".
import { downloadUrl } from "$lib/export/download";
import { store } from "$lib/state.svelte";

const MEB_TEMPLATE_FILE = "riskprime-meb-kl-sablonu.xlsx";

/** Empty three-sheet import template (built in the browser). */
export function downloadBlankTemplate(): void {
  void store.exportAs("template");
}

/** Template pre-filled with the MEB KL-01–KL-43 series (static file, pnpm generate:sample). */
export function downloadMebTemplate(): void {
  downloadUrl(`${import.meta.env.BASE_URL}samples/${MEB_TEMPLATE_FILE}`, MEB_TEMPLATE_FILE).catch(
    (error: unknown) =>
      store.fail([`Şablon indirilemedi: ${error instanceof Error ? error.message : ""}`]),
  );
}
