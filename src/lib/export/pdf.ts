// PDF export through typst.ts (compiler wasm is loaded from a CDN on the first request).
import { outputName, pdfData, type PdfKind } from '../domain/export-data';
import type { Assessment } from '../domain/types';
import { downloadBlob } from './download';

const TYPST_VERSION = '0.7.0';
const CDN = 'https://cdn.jsdelivr.net/npm/@myriaddreamin';
const BUNDLE_URL = `${CDN}/typst.ts@${TYPST_VERSION}/dist/esm/contrib/all-in-one-lite.bundle.js`;
const WASM_URL = `${CDN}/typst-ts-web-compiler@${TYPST_VERSION}/pkg/typst_ts_web_compiler_bg.wasm`;
const BASE = import.meta.env.BASE_URL;
const FONT_URLS = [`${BASE}fonts/IBMPlexSans-Regular.ttf`, `${BASE}fonts/IBMPlexSans-Bold.ttf`];
const TEMPLATE_URL = `${BASE}template/report.typ`;
const FILE_SUFFIXES: Record<PdfKind, string> = { full: '', checklists: 'kontrol-listeleri', blank: 'bos-form' };

// The typst.ts bundle is loaded at runtime from the CDN, so it has no static types.
/* eslint-disable @typescript-eslint/no-explicit-any */
type Typst = any;

async function fetchResource(url: string, as: 'text'): Promise<string>;
async function fetchResource(url: string, as: 'bytes'): Promise<Uint8Array>;
async function fetchResource(url: string, as: 'text' | 'bytes'): Promise<string | Uint8Array> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} yüklenemedi (${response.status})`);
  return as === 'text' ? response.text() : new Uint8Array(await response.arrayBuffer());
}

let compilerPromise: Promise<Typst> | null = null;

async function loadCompiler(): Promise<Typst> {
  if (location.protocol === 'file:') {
    throw new Error('PDF için sayfa bir adresle açılmalı (GitHub Pages ya da yerel sunucu); dosyaya çift tıklayınca PDF üretilemez.');
  }
  const { $typst, TypstSnippet } = await import(/* @vite-ignore */ BUNDLE_URL);
  $typst.setCompilerInitOptions({ getModule: () => WASM_URL });
  const fonts = await Promise.all(FONT_URLS.map((u) => fetchResource(u, 'bytes')));
  $typst.use(TypstSnippet.preloadFonts(fonts));
  await $typst.addSource('/report.typ', await fetchResource(TEMPLATE_URL, 'text'));
  return $typst;
}

// Loaded once; a failed load is forgotten so the next click retries.
function getCompiler(): Promise<Typst> {
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
  const $typst = await getCompiler();
  await $typst.mapShadow('/data.json', new TextEncoder().encode(JSON.stringify(data)));
  const pdf: Uint8Array | undefined = await $typst.pdf({ mainFilePath: '/report.typ' });
  if (!pdf) throw new Error('PDF derlenemedi; ayrıntı tarayıcı konsolunda.');
  downloadBlob(new Blob([pdf as BlobPart], { type: 'application/pdf' }), outputName(a, 'pdf', FILE_SUFFIXES[kind]));
}
