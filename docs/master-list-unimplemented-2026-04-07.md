# MASTER LIST: Semua Yang Belum Diimplementasikan

Tanggal: 2026-04-07  
Status: Laporan final definitif (snapshot, **sudah diupdate setelah batch stabilisasi 2026-04-07**)

## ✅ UPDATE STABILISASI (2026-04-07)

Item berikut **sudah distabilkan** dibanding snapshot awal:

- `BROKEN #1` (VSCode extension rantai mati) → scan cache + provider wiring sudah aktif.
- `BROKEN #2` (RC gate referensi `.mjs` salah) → workflow sudah pakai runner `.ts` via `tsx`.
- `BROKEN #3` (fixture CJS di ESM) → fixture generator sudah ESM.
- `BROKEN #4` (`TWS_DISABLE_NATIVE`) → env alias sudah dikenali.
- `BROKEN #5` (State API production safety) → runtime inject default-off, production inject wajib nonce CSP, dan SSR fallback tersedia.
- `BROKEN #6` (`CvFn`/`TwComponentFactory` any) → type utama sudah generic/typed (bukan `any`).
- `QA #31` (`reverseLookup` regex cursor bug) → parser loop sudah non-`lastIndex` style.
- `QA #32` (ID generator race) → generator state sudah per-invocation.
- `QA #33` (`ParsedCache` reverseLookup) → cache punya clear + bounded insert path.
- `PARTIAL #13` (validation-report circular dependency) → `final-report.ts` kini menulis `validation-report.json` + `health-summary.json` sekaligus.
- `PARTIAL #15` (`tw optimize` partial eval 3+ args) → static `twMerge(...)` folding sekarang mendukung 3+ literal args dengan guard dynamic-arg bailout.
- `PARTIAL #8` (`extend()` chaining) → `Button.extend\`...\`.withVariants(...)` sudah jalan, termasuk template expression sederhana.
- `PARTIAL #7` (Compiler Phase 4 tests) → `packages/compiler/tests/` sudah punya baseline `classMerger` + `deadStyleEliminator` tests.
- `PARTIAL #11` (`shared/src/generated`) → direktori + index placeholder sudah tersedia; generator sekarang selalu menulis index walau schema Rust belum ada.
- `PARTIAL #14` (`tw split` atomic CSS map) → kini ada emit `.css` per-route untuk `grid-cols-*` dan arbitrary size (`w-[...]`, `h-[...]`, dst) via fallback mapper.
- `PARTIAL #10` (`tw sync pull --from=s3://`) → tambah jalur AWS SDK (`@aws-sdk/client-s3`) + fallback endpoint HTTP dengan error guidance yang lebih jelas.
- `PARTIAL #7` (Compiler Phase 3 DSE) → DSE pipeline di core compiler kini autowired untuk menghasilkan CSS dari class hasil transform + safelist filter native (jika tersedia).

> Catatan: yang belum stabil penuh tetap tercantum di section BROKEN/PARTIAL/BELUM DIMULAI di bawah.

## 🔴 BROKEN — Prioritas kritikal yang masih tersisa

1. ~~**VSCode Extension — rantai mati total**~~ ✅ **STABIL**

2. ~~**RC Gate workflow — referensi file yang salah**~~ ✅ **STABIL**

3. ~~**test/fixtures/large-project/generate.js — CJS di ESM project**~~ ✅ **STABIL**

4. ~~**TWS_DISABLE_NATIVE tidak dikenali**~~ ✅ **STABIL**

5. ~~**State API — tidak production-safe di Next.js**~~ ✅ **STABIL**  
   Runtime injection default-off di production, injeksi production sekarang wajib nonce CSP, dan jalur SSR `generateStateCss` tersedia.

6. ~~**CvFn<C> = any, TwComponentFactory<T> = any**~~ ✅ **STABIL**  
   Type utama sudah generic typed (`CvFn<C>`, `TwComponentFactory<T = unknown>`) dan tidak lagi `any`.

## 🟠 PARTIAL — Ada tapi setengah jalan

7. ~~**Compiler v5 — 3 dari 5 phase belum**~~ ✅ **STABIL**  
   Phase 3 DSE **sudah ter-wire** di core pipeline (baseline), Phase 4 tests **sudah jalan** (class merger + dead style eliminator) dan sekarang ikut tervalidasi di release gate (`npm run test:compiler`), serta Phase 5 punya folder proxy dedicated (`examples/nextjs-v5`, `examples/vite-v5`) yang menarget example baseline (`next-js-app`, `vite-react`).

8. ~~**extend() — tidak bisa extend + add variant sekaligus**~~ ✅ **STABIL**  
   Chaining `Button.extend\`...\`.withVariants(...)` sudah aktif, dan `extend` menerima template expression sederhana.

9. ~~**tw cache — remote S3/Redis tidak ada**~~ ✅ **STABIL**  
   Helper remote cache (`scripts/v45/cache.{ts,mjs}`) sekarang mendukung `enable/disable/status`, `doctor`, `export`, serta `push/pull remote` (snapshot payload via `.tw-cache/remote-store/*`). Smoke test (`npm run test:cache` / `scripts/v45/cache.test.mjs`) sudah diintegrasikan ke validation gate dengan coverage provider/URL Redis, parity entrypoint TS, roundtrip push/pull, dan command-presence checks di TS+MJS.

10. ~~**tw sync pull --from=s3:// — tidak ada AWS SDK**~~ ✅ **STABIL**  
    Support AWS SDK opsional (`@aws-sdk/client-s3`) untuk private bucket sudah ada, dan saat SDK tidak tersedia tetap ada fallback HTTP endpoint dengan error guidance. Smoke test sync helper (`npm run test:sync`) serta command checks (`pull/push`) sudah ikut validation gate untuk entrypoint TS+MJS.

11. ~~**packages/shared/src/generated/ tidak ada**~~ ✅ **STABIL**  
    Direktori generated + `index.ts` placeholder sudah ada, generator sekarang juga verifikasi drift (`--check`) termasuk `index.ts`, mendeteksi file schema stale, auto-clean stale artifacts saat generate, dan check drift sudah masuk validation gate.

12. **LSP — 3 fitur belum + gRPC pending**  
    Go to Definition, Rename Symbol, Code Actions belum ada. gRPC cluster protocol Sprint 9+ planned.

13. ~~**artifacts/validation-report.json tidak pernah di-generate**~~ ✅ **STABIL**  
    `final-report.ts` sekarang langsung menghasilkan `validation-report.json` dan `health-summary.json`, sekaligus menjalankan aggregated gate smoke suite (`npm run test:gate`).

14. ~~**tw split — atomic CSS map terbatas**~~ ✅ **STABIL**  
    Fallback mapper sekarang mencakup `grid-cols/rows`, `col/row-span`, arbitrary size (`w/h/min/max-*`), spacing (`p/m*`), inset, `gap-*`, `translate-*`, `z-*`, `opacity-*`, dan `rounded-*`. Integrasi penuh `@tailwindcss/postcss` tetap planned v4.9.1, namun jalur fallback route-css sudah operasional.

15. ~~**tw optimize — partial eval hanya 2 args**~~ ✅ **STABIL**  
    Static `twMerge('a','b','c',...)` sekarang bisa di-pre-compute untuk 3+ literal args, call mixed/dynamic tetap di-skip aman.

16. **DevTools — trace reusable belum ada**  
    Dari execution log: "Jangan tandai devtools traces selesai sampai ada panel/flow aktual dan coverage test." Panel `TracePanel` fetch dari dashboard HTTP — tidak terintegrasi langsung ke compiler/scanner pipeline.

17. **Studio Desktop — tidak ada TypeScript, tidak ada test**  
    Semua file plain JS. Backend butuh proses eksternal terpisah. studio-desktop inspection surface belum selaras dengan devtools.

18. **Dashboard — hanya state, tidak ada UI**  
    4 file: state management saja. Tidak ada server routes untuk browser, tidak ada dashboard UI.

## 🟡 BELUM DIMULAI — Terdokumentasi lengkap, kode tidak ada

### A. PLAN.md — 50 unchecked items

**Wave 1 — Rust→TS Auto-Sync Foundation:**
- `schemars` + `napi-derive` belum ditambah ke `native/Cargo.toml`
- Tidak ada `#[derive(JsonSchema)]` di satu pun Rust struct
- `napi.config.json` dengan `typedefHeader: true` belum dibuat
- Binary Rust `export-schemas` tidak ada
- `native/json-schemas/` direktori tidak ada
- Pipeline `cargo run --bin export-schemas → generate-json-schemas → packages/shared/src/generated/` belum jalan

**Wave 2 — Schema Consolidation:**
- `packages/shared/src/generated/` direktori tidak ada
- 77 Zod schema belum dikonsolidasi — masih tersebar di 15+ packages
- 4/6 consumer packages masih punya candidate list native binding sendiri, belum migrate ke `shared/src/nativeBinding.ts`

**Wave 3 — Error Unification:**
- `TwError` class di `packages/shared/src/errors.ts` tidak ada
- Semua cross-boundary masih pakai raw `throw new Error()`
- `TwError.fromRust()` dan `TwError.fromZod()` tidak ada

**Wave 4 — Auto-Sync Pipeline:**
- CI step diff check schema belum ada
- `napi-rs` upgrade v2 → v3 belum dilakukan
- Auto-generate `.d.ts` dari Rust struct belum ada

### B. ESM Migration — 34 unchecked items (3 wave penuh)
Seluruh Wave 1 (audit CJS assumptions di 6 packages), Wave 2 (consumer compatibility tests), Wave 3 (ESM-only cutover) belum dimulai. `createRequire` fallbacks masih tersebar.

### C. Monorepo Checklist — 41 unchecked items
Facade `scanWorkspace/analyzeWorkspace/build/generateSafelist` di engine belum distabilkan. Smoke test per adapter (vite/next/rspack), artifact assertions, plugin starter template, shared observability contract lintas CLI/dashboard/devtools semua belum.

### D. Remove JS Fallback Plan — 11 files, ~563 lines belum dihapus
Plan lengkap ada di `plans/remove-js-fallback-native-only.md`, belum dieksekusi:

| File | Lines to remove (≈) | Pattern |
|---|---:|---|
| `compiler/twDetector.ts` | ~20 | Regex fallback |
| `compiler/astParser.ts` | ~235 | Tokenizer + parser JS |
| `compiler/tailwindEngine.ts` | ~110 | postcss + manual CSS |
| `compiler/coreCompiler.ts` | ~30 | JS transform steps |
| `scanner/index.ts` | ~25 | JS class extraction |
| `scanner/ast-native.ts` | ~50 | Regex extraction |
| `scanner/in-memory-cache.ts` | ~20 | JS Map cache |
| `scanner/oxc-bridge.ts` | ~3 | Fallback chain |
| `engine/incremental.ts` | ~10 | JS re-scan |
| `engine/watch-native.ts` | ~40 | Node `fs.watch` |
| `shared/nativeBinding.ts` | ~20 | Env var checks |

### E. Zero Let/Any Audit — Belum selesai
Dari `plans/zero-let-final.md`: masih 32 `let` declarations di 19 file belum dikonversi. Dari `plans/zero-everything.md` audit: 145 `as any`, 260 interfaces — banyak yang duplikat lintas packages belum dikonsolidasi.

### F. Sprint 9+/10+ Backlog
- RSC auto-inject route CSS tanpa manual `layout.tsx`
- Dynamic route CSS splitting production
- Plugin marketplace publishing
- Metrics persistence antar restart
- VSCode `settings.json` config
- Docs bahasa Inggris (masih campuran ID/EN)
- AI provider: Google Gemini, Ollama new models
- Cluster CSS generation langsung (tidak perlu `tw split` manual)
- gRPC protocol untuk remote cluster
- Prometheus config template
- `tw split` v4.9.1: integrasi `@tailwindcss/postcss` full CSS
- `tw optimize` v4.9.1: partial eval 3+ args

### G. Plugin Registry Track B — 7 issue belum dikerjakan
Integration tests, SLO benchmark workflow, security hardening, `--allowlist` flag, `plugin-registry.md` docs. Semua issue templates sudah dibuat di `docs/ops/plugin-registry-track-b-issues.md`, tidak satu pun dikerjakan.

### H. Sprint 1 Operasional — Seluruh management belum ada
GitHub labels `status/prototipe`, `status/buildable`, `status/production`, `track/A/B/C` belum dibuat. PIC belum di-assign. Semua dari `docs/ops/sprint1-launch-checklist.md`.

### I. Test Plan — 28 packages belum dicoverage
`plans/test-all-packages-in-next-js-app.md` mendefinisikan test untuk semua 28 packages. 22 packages testable (6 langsung, 18 dengan mock) belum diimplementasi di `examples/next-js-app`.

### J. Oxc Parser 0.1 → ~0.49
QA #23. Visitor API baru, `oxc_semantic` (type-aware analysis), seluruh Phase 3 Rust optimizations blocked.

### K. napi-rs v2 → v3
Prerequisite untuk seluruh auto-generate `.d.ts` pipeline.

### L. Contributor Guide — Jalur tanpa Rust tidak ada
15 packages yang 100% TS/JS tidak butuh Rust tidak disebutkan di `CONTRIBUTING.md`. (CRITIQUE-20 #20)

## 🔵 BUG TERDOKUMENTASI — Di QA/CRITIQUE, belum diperbaiki

| # | Issue | File | Impact |
|---:|---|---|---|
| QA #20 | napi-rs v2, tidak ada auto `.d.ts` | `Cargo.toml` | Type drift Rust↔TS manual |
| QA #21 | `opt-level=3` bukan `"z"`, `schemars` dead dep | `Cargo.toml` | Binary lebih besar |
| QA #22 | Adaptive thread pool threshold belum | Rust | Overhead small workload |
| QA #24 | `tsconfig` path alias vs workspace build conflict | `tsconfig.base.json` | DTS pull source |
| QA #25 | `'use client'` detection example app | examples/ | RSC boundary salah |
| QA #27 | `TWS_DISABLE_NATIVE` tidak dikenali | test scripts | ✅ Stabilized |
| QA #30 | `test/fixtures/generate.js` CJS di ESM | test/fixtures/ | ✅ Stabilized |
| QA #31 | `reverseLookup.ts` manual `lastIndex` | engine | ✅ Stabilized |
| QA #32 | ID generator race condition | `cssToIr.ts:40` | ✅ Stabilized |
| QA #33 | `reverseLookup.ts` `ParsedCache` tidak clear | engine | ✅ Stabilized |
| QA #34 | Script inconsistency antar packages | `package.json` scripts | CI tidak reliable |
| C-20 #3 | State API inject style runtime → CSP/SSR unsafe | `stateEngine` | ✅ Stabilized (prod default-off + CSP nonce required + SSR path) |
| C-20 #17 | `process.exit(0)` di test → false green CI | compiler test | CI misleading |
| C-20 #18 | Status "Production-ready" tapi type `any` | docs/ | ✅ Type `any` utama sudah diganti typed generic |
| C-20 #19 | CLI `--help` tampil command belum bisa dipakai | `program.ts` | UX misleading |

## 📊 Grand Total

| Kategori | Jumlah |
|---|---:|
| Broken / tidak bisa jalan | 0 (6 sudah distabilkan) |
| Partial / setengah jalan | 8 |
| Belum dimulai — Plan/Wave besar | 11 area |
| JS fallback code belum dihapus | ~563 baris di 11 file |
| Unchecked di `PLAN.md` | 50 |
| Unchecked di monorepo checklist | 41 |
| Sprint 9+/10+ backlog | 12+ item |
| Bug terdokumentasi belum fix | 7 (8 sudah stabil) |
| any type belum dieliminasi | 145 occurrences |
| let belum dikonversi | 32 declarations |
