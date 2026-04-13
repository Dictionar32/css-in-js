# ESM Migration Guide

## Status

tailwind-styled-v4 adalah **ESM-first** monorepo. Semua packages baru harus ditulis
sebagai ESM (`"type": "module"` di `package.json`) dan menghindari CJS-only patterns.

Packages yang masih expose `require` path tetap melakukannya untuk backward compatibility,
bukan sebagai preferred consumption path.

## Pola yang Harus Dihindari

### ❌ CJS-first patterns

```typescript
// JANGAN: fragile dirname resolution
const __dirname = path.dirname(new URL(import.meta.url).pathname)

// JANGAN: nested require() di ESM yang bukan dinamis
const mod = require("some-package")

// JANGAN: fake global replacement
const importMeta = { url: "file://..." }
```

### ✅ Pola ESM-safe yang direkomendasikan

Gunakan helpers dari `@tailwind-styled/shared`:

```typescript
import { createEsmRequire, getDirname, tryRequire } from "@tailwind-styled/shared"

// Ganti: createRequire(import.meta.url)
const req = createEsmRequire(import.meta.url)

// Ganti: __dirname
const dir = getDirname(import.meta.url)

// Optional dependency dengan fallback
const oxc = tryRequire("oxc-parser", import.meta.url)
```

## Dual Export Pattern

Packages yang masih butuh CJS compatibility menggunakan kondisional exports:

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  }
}
```

## Packages Status

| Package | Format | CJS export | Notes |
|---|---|---|---|
| `shared` | ESM | ✅ dual | Core utilities |
| `compiler` | ESM | ✅ dual | Native binding loader |
| `scanner` | ESM | ✅ dual | Native binding loader |
| `engine` | ESM | ❌ ESM-only | Internal orchestration |
| `cli` | ESM | ❌ ESM-only | CLI scripts |
| `next` | ESM | ✅ dual | Next.js adapter |
| `vite` | ESM | ✅ dual | Vite plugin |
| `rspack` | ESM | ✅ dual | Rspack plugin |
| `vue` | ESM | ✅ dual | Vue adapter |
| `svelte` | ESM | ✅ dual | Svelte adapter |

## Wave Plan

**Wave 1 — Internal Hardening** (selesai sebagian):
- Buat `esmHelpers.ts` di `@tailwind-styled/shared` ✅
- Hapus `__dirname` hardcode dari compiler, scanner _(in progress)_
- Gunakan `createEsmRequire()` secara konsisten

**Wave 2 — Consumer Readiness**:
- Audit semua adapter untuk `require()` consumption path
- Tambah smoke test via `import` path
- Update examples untuk ESM-first

**Wave 3 — ESM-Only Cutover** (future):
- Setelah consumer audit selesai
- Breaking change + migration note
- Hanya untuk internal packages (engine, cli, devtools)
