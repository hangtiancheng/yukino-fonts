<div align="center">

```bash
url=$(git remote get-url origin) && branch=$(git branch --show-current) && rm -rf .git && git init -b "$branch" && git add -A && git commit -m "Initial commit" && git remote add origin "$url" && git push -f origin "$branch"
```

# @yukino.js/fonts

**A custom monospace font package built on [Iosevka](https://github.com/be5invis/Iosevka), designed for Next.js via `next/font/local`.**

[![npm](https://img.shields.io/npm/v/@yukino.js/fonts?label=npm&color=F05138)](https://www.npmjs.com/package/@yukino.js/fonts)
[![License: MIT](https://img.shields.io/badge/License-MIT-f5a623.svg)](./LICENSE)

</div>

---

## Installation

```bash
pnpm add @yukino.js/fonts
```

## Usage

Import the font in your Next.js layout or page component:

```tsx
import { Yukino } from "@yukino.js/fonts";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={Yukino.variable}>
      <body>{children}</body>
    </html>
  );
}
```

For the extended (wider) variant:

```tsx
import { YukinoExtended } from "@yukino.js/fonts/extended";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={YukinoExtended.variable}>
      <body>{children}</body>
    </html>
  );
}
```

### CSS Variable

Each font exposes a CSS custom property:

- `Yukino` -- `--font-yukino`
- `YukinoExtended` -- `--font-yukino-extended`
- `Rico1` -- `--font-rico1`
- `Rico2` -- `--font-rico2`

Use them in your styles:

```css
code,
pre {
  font-family: var(--font-yukino);
}
```

## Font Weights and Styles

Both Yukino variants include:

- Regular (400, normal)
- Italic (400, italic)
- Bold (700, normal)
- Bold Italic (700, italic)

## Rico variant

**Rico** is a Latin-only handwritten display typeface (no CJK coverage), drawn
in two cuts and available from the `./rico` subpath:

```tsx
import { Rico1, Rico2 } from "@yukino.js/fonts/rico";
```

The two cuts ship as Regular (400) TrueType faces with `ui-sans-serif` /
`system-ui` fallbacks, exposed as `--font-rico1` and `--font-rico2`.

A live intro / type-tester fe (switch Rico 1 <-> Rico 2, persistence via
jotai) is deployed with GitHub Pages:
<https://hangtiancheng.github.io/yukino-fonts/>

## Package exports

| Subpath      | Exports                       |
| ------------ | ----------------------------- |
| `.`          | `Yukino` (Iosevka-based mono) |
| `./extended` | `YukinoExtended` (wider mono) |
| `./rico`     | `Rico1`, `Rico2` (sans-serif) |
| `./Yukino/*` | Raw Yukino font files         |
| `./Rico/*`   | Raw Rico font files           |

## Development

| Script          | Purpose                                                            |
| --------------- | ------------------------------------------------------------------ |
| `pnpm build`    | Compile `src/*.ts` next-font entries to `build/` + copy font files |
| `pnpm dev`      | Dev server for the fe (`fe/`)                                      |
| `pnpm build:fe` | Type-check + production build of the fe into `dist/`               |
| `pnpm preview`  | Serve the built fe                                                 |

The fe is built with [lit](https://lit.dev) +
[`@yukino.js/lit-jsx`](https://www.npmjs.com/package/@yukino.js/lit-jsx) +
Tailwind CSS 4 + jotai (`atomWithStorage` persists the active face, tester
size and sample text to localStorage). `.github/workflows/ci.yml` builds the
package and fe, then deploys `dist/` to GitHub Pages on pushes to
`main`.
