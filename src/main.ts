import { mount } from "svelte";
import "./app.css";
import App from "./App.svelte";
import { applyTheme, theme } from "./lib/theme.svelte";

// Before the first frame, so a dark choice never flashes white.
applyTheme(theme.isDark);

export default mount(App, { target: document.getElementById("app")! });
