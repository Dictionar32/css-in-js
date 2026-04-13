# Contributing

Terima kasih sudah ingin berkontribusi ke **tailwind-styled-v4**.

## 1) Development setup

```bash
npm install
npm run build:packages
```

Opsional untuk validasi penuh monorepo:

```bash
npm run validate:final
```

## 2) Struktur project (ringkas)

- `packages/core` — API utama `tw`, `cv`, `cx`.
- `packages/compiler` — transform/compile pipeline.
- `packages/scanner` — scanning class source + cache.
- `packages/engine` — incremental/watch engine.
- `packages/analyzer` — analisis project dan report.
- `packages/vite` — integrasi Vite.
- `packages/cli` — command line tools.
- `native/` — scaffold native parser (N-API / Rust).
- `examples/` — contoh implementasi.

## 3) Workflow kontribusi

1. Buat branch dari branch aktif tim.
2. Implement perubahan kecil dan fokus.
3. Tambahkan/ubah test bila behavior berubah.
4. Jalankan validasi yang relevan.
5. Commit dengan pesan jelas, lalu buka PR.

## 4) Validasi minimum sebelum PR

```bash
npm run test -w packages/core
npm run build -w packages/compiler
npm run build -w packages/scanner
npm run build -w packages/engine
npm run build -w packages/vite
npm run build -w packages/cli
npm run test -w packages/plugin-registry
```

Jika menyentuh benchmark/ops docs, jalankan juga:

```bash
npm run bench:massive -- --root=test/fixtures/large-project --out=artifacts/scale/massive-local.json
```

## 5) Style guidelines

- Gunakan TypeScript strict mode.
- Hindari perubahan API publik tanpa catatan kompatibilitas.
- Dokumentasikan command baru di docs operasional.
- Pertahankan backward compatibility bila memungkinkan.

## 6) Commit & PR guidelines

- Gunakan commit message deskriptif (`feat:`, `fix:`, `docs:`, `chore:`).
- Jelaskan motivasi, perubahan, dan langkah validasi di PR.
- Jika perubahan menyentuh DX, sertakan contoh penggunaan.

## 7) Area kontribusi prioritas (v4.3–v4.5)

**v4.3 — Command Densification:**
- Perluas `tw storybook` dengan Storybook addon integration
- Tambah `tw create` template baru (Rspack, SolidJS)
- Perbaikan `tw code` dengan VS Code deep-link

**v4.4 — DX & Quality:**
- Perluas `tw preflight` dengan check tambahan (peer deps version mismatch, Tailwind v4 CSS-first syntax)
- Perluas `tw audit` dengan bundle size analysis menggunakan `@next/bundle-analyzer`
- `tw deploy --registry=URL` ✅ Done Sprint 6

**v4.5 — Platform:**
- `tw sync pull --from=URL` dan `push --to-url=URL` ✅ Done Sprint 6
- AI provider tambahan (Google Gemini, local Ollama models baru)
- `@tailwind-styled/shared` migrasi package lain (compiler done, engine done)

**Sprint 6 — Done:**
- `tw registry serve|list|info` — HTTP registry server
- `tw cluster-server` — remote build worker
- `routeCssMiddleware` — Next.js `<link>` injection dari manifest
- Vite plugin `routeCss: true` option
- Studio Desktop: loading-error.html, auto-updater

**Sprint 7+ (prioritas berikutnya):**
- RSC auto-inject route CSS (tanpa manual `getRouteCssLinks` di layout)
- Dynamic route CSS splitting (`/post/[id]`)
- Figma push (butuh Enterprise plan) + multi-mode support
- Metrics persistence (``.tw-cache/metrics-history.jsonl``)
- gRPC remote worker protocol untuk cluster

## 8) Release process

### Prasyarat

- Memiliki akses publish package.
- `npm` sudah login (`npm whoami`).
- CI green pada branch release candidate.

### Checklist rilis

1. Sinkronkan versi di package yang relevan.
2. Pastikan changelog/release note diperbarui.
3. Jalankan validasi:

```bash
npm run validate:final
npm run validate:deps
npm run validate:pr5:gaps
```

4. Jalankan benchmark/regression yang diperlukan:

```bash
node scripts/regression/rust-parser.js
npm run bench:massive -- --root=test/fixtures/large-project --out=artifacts/scale/massive-release.json
```

5. Buat release PR dan minta review minimal 1 maintainer.
6. Setelah merge, tag release dan publish:

```bash
git tag v4.2.0
git push origin v4.2.0
npm publish --workspaces --access public
```

## 9) Packages baru di v4.2

Struktur package diperluas:
- `packages/vue` — Vue 3 adapter (`tw()`, `cv()`, `extend()`)
- `packages/svelte` — Svelte 4/5 adapter (`cv()`, `tw()`, `use:styled`)
- `packages/studio-desktop` — Electron app (membutuhkan `electron` dan `electron-builder`)
- `packages/testing` — Test utilities (Jest/Vitest custom matchers)
- `packages/storybook-addon` — Storybook decorator dan argTypes generator
- `packages/dashboard` — Live metrics HTTP server

Command test Sprint 2 tersedia via:
```bash
npm run test:sprint2        # Unit tests (parse, shake, vue, svelte, testing-utils)
npm run test:integration    # Integration tests (parse→shake pipeline, dashboard HTTP)
npm run bench:sprint2       # Benchmark parse/shake/cluster
```

## 10) Menjalankan plugin-registry benchmark
```bash
# Build dulu
npm run build -w @tailwind-styled/plugin-registry

# Jalankan SLO benchmark (100 runs, target p95 < 500ms)
node packages/plugin-registry/benchmark/index.mjs
```

## 11) Berkontribusi tanpa install Rust

Banyak area yang bisa dikerjakan **tanpa Rust toolchain sama sekali**.
Dari 29 packages di monorepo ini, 15 adalah murni TypeScript/JavaScript.

### Quick setup (JS/TS only)

```bash
# Clone repo
git clone https://github.com/your-org/tailwind-oxide

# Install deps
npm install

# Build hanya packages yang tidak butuh Rust
npm run build -w @tailwind-styled/shared
npm run build -w @tailwind-styled/syntax
npm run build -w @tailwind-styled/plugin-api
npm run build -w @tailwind-styled/plugin
npm run build -w @tailwind-styled/preset
npm run build -w @tailwind-styled/theme

# Mulai develop di package yang diinginkan
npm run dev -w @tailwind-styled/cli
```

### Packages yang 100% TypeScript (tidak butuh Rust)

| Package | Area | Contoh kontribusi |
|---|---|---|
| `packages/cli` | CLI commands, UX | Tambah command baru, perbaiki output formatting |
| `packages/devtools` | React DevTools UI | Tambah panel baru, fix styling |
| `packages/dashboard` | HTTP metrics server | Tambah endpoint, tambah UI |
| `packages/plugin` | Plugin system | Buat plugin baru, perbaiki API |
| `packages/plugin-api` | Plugin contracts | Perkuat type contracts |
| `packages/plugin-registry` | Registry & install | Tambah integrity checks, test coverage |
| `packages/preset` | Default config | Tambah design tokens |
| `packages/runtime` | React component helpers | Perbaiki types |
| `packages/runtime-css` | CSS injector | Optimasi batching |
| `packages/storybook-addon` | Storybook integration | Tambah decorator |
| `packages/svelte` | Svelte adapter | Perbaiki cv(), tw() |
| `packages/syntax` | Class parser | Perbaiki regex fallback |
| `packages/testing` | Test utilities | Tambah matchers |
| `packages/theme` | Design tokens | Tambah token system |
| `packages/vue` | Vue adapter | Perbaiki cv(), extend() |

### Area dokumentasi (zero setup)

- `docs/` — Perbaiki/tambah dokumentasi
- `docs/known-limitations/` — Dokumentasikan limitation yang ditemukan
- `docs/api/` — Lengkapi API reference
- `README.md` — Perbaiki contoh penggunaan

### Cara test tanpa native binary

Semua packages pure TS bisa di-test tanpa build Rust:

```bash
# Set env untuk skip native
export TWS_DISABLE_NATIVE=1

# Test packages yang tidak butuh native
npm test -w @tailwind-styled/shared
npm test -w @tailwind-styled/plugin-registry
npm test -w @tailwind-styled/testing
npm test -w @tailwind-styled/vue
npm test -w @tailwind-styled/svelte
```

### Packages yang butuh Rust (untuk info)

`compiler`, `scanner`, `analyzer`, `engine`, `animate`, `syntax` (partial)
membutuhkan `npm run build:rust` sebelum bisa berjalan penuh.
Tapi semua packages ini tetap bisa di-edit TypeScript-nya tanpa Rust —
hanya test yang membutuhkan native binary.

## 12) Good first issues

Area yang baik untuk kontribusi pertama:
- **Dokumentasi**: Perbaiki/terjemahkan docs ke Bahasa Inggris (masih banyak yang Bahasa Indonesia saja)
- **Test coverage**: Tambah test untuk `packages/shared`, `packages/plugin-registry`, `packages/vue`, `packages/svelte`
- **CLI help**: Perbaiki deskripsi command di `packages/cli/src/commands/help.ts`
- **Plugin registry**: Tambah plugin ke `packages/plugin-registry/registry.json`
- **Design tokens**: Tambah token ke `packages/preset/src/defaultPreset.ts`
