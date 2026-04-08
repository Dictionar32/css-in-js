# API Reference — `@tailwind-styled/compiler`

Zero-runtime CSS-in-JS compiler — transform `tw.*` source code menjadi CSS atomic yang dioptimasi di build time.

## Import

```ts
import {
  transformSource,
  compileCssFromClasses,
  runIncrementalBuild,
} from "@tailwind-styled/compiler"

// Internal API (subpath ./internal)
import { createCompilerContext } from "@tailwind-styled/compiler/internal"
```

## Fungsi Utama

### `transformSource(source, options?)`

Transform satu file source — ekstrak `tw.*` calls, kompilasi CSS, return kode yang sudah ditransform.

```ts
const result = await transformSource(source, {
  filename: "Button.tsx",
  preserveImports: true,
})

// result.code    → source yang sudah ditransform
// result.css     → CSS yang digenerate untuk file ini
// result.classes → daftar class yang ditemukan
// result.map     → sourcemap (jika tersedia)
```

**Options:**

| Option | Tipe | Default | Keterangan |
|---|---|---|---|
| `filename` | `string` | `"unknown"` | Nama file untuk error reporting |
| `preserveImports` | `boolean` | `true` | Jangan hapus import `tw`, `cx`, `cv`, `cn` |
| `deadStyleElimination` | `boolean` | `true` | Hapus CSS yang tidak dipakai |
| `atomicCss` | `boolean` | `false` | Output atomic CSS (satu rule per property) |
| `minify` | `boolean` | `false` | Minify CSS output |

---

### `compileCssFromClasses(classes[], options?)`

Compile array class langsung ke CSS tanpa parse source:

```ts
const { css, resolved, unresolved } = await compileCssFromClasses(
  ["flex", "items-center", "px-4", "hover:bg-blue-600"],
  { prefix: "my-app" }
)
// resolved   → class yang berhasil dikompilasi
// unresolved → class yang tidak dikenal (di-fallback ke @apply)
```

---

### `runIncrementalBuild(files, previousResult?)`

Build inkremental — hanya recompile file yang berubah:

```ts
const result = await runIncrementalBuild(
  ["src/Button.tsx", "src/Card.tsx"],
  previousBuildResult  // dari build sebelumnya
)
// result.css          → CSS gabungan semua file
// result.changedFiles → file yang di-recompile
// result.cacheHitRate → % file yang skip recompile
```

---

## Pipeline Internal

```
transformSource()
    │
    ├─ astParser.ts       → parse source, temukan tw.* nodes
    ├─ astTransform.ts    → transform AST
    ├─ variantCompiler.ts → resolve variant prefix (hover:, md:, dll.)
    ├─ staticVariantCompiler.ts → compile variant statis
    ├─ cssCompiler.ts     → generate CSS dari class list
    ├─ deadStyleEliminator.ts → hapus CSS tidak dipakai
    └─ incrementalEngine.ts   → cache + diff antar build
```

---

## Dead Style Elimination

Compiler mendeteksi JSX prop usage melalui `extractComponentUsage` (Rust) dan menghapus CSS rule yang tidak pernah dipakai:

```ts
// Source:
const Button = tw.button({
  variants: { intent: { primary: "bg-blue-600", danger: "bg-red-600" } }
})

// Di JSX hanya pakai intent="primary"
// → CSS untuk "danger" dihapus dari output
```

---

## Subpath Exports

| Import | Keterangan |
|---|---|
| `@tailwind-styled/compiler` | Public API |
| `@tailwind-styled/compiler/internal` | Internal helpers untuk adapter (next/vite/rspack) |