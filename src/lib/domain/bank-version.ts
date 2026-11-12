// Version of the shared question bank, e.g. "2026.1"; a period records the one it started from.
// Kept apart from question-bank.ts so assessment.ts can read it without an import cycle.
import mebData from "../data/questions.json";

export const BANK_VERSION: string = (mebData as { version: string }).version;
