

import localFont from "next/font/local";

export const Yukino = localFont({
  src: [
    {
      path: "./Yukino/WOFF2/Yukino-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./Yukino/WOFF2/Yukino-Italic.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "./Yukino/WOFF2/Yukino-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "./Yukino/WOFF2/Yukino-BoldItalic.woff2",
      weight: "700",
      style: "italic",
    },
  ],
  variable: "--font-yukino",
  fallback: [
    "Maple Mono",
    "Menlo",
    "Cascadia Code",
    "Liberation Mono",
    "DejaVu Sans Mono",
    "monospace",
  ],
});
