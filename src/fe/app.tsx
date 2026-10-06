import {
  ricoStore,
  faceAtom,
  sizeAtom,
  textAtom,
  type RicoFace,
} from "@/store";

const FACES: { id: RicoFace; label: string }[] = [
  { id: "Rico_1", label: "Rico 1" },
  { id: "Rico_2", label: "Rico 2" },
];

/** Tailwind utility for the active face (both names are literal so the v4 scanner picks them up). */
const faceClass = (face: RicoFace): string =>
  face === "Rico_1" ? "font-rico-1" : "font-rico-2";

const setFace = (face: RicoFace): void => void ricoStore.set(faceAtom, face);

function SectionTitle(props: { children: string }): unknown {
  return (
    <h2 className="mb-3 text-xs font-semibold tracking-widest text-neutral-400">
      {props.children}
    </h2>
  );
}

function Header(props: { face: RicoFace }): unknown {
  return (
    <header className="sticky top-0 z-10 border-b border-neutral-200 bg-neutral-50/85 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
        <span className={`text-2xl leading-none ${faceClass(props.face)}`}>
          Rico
        </span>
        <div className="flex items-center gap-1 rounded-full border border-neutral-200 bg-white p-1 shadow-sm">
          {FACES.map(({ id, label }) => (
            <button
              type="button"
              onClick={() => setFace(id)}
              className={`cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                props.face === id
                  ? "bg-neutral-900 text-white"
                  : "text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}

function Hero(props: { face: RicoFace }): unknown {
  return (
    <section className="mx-auto max-w-4xl px-4 pt-16 pb-12 text-center">
      <p className="text-xs font-semibold tracking-widest text-violet-500">
        A Latin-only handwritten display typeface
      </p>
      <h1
        className={`mt-6 text-7xl leading-none text-neutral-900 sm:text-8xl ${faceClass(props.face)}`}
      >
        Rico
      </h1>
    </section>
  );
}

function Tester(props: {
  face: RicoFace;
  size: number;
  text: string;
}): unknown {
  const onSize = (e: Event): void => {
    ricoStore.set(
      sizeAtom,
      Number((e.currentTarget as HTMLInputElement).value),
    );
  };
  const onText = (e: Event): void => {
    ricoStore.set(textAtom, (e.currentTarget as HTMLTextAreaElement).value);
  };
  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <SectionTitle>Type tester</SectionTitle>
      <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <label className="flex items-center gap-2 text-xs text-neutral-500">
          <span className="w-16 tabular-nums">{props.size} px</span>
          <input
            type="range"
            min="12"
            max="160"
            step="1"
            value={String(props.size)}
            onInput={onSize}
            onChange={onSize}
            className="w-44 accent-violet-500"
          />
        </label>
        <textarea
          rows={2}
          value={props.text}
          onChange={onText}
          spellcheck={false}
          placeholder="Type something — Latin only..."
          className="mt-4 w-full resize-none rounded-lg border border-neutral-200 p-3 text-sm outline-hidden focus:border-violet-400"
        />
        <div
          className={`mt-6 min-h-32 text-center leading-tight wrap-break-word text-neutral-900 ${faceClass(props.face)}`}
          style={{ fontSize: `${props.size}px` }}
        >
          {props.text.length ? props.text : "Rico"}
        </div>
      </div>
    </section>
  );
}

const CHAR_GROUPS: { label: string; chars: string }[] = [
  { label: "Uppercase", chars: "ABCDEFGHIJKLM\nNOPQRSTUVWXYZ" },
  { label: "Lowercase", chars: "abcdefghijklm\nnopqrstuvwxyz" },
  { label: "Digits", chars: "0123456789" },
];

function Charset(props: { face: RicoFace }): unknown {
  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <SectionTitle>Character set</SectionTitle>
      <div className="grid gap-3 sm:grid-cols-3">
        {CHAR_GROUPS.map(({ label, chars }) => (
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium tracking-widest text-neutral-400">
              {label}
            </p>
            <p
              className={`mt-2 text-2xl leading-snug whitespace-pre-line text-neutral-900 ${faceClass(props.face)}`}
            >
              {chars}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Compare(props: { face: RicoFace }): unknown {
  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <SectionTitle>The two cuts</SectionTitle>
      <div className="grid gap-3 sm:grid-cols-2">
        {FACES.map(({ id, label }) => (
          <button
            type="button"
            onClick={() => setFace(id)}
            className={`cursor-pointer rounded-xl border bg-white p-5 text-left shadow-sm transition-colors ${
              props.face === id
                ? "border-violet-400 ring-2 ring-violet-100"
                : "border-neutral-200 hover:border-neutral-300"
            }`}
          >
            <p
              className={`text-5xl leading-none text-neutral-900 ${faceClass(id)}`}
            >
              Rico
            </p>
            <p className={`mt-3 text-lg text-neutral-700 ${faceClass(id)}`}>
              The quick brown fox jumps over the lazy dog.
            </p>
            <p className="mt-4 text-[10px] font-medium tracking-widest text-neutral-400">
              {props.face === id ? `${label} — active` : `Try ${label}`}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}

function Install(): unknown {
  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <SectionTitle>Use it in your project</SectionTitle>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-neutral-100 p-4 shadow-sm">
          <p className="mb-2 text-xs font-medium tracking-widest text-neutral-500">
            Next.js
          </p>
          <pre className="text-xs leading-5 wrap-break-word whitespace-pre-wrap text-neutral-800">
            {`import { Rico1, Rico2 } from "@yukino.js/fonts/rico";

export default function Page() {
  return (
    <main className={Rico1.variable}>
      <p style={{ fontFamily: "var(--font-rico1)" }}>
        Hello from Rico 1.
      </p>
    </main>
  );
}`}
          </pre>
        </div>
        <div className="rounded-xl border border-neutral-200 bg-neutral-100 p-4 shadow-sm">
          <p className="mb-2 text-xs font-medium tracking-widest text-neutral-500">
            Plain CSS
          </p>
          <pre className="text-xs leading-5 wrap-break-word whitespace-pre-wrap text-neutral-800">
            {`@font-face {
  font-family: "Rico 2";
  src: url("@yukino.js/fonts/Rico/Rico_2-Regular.ttf") format("truetype");
}

h1 {
  font-family: "Rico 2", cursive;
}`}
          </pre>
        </div>
      </div>
    </section>
  );
}

function Footer(): unknown {
  return (
    <footer className="border-t border-neutral-200 py-10">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 text-xs text-neutral-500">
        <span>
          Rico is part of{" "}
          <a
            href="https://www.npmjs.com/package/@yukino.js/fonts"
            target="_blank"
            rel="noreferrer"
            className="text-neutral-700 underline-offset-2 hover:underline"
          >
            @yukino.js/fonts
          </a>
          .
        </span>
        <a
          href="https://github.com/hangtiancheng/yukino-fonts"
          target="_blank"
          rel="noreferrer"
          className="text-neutral-700 underline-offset-2 hover:underline"
        >
          GitHub · MIT
        </a>
      </div>
    </footer>
  );
}

/** Root view rendered by the lit-jsx runtime; re-rendered on store changes. */
export default function App(): unknown {
  const face = ricoStore.get(faceAtom);
  const size = ricoStore.get(sizeAtom);
  const text = ricoStore.get(textAtom);
  return (
    <div className="min-h-dvh bg-neutral-50 text-neutral-900 antialiased">
      <Header face={face} />
      <main>
        <Hero face={face} />
        <Tester face={face} size={size} text={text} />
        <Charset face={face} />
        <Compare face={face} />
        <Install />
      </main>
      <Footer />
    </div>
  );
}
