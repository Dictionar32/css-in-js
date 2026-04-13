# CJS Consumer Audit

Dokumen ini mencatat hasil audit consumer CJS per package.
Diupdate sebelum setiap major release yang menghapus `require` export path.

## Status Per Package

| Package | CJS Export | Real CJS Consumers | Action |
|---|---|---|---|
| `@tailwind-styled/shared` | ✅ dual | Semua packages internal | Keep dual |
| `@tailwind-styled/compiler` | ✅ dual | vite-plugin loader (CJS) | Keep dual |
| `@tailwind-styled/scanner` | ✅ dual | compiler (via require) | Keep dual |
| `@tailwind-styled/engine` | ❌ ESM-only | None | ESM-only ✅ |
| `@tailwind-styled/core` | ✅ dual | Next.js Pages Router | Keep dual |
| `@tailwind-styled/next` | ✅ dual | next.config.js (CJS) | Keep dual |
| `@tailwind-styled/vite` | ✅ dual | vite.config.js (CJS) | Keep dual |
| `@tailwind-styled/rspack` | ✅ dual | rspack.config.js (CJS) | Keep dual |
| `@tailwind-styled/vue` | ✅ dual | nuxt.config.ts (CJS) | Keep dual |
| `@tailwind-styled/svelte` | ✅ dual | svelte.config.js (CJS) | Keep dual |
| `@tailwind-styled/cli` | ❌ ESM-only | CLI → node --input-type=module | ESM-only ✅ |
| `@tailwind-styled/devtools` | ❌ ESM-only | Browser/React only | ESM-only ✅ |
| `@tailwind-styled/plugin-api` | ✅ dual | plugin authors (any format) | Keep dual |
| `@tailwind-styled/plugin-registry` | ✅ dual | CLI + scripts | Keep dual |
| `@tailwind-styled/theme` | ✅ dual | tailwind.config.js (CJS) | Keep dual |
| `@tailwind-styled/preset` | ✅ dual | tailwind.config.js (CJS) | Keep dual |
| `@tailwind-styled/animate` | ✅ dual | Build tools (CJS possible) | Keep dual |
| `@tailwind-styled/runtime-css` | ❌ ESM-only | Browser/React only | ESM-only ✅ |
| `@tailwind-styled/testing` | ✅ dual | Jest (CJS) / Vitest (ESM) | Keep dual |
| `@tailwind-styled/storybook-addon` | ✅ dual | .storybook/main.js (CJS) | Keep dual |
| `@tailwind-styled/syntax` | ✅ dual | Internal + external tools | Keep dual |
| `@tailwind-styled/atomic` | ✅ dual | Build tools | Keep dual |

## Packages Safe for ESM-only (After Sign-off)

Packages berikut **AMAN** untuk ESM-only setelah v6 release:
- `@tailwind-styled/engine` ← sudah ESM-only
- `@tailwind-styled/cli` ← sudah ESM-only
- `@tailwind-styled/devtools` ← sudah ESM-only
- `@tailwind-styled/runtime-css` ← sudah ESM-only

Kandidat untuk ESM-only di v6 (butuh consumer audit lebih lanjut):
- `@tailwind-styled/animate` — jika tidak ada build tool CJS consumer
- `@tailwind-styled/atomic` — jika tidak ada build tool CJS consumer

## Breaking Change Note (Template untuk v6)

```markdown
## Breaking Change: ESM-Only Packages in v6

The following packages no longer ship CJS bundles:
- `@tailwind-styled/[PACKAGE]`

**Why**: Reduced bundle size, cleaner module graph.

**Migration**:
- If using `require("@tailwind-styled/[PACKAGE]")`:
  → Use `import { ... } from "@tailwind-styled/[PACKAGE]"` instead
  → Or: `const mod = await import("@tailwind-styled/[PACKAGE]")`
- If in a CJS-only environment: use a bundler (webpack/vite/rspack) to handle ESM deps
```

## Host-Runtime Exceptions

Packages yang HARUS tetap CJS karena platform requirement:
- **Storybook addon** — `.storybook/main.js` bisa CJS
- **Jest config** — Jest < 29 tidak support ESM natively
- **Next.js Pages Router** — `next.config.js` bisa CJS
