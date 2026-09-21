import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      // Matche uniquement les imports "@/..." (un "/" est requis après "@").
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  esbuild: {
    // JSX via le runtime automatique de React 19 (react/jsx-runtime),
    // sans @vitejs/plugin-react (incompatible avec la vite 7 installée par vitest).
    jsx: "automatic",
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
    },
  },
});
