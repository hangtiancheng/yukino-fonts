

import { createStore } from "jotai/vanilla";
import { atomWithStorage, createJSONStorage } from "jotai/vanilla/utils";

/** The two Rico cuts. */
export type RicoFace = "Rico_1" | "Rico_2";

export const DEFAULT_FACE: RicoFace = "Rico_1";
export const DEFAULT_SIZE = 72;
export const DEFAULT_TEXT = "Do not go gentle into that good night.";

const options = { getOnInit: true } as const;

/** Active font family. Persisted to localStorage via jotai. */
export const faceAtom = atomWithStorage(
  "rico:face",
  DEFAULT_FACE,
  createJSONStorage<RicoFace>(),
  options,
);

/** Type-tester font size in px. Persisted to localStorage via jotai. */
export const sizeAtom = atomWithStorage(
  "rico:size",
  DEFAULT_SIZE,
  createJSONStorage<number>(),
  options,
);

/** Type-tester sample text. Persisted to localStorage via jotai. */
export const textAtom = atomWithStorage(
  "rico:text",
  DEFAULT_TEXT,
  createJSONStorage<string>(),
  options,
);

/**
 * Vanilla (non-React) jotai store. The app has no React — the root view
 * reads atoms imperatively via `ricoStore.get(...)` and re-renders on
 * `ricoStore.sub(...)` notifications.
 */
export const ricoStore = createStore();
