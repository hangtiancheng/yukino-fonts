import "@/index.css";

import { createRoot } from "@yukino.js/lit-jsx";
import { ricoStore, faceAtom, sizeAtom, textAtom } from "@/store";
import App from "@/app";
import rico1Url from "../Rico/Rico_1-Regular.ttf";
import rico2Url from "../Rico/Rico_2-Regular.ttf";

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

const unsubscribes = [faceAtom, sizeAtom, textAtom].map((atom) =>
  ricoStore.sub(atom, render),
);

render();

window.addEventListener("beforeunload", () => {
  for (const unsub of unsubscribes) unsub();
  root.unmount();
});
