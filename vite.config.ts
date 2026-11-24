import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "app",
  plugins: [react()],
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
  test: {
    // Tests live next to the code in src/, not under the app root.
    root: fileURLToPath(new URL(".", import.meta.url)),
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
