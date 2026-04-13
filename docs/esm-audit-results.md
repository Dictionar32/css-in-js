# ESM Audit Results

Generated dari audit script. Diupdate secara berkala.

## Status: In Progress

### ✅ Packages ESM-only (tidak ada CJS patterns)
- `@tailwind-styled/engine` — ESM-only, tidak ada createRequire
- `@tailwind-styled/core` — ESM-only
- `@tailwind-styled/shared` — menggunakan `createEsmRequire` helper
- `@tailwind-styled/cli` — ESM-only
- `@tailwind-styled/theme` — ESM-only
- `@tailwind-styled/vue` — ESM-only
- `@tailwind-styled/svelte` — ESM-only
- `@tailwind-styled/devtools` — ESM-only

### ⚠️ Packages dengan CJS patterns (butuh migrasi Wave 1)

#### `@tailwind-styled/compiler`
- `cssCompiler.ts` — `createRequire()` untuk load native binding
- `astParser.ts` — `createRequire()` untuk load oxc-parser
- `nativeBridge.ts` — `createRequire()` untuk load .node binary
- `rustCssCompiler.ts` — `createRequire()` untuk load rust binary
- `loadTailwindConfig.ts` — `createRequire()` untuk load tailwind config

> **Acceptable**: `createRequire()` diperlukan untuk load `.node` binary di ESM context.
> Ini bukan anti-pattern — ini adalah cara yang benar untuk load NAPI bindings dari ESM.
> Gunakan `createEsmRequire()` dari shared untuk konsistensi.

#### `@tailwind-styled/scanner`
- `in-memory-cache.ts`, `ast-native.ts`, `index.ts`, `oxc-bridge.ts`, `native-bridge.ts`
- Semua menggunakan `createRequire()` untuk load native bindings

> **Acceptable**: Same reason as compiler — NAPI loading requires createRequire.

#### `@tailwind-styled/next`
- `withTailwindStyled.ts` — `fileURLToPath(import.meta.url)` untuk __dirname pattern

> **Action**: Migrasi ke `getDirname(import.meta.url)` dari shared/esmHelpers.

#### `@tailwind-styled/rspack`
- `index.ts` — `fileURLToPath(import.meta.url)` untuk __dirname pattern

> **Action**: Migrasi ke `getDirname(import.meta.url)` dari shared/esmHelpers.

## Migration Plan

Wave 1 actions (immediate):
1. Replace `path.dirname(fileURLToPath(import.meta.url))` dengan `getDirname(import.meta.url)`
2. Replace `createRequire(import.meta.url)` dengan `createEsmRequire(import.meta.url)` di non-native code
3. Untuk native binding loading: tetap gunakan `createRequire` karena ini adalah requirement NAPI

Wave 2 (after Wave 1 complete):
1. Audit contoh/examples untuk ESM-first consumption
2. Tambah smoke tests untuk import path

Wave 3 (future, after consumer audit):
1. ESM-only untuk internal packages (engine, cli, devtools)
2. Breaking change + migration note

## Note: createRequire untuk native bindings

`createRequire()` diperlukan dan valid untuk load `.node` NAPI binaries dari ESM.
Ini BUKAN anti-pattern karena:
1. Node.js ESM tidak bisa `import` file `.node` secara langsung
2. `createRequire()` adalah official Node.js API untuk ini
3. Package ini sudah menggunakan pattern yang benar

Yang perlu diperbaiki adalah `createRequire()` untuk load TypeScript/JavaScript modules
biasa yang seharusnya bisa di-`import` langsung.
