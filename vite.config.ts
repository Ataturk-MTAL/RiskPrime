import { defineConfig, lazyPlugins } from "vite-plus";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  fmt: {},
  lint: {
    // shadcn-svelte output is generated; its .svelte re-exports confuse the type-aware lint.
    ignorePatterns: ["src/lib/components/ui/**", "dist/**"],
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    options: { typeAware: true, typeCheck: true },
  },
  // Relative base so the build works under any GitHub Pages sub-path.
  base: "./",
  plugins: lazyPlugins(() => [tailwindcss(), svelte()]),
  resolve: {
    alias: { $lib: fileURLToPath(new URL("./src/lib", import.meta.url)) },
  },
  test: {
    include: ["src/**/*.test.ts", "scripts/**/*.test.mjs"],
  },
});
