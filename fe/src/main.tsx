

import "@/index.css";

import { createRoot } from "@yukino.js/lit-jsx";
import { ricoStore, faceAtom, sizeAtom, textAtom } from "@/store";
import App from "@/app";
import rico1Url from "../../src/Rico/Rico_1-Regular.ttf";
import rico2Url from "../../src/Rico/Rico_2-Regular.ttf";

// Preload both Rico faces at Low priority. Vite asset imports guarantee the
// preload href matches the @font-face url() byte-for-byte in dev and build.
// All text on this page is JS-rendered, so these requests beat the first
// font-usage trigger and carry the low-priority mark. crossorigin is
// mandatory for as="font" preloads (font fetches are always CORS-mode).
for (const href of [rico1Url, rico2Url]) {
  const link = document.createElement("link");
  link.rel = "preload";
  link.as = "font";
  link.type = "font/ttf";
  link.crossOrigin = "anonymous";
  link.setAttribute("fetchpriority", "low");
  link.href = href;
  document.head.appendChild(link);
}

const app = document.getElementById("app");
if (!app) {
  throw new Error("Missing #app container.");
}

const root = createRoot(app);
const render = (): void => {
  root.render(<App />);
};

// Any persisted atom change re-renders the root view; the values themselves
// are read imperatively from the vanilla store inside App().
const unsubscribes = [faceAtom, sizeAtom, textAtom].map((atom) =>
  ricoStore.sub(atom, render),
);

render();

window.addEventListener("beforeunload", () => {
  for (const unsub of unsubscribes) unsub();
  root.unmount();
});
