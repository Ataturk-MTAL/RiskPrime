// Light / dark / system: the pure part, unit tested; theme.svelte.ts keeps the live state.
export type ThemeChoice = "light" | "dark" | "system";

export const parseThemeChoice = (stored: string | null): ThemeChoice =>
  stored === "light" || stored === "dark" ? stored : "system";

export const isDarkFor = (choice: ThemeChoice, systemPrefersDark: boolean): boolean =>
  choice === "dark" || (choice === "system" && systemPrefersDark);
