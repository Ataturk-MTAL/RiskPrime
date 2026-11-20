// The theme the user picked (Dosya menu). The .dark class on <html> switches the tokens in app.css.
import { MediaQuery } from "svelte/reactivity";
import { isDesktop } from "./platform";
import { isDarkFor, parseThemeChoice, type ThemeChoice } from "./theme-choice";

const STORAGE_KEY = "riskprime-theme";
const systemDark = new MediaQuery("(prefers-color-scheme: dark)");

function stored(): ThemeChoice {
  try {
    return parseThemeChoice(localStorage.getItem(STORAGE_KEY));
  } catch {
    return "system"; // storage blocked (private window, locked-down profile): follow the system
  }
}

/** Desktop only: keeps the native title bar in step; null hands the choice back to the OS. */
async function syncTitleBar(choice: ThemeChoice) {
  if (!isDesktop()) return;
  try {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    await getCurrentWindow().setTheme(choice === "system" ? null : choice);
  } catch {
    // cosmetic only: the title bar keeps its current look
  }
}

class Theme {
  choice = $state<ThemeChoice>(stored());

  get isDark(): boolean {
    return isDarkFor(this.choice, systemDark.current);
  }

  set(choice: ThemeChoice) {
    this.choice = choice;
    void syncTitleBar(choice);
    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      // not persisted; the choice still applies until the app closes
    }
  }
}

export const theme = new Theme();

// A saved choice must reach the title bar at startup too, not only on a menu pick.
void syncTitleBar(theme.choice);

/** Puts the current theme on <html>; Tailwind's scheme-dark also themes scrollbars and native inputs. */
export function applyTheme(isDark: boolean) {
  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.classList.toggle("scheme-dark", isDark);
}
