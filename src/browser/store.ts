import { createStore } from "jotai/vanilla";
import { atomWithStorage, createJSONStorage } from "jotai/vanilla/utils";

export type RicoFace = "Rico_1" | "Rico_2";

export const DEFAULT_FACE: RicoFace = "Rico_1";
export const DEFAULT_SIZE = 72;
export const DEFAULT_TEXT = "Do not go gentle into that good night.";

const options = { getOnInit: true } as const;

export const faceAtom = atomWithStorage(
  "rico:face",
  DEFAULT_FACE,
  createJSONStorage<RicoFace>(),
  options,
);

export const sizeAtom = atomWithStorage(
  "rico:size",
  DEFAULT_SIZE,
  createJSONStorage<number>(),
  options,
);

export const textAtom = atomWithStorage(
  "rico:text",
  DEFAULT_TEXT,
  createJSONStorage<string>(),
  options,
);

export const ricoStore = createStore();
