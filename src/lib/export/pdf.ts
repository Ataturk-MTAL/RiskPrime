// PDF export through typst.ts. The compiler (JS + ~28 MB wasm) is a pinned npm dependency,
// bundled and served from our own origin — nothing is executed from a third-party CDN.
import { $typst, TypstSnippet } from "@myriaddreamin/typst.ts/contrib/all-in-one-lite";
import compilerWasmUrl from "@myriaddreamin/typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm?url";
import { outputName, pdfData, type PdfKind } from "../domain/export-data";
import type { Assessment } from "../domain/types";
import { downloadBlob } from "./download";

const BASE = import.meta.env.BASE_URL;
const FONT_URLS = [`${BASE}fonts/IBMPlexSans-Regular.ttf`, `${BASE}fonts/IBMPlexSans-Bold.ttf`];
const TEMPLATE_URL = `${BASE}template/report.typ`;
const FILE_SUFFIXES: Record<PdfKind, string> = {
  full: "",
  checklists: "kontrol-listeleri",
  blank: "bos-form",
};

async function fetchResource(url: string, as: "text"): Promise<string>;
async function fetchResource(url: string, as: "bytes"): Promise<Uint8Array>;
async function fetchResource(url: string, as: "text" | "bytes"): Promise<string | Uint8Array> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} yüklenemedi (${response.status})`);
  return as === "text" ? response.text() : new Uint8Array(await response.arrayBuffer());
}

let compilerPromise: Promise<typeof $typst> | null = null;

async function loadCompiler(): Promise<typeof $typst> {
  if (location.protocol === "file:") {
    throw new Error(
      "PDF için sayfa bir adresle açılmalı (GitHub Pages ya da yerel sunucu); dosyaya çift tıklayınca PDF üretilemez.",
    );
  }
  $typst.setCompilerInitOptions({ getModule: () => compilerWasmUrl });
  const fonts = await Promise.all(FONT_URLS.map((u) => fetchResource(u, "bytes")));
  // Only our bundled fonts: no default font download from a CDN.
  $typst.use(TypstSnippet.disableDefaultFontAssets(), TypstSnippet.preloadFonts(fonts));
  await $typst.addSource("/report.typ", await fetchResource(TEMPLATE_URL, "text"));
  return $typst;
}

// Loaded once; a failed load is forgotten so the next click retries.
function getCompiler(): Promise<typeof $typst> {
  if (!compilerPromise) {
    compilerPromise = loadCompiler();
    compilerPromise.catch(() => {
      compilerPromise = null;
    });
  }
  return compilerPromise;
}

export async function downloadPdf(a: Assessment, kind: PdfKind): Promise<void> {
  const data = pdfData(a, kind);
  const typst = await getCompiler();
  await typst.mapShadow("/data.json", new TextEncoder().encode(JSON.stringify(data)));
  const pdf = await typst.pdf({ mainFilePath: "/report.typ" });
  if (!pdf) throw new Error("PDF derlenemedi; ayrıntı tarayıcı konsolunda.");
  downloadBlob(
    new Blob([pdf as BlobPart], { type: "application/pdf" }),
    outputName(a, "pdf", FILE_SUFFIXES[kind]),
  );
}
