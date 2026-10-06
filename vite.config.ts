import { cp } from "node:fs/promises";
import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type Plugin } from "vite";

const resolve = (path: string): string =>
  fileURLToPath(new URL(path, import.meta.url));

// Font binaries are referenced by next/font at consumer build time, so they
// are copied verbatim instead of being bundled.
const copyFontAssets = (): Plugin => ({
  name: "copy-font-assets",
  apply: "build",
  async writeBundle() {
    await cp(resolve("./src/Yukino"), resolve("./build/Yukino"), {
      recursive: true,
    });
    await cp(resolve("./src/Rico"), resolve("./build/Rico"), {
      recursive: true,
    });
  },
});

// Two modes:
//   vite build --mode lib  — font package (build/, lib mode, d.ts via tsc)
//   vite / vite build      — fe (dist/, GitHub Pages)
export default defineConfig(({ command, mode }) => {
  if (mode === "lib") {
    return {
      plugins: [copyFontAssets()],
      build: {
        outDir: resolve("./build"),
        emptyOutDir: true,
        minify: false,
        lib: {
          entry: {
            index: resolve("./src/index.ts"),
            extended: resolve("./src/extended.ts"),
            rico: resolve("./src/rico.ts"),
          },
          formats: ["es"],
        },
        rollupOptions: {
          external: ["next", "next/font/local"],
          output: { entryFileNames: "[name].js" },
        },
      },
    };
  }

  return {
    root: resolve("./src/fe"),
    base: command === "build" ? "/yukino-fonts/" : "/",
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": resolve("./src/fe"),
      },
    },
    build: {
      outDir: resolve("./dist"),
      emptyOutDir: true,
    },
  };
});
