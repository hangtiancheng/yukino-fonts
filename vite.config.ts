

import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig(({ command }) => ({
  root: fileURLToPath(new URL("./fe", import.meta.url)),
  base: command === "build" ? "/yukino-fonts/" : "/",
  plugins: [tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./fe/src", import.meta.url)),
    },
  },
  build: {
    outDir: fileURLToPath(new URL("./dist", import.meta.url)),
    emptyOutDir: true,
  },
}));
