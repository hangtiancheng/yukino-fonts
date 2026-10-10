import localFont from "next/font/local";

export const YukinoExtended = localFont({
  src: [
    {
      path: "./Yukino/WOFF2/Yukino-Extended.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./Yukino/WOFF2/Yukino-ExtendedItalic.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "./Yukino/WOFF2/Yukino-ExtendedBold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "./Yukino/WOFF2/Yukino-ExtendedBoldItalic.woff2",
      weight: "700",
      style: "italic",
    },
  ],
  variable: "--font-yukino-extended",
  fallback: [
    "Maple Mono",
    "Menlo",
    "Cascadia Code",
    "Liberation Mono",
    "DejaVu Sans Mono",
    "monospace",
  ],
});
