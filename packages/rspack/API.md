# API Reference — `@tailwind-styled/rspack`

Rspack adapter untuk `tailwind-styled-v4` — loader dan plugin untuk Rspack bundler.

## Setup

```js
// rspack.config.mjs
import { defineConfig } from "@rspack/cli"
import { tailwindStyledRspack } from "@tailwind-styled/rspack"

export default defineConfig({
  entry: "./src/index.ts",
  plugins: [tailwindStyledRspack()],
})
```

Dengan options:

```js
tailwindStyledRspack({
  scanDirs: ["src"],
  preserveImports: true,
  debug: false,
})
```

---

## API

### `tailwindStyledRspack(options?)`

Rspack plugin — wrapper utama yang inject loader ke Rspack pipeline.

```ts
import { tailwindStyledRspack } from "@tailwind-styled/rspack"

// options sama dengan adapter lain
tailwindStyledRspack({
  scanDirs: ["src"],          // direktori yang di-scan
  preserveImports: true,      // jaga import tw, cx, cv, cn
  debug: false,               // log transform detail
})
```

---

### Loader (Subpath)

```js
// rspack.config.js — manual loader config
import { tailwindStyledLoader } from "@tailwind-styled/rspack/loader"

module.exports = {
  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        use: [{ loader: tailwindStyledLoader, options: { preserveImports: true } }],
      },
    ],
  },
}
```

---

## Subpath Exports

| Import | Keterangan |
|---|---|
| `@tailwind-styled/rspack` | Plugin utama: `tailwindStyledRspack` |
| `@tailwind-styled/rspack/loader` | Loader mentah untuk konfigurasi manual |

---

## Requirements

- Node.js ≥ 18
- Rspack ≥ 1.0
- Native binding (`tailwind_styled_parser.node`) tersedia

---

## Perbedaan dari Vite/Next.js

- Rspack menggunakan Webpack-compatible loader API
- Tidak ada built-in HMR khusus — Rspack HMR standar tetap berjalan
- Route CSS splitting tidak tersedia (fitur App Router khusus Next.js)

- Tidak ada built-in CSS extraction (fitur khusus Next.js)
- Tidak ada built-in CSS minification (fitur khusus Next.js) 
- Tidak ada built-in CSS source map (fitur khusus Next.js)