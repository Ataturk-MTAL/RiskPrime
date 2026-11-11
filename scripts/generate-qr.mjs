// Writes the repository QR code used once in the PDF (public/template/github-qr.svg).
// Run with `pnpm generate:qr` after changing REPO_URL.
import { writeFileSync } from "node:fs";
import QRCode from "qrcode";

const REPO_URL = "https://github.com/Ataturk-MTAL/RiskPrime";
const OUT = new URL("../public/template/github-qr.svg", import.meta.url);

const svg = await QRCode.toString(REPO_URL, { type: "svg", errorCorrectionLevel: "M", margin: 0 });
writeFileSync(OUT, svg);
console.log(`QR written for ${REPO_URL}`);
