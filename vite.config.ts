import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "app",
  base: "/the-museum-of-barsa/",
  plugins: [react()],
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
});
