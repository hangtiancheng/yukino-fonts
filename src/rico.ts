

import localFont from "next/font/local";

export const Rico1 = localFont({
  src: [
    {
      path: "./Rico/Rico_1-Regular.ttf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-rico1",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

export const Rico2 = localFont({
  src: [
    {
      path: "./Rico/Rico_2-Regular.ttf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-rico2",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});
