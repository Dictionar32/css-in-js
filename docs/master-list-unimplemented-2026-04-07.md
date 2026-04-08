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
- `C-20 #17` (`process.exit(0)` false-green test) → jalur test compiler tidak lagi memakai `process.exit(0)`; suite sekarang melalui runner standar `npm -w packages/compiler test`.
- `C-20 #19` (CLI `--help` command misleading) → validation gate sekarang memverifikasi `tw --help` dan `tw setup --help` lewat entrypoint source CLI agar command yang tampil benar-benar executable.
- `QA #21` (release profile) → `opt-level` di `native/Cargo.toml` sudah diganti ke `"z"` untuk target binary-size; evaluasi dependency `schemars` masih open.
- `PARTIAL #18` (Dashboard UI) → `packages/dashboard/src/server.ts` sudah menyajikan halaman HTML dashboard (`GET /`) plus endpoint `metrics/history/summary/health`.
- `PARTIAL #16` (DevTools trace flow) → `TracePanel` + trace tab + shortcut keyboard (`6`) + render flow sekarang ikut divalidasi gate melalui checks di `scripts/validate/final-report.ts`.
- `PLAN Wave 3` (Error Unification) → `TwError` kini tersentralisasi di `packages/shared/src/errors.ts`, `wrapUnknownError` shared index terhubung ke sumber error terpadu, jalur native binding melempar `TwError`, dan baseline automated tests sudah aktif di `packages/shared/src/errors.test.ts`.
- `PLAN Wave 3+` (Cross-package adoption) → jalur yang sebelumnya masih `throw new Error` di VSCode rename provider + Studio Desktop engine loader kini sudah pakai typed error class (`RenameProviderError` / `StudioError`), sehingga lintas package tidak lagi memakai raw throw.
- `PLAN Wave 3++` (hardening) → dua jalur typed error lintas package (`RenameProviderError`, `StudioError`) sekarang punya unit test dedicated (`renameProviderError.test.ts`, `studioError.test.js`) agar regressions lebih cepat ketangkap.
- `PLAN Wave 1` (Rust→TS auto-sync foundation) → binary `export-schemas` tersedia di `native/src/bin/export-schemas.rs`, direktori `native/json-schemas/` terisi baseline schema JSON, generator `scripts/generate-json-schemas.ts` menghasilkan modul typed ke `packages/shared/src/generated/`, dan gate otomatis `npm run wave1:gate` + `npm run stability:cross-package` sudah aktif.
- `PLAN Wave 2` (Consumer/Export Readiness) → gate baru `npm run wave2:gate` + test `scripts/wave2/export-compat.test.mjs` sekarang memverifikasi root/subpath exports tetap dual-mode (`import` + `require`) selama compatibility window masih dibuka, dan gate ini sudah diikutkan ke aggregate `npm run stability:cross-package`.

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

12. ~~**LSP — 3 fitur belum + gRPC pending**~~ ✅ **STABIL**  
    VSCode extension sekarang sudah register provider **Go to Definition**, **Rename Symbol**, dan **Code Actions** untuk token class di `class/className` attribute, dengan baseline parser test otomatis (`npm -w packages/vscode test`) untuk memastikan deteksi token/range dan quick-fix transform konsisten. gRPC cluster protocol tetap backlog Sprint 9+ (track terpisah, bukan blocker fitur editor dasar).

13. ~~**artifacts/validation-report.json tidak pernah di-generate**~~ ✅ **STABIL**  
    `final-report.ts` sekarang langsung menghasilkan `validation-report.json` dan `health-summary.json`, sekaligus menjalankan aggregated gate smoke suite (`npm run test:gate`).

14. ~~**tw split — atomic CSS map terbatas**~~ ✅ **STABIL**  
    Fallback mapper sekarang mencakup `grid-cols/rows`, `col/row-span`, arbitrary size (`w/h/min/max-*`), spacing (`p/m*`), inset, `gap-*`, `translate-*`, `z-*`, `opacity-*`, dan `rounded-*`. Integrasi penuh `@tailwindcss/postcss` tetap planned v4.9.1, namun jalur fallback route-css sudah operasional.

15. ~~**tw optimize — partial eval hanya 2 args**~~ ✅ **STABIL**  
    Static `twMerge('a','b','c',...)` sekarang bisa di-pre-compute untuk 3+ literal args, call mixed/dynamic tetap di-skip aman.

16. ~~**DevTools — trace reusable belum ada**~~ ✅ **STABIL**  
    Panel trace sudah ada (`TracePanel`), tab trace terdaftar, shortcut keyboard (`6`) aktif, dan jalur render trace kini ikut check di validation gate (`scripts/validate/final-report.ts`).

17. ~~**Studio Desktop — migrasi TypeScript belum, coverage test masih minim**~~ ✅ **STABIL**  
    Bootstrap desktop kini distabilkan lewat resolver terpusat (`resolveInitialProject` + `resolveStudioScript`), fallback project path aman ke `cwd`, dan unit test startup/path parser (`src/main.paths.test.js`) yang menutup edge case `--project=` kosong dan path yang mengandung `=`. TS config package juga sudah kompatibel Node16 (`module/moduleResolution`) untuk check yang konsisten.

18. ~~**Dashboard — hanya state, tidak ada UI**~~ ✅ **STABIL**  
    Dashboard server sudah expose UI HTML (`GET /`) + JSON API (`/metrics`, `/history`, `/summary`, `/health`) dan reset endpoint (`POST /reset`) via `packages/dashboard/src/server.ts`.

> Ringkasan terkini: dari daftar PARTIAL historis, seluruh item #7–#18 sudah distabilkan. Backlog lanjutan (mis. gRPC cluster protocol) dipindahkan ke jalur Sprint 9+/10+.

## 🟡 BELUM DIMULAI — Terdokumentasi lengkap, kode tidak ada

### A. PLAN.md — 50 unchecked items

**Wave 1 — Rust→TS Auto-Sync Foundation:** ✅ **STABIL (foundation)**
- `schemars` + `napi-derive` sudah ada di `native/Cargo.toml`
- `#[derive(JsonSchema)]` sudah digunakan di banyak Rust struct utama
- `napi.config.json` dengan `typedefHeader: true` sudah ada
- Binary Rust `export-schemas` sudah ada (`native/src/bin/export-schemas.rs`)
- `native/json-schemas/` sudah ada dan terisi baseline schema
- Pipeline end-to-end `cargo run --bin export-schemas → generate-json-schemas → packages/shared/src/generated/` sekarang sudah punya gate script (`npm run wave1:gate`) dan ikut tervalidasi di aggregate stability gate (`npm run stability:cross-package`)

**Wave 2A — Consumer/Export Readiness:** ✅ **STABIL (gated)**
- Gate `npm run wave2:gate` aktif dan tervalidasi untuk memastikan `exports` root + subpath tetap kompatibel dual-mode (`import` + `require`) via `scripts/wave2/export-compat.test.mjs`.
- Gate Wave 2A sudah masuk aggregate stability pipeline (`npm run stability:cross-package`).

**Wave 2B — Schema Consolidation:** 🟠 **BELUM STABIL**
- 77 Zod schema belum dikonsolidasi — masih tersebar di 15+ packages
- 4/6 consumer packages masih punya candidate list native binding sendiri, belum migrate ke `shared/src/nativeBinding.ts`
- Progress lanjutan: `packages/compiler/src/cssCompiler.ts` kini sudah migrate ke `@tailwind-styled/shared` (`resolveNativeBindingCandidates` + `loadNativeBinding` + `TwError`) untuk mengurangi duplikasi candidate-list/error handling.
- Progress lanjutan: `packages/compiler/src/rustCssCompiler.ts` juga sudah migrate ke helper `@tailwind-styled/shared` (`resolveRuntimeDir` + `resolveNativeBindingCandidates` + `loadNativeBinding`) sehingga candidate resolution native binding tidak lagi hardcoded lokal.
- Progress lanjutan: `packages/scanner/src/ast-native.ts` kini memakai helper shared (`resolveRuntimeDir` + `resolveNativeBindingCandidates` + `loadNativeBinding`) dan `packages/scanner/tsconfig.json` sudah disejajarkan ke root `tsconfig.json` agar check scanner kembali hijau.
- Guard tambahan: `packages/shared/src/errors.test.ts` sekarang memverifikasi fallback candidate `tailwind_styled_parser.node` mencakup path naik **3 level dan 4 level** dari `runtimeDir`.

**Wave 3 — Error Unification:** ✅ **STABIL (lintas package)**
- `TwError` + mapper `fromRust/fromZod` tersentralisasi di `packages/shared/src/errors.ts`
- `wrapUnknownError` pada `packages/shared/src/index.ts` kini mendelegasikan ke helper terpadu (single error source)
- `resolveNativeBindingCandidates` + `loadNativeBindingOrThrow` di `packages/shared/src/nativeBinding.ts` sudah memakai `TwError`
- Baseline test otomatis aktif di `packages/shared/src/errors.test.ts` (`npm -w packages/shared test`)
- Jalur VSCode + Studio Desktop yang sebelumnya raw throw kini sudah typed error (bukan `throw new Error(...)`)

**Wave 4A — Schema Drift Gate:** ✅ **STABIL (gated)**
- ✅ Gate `npm run wave4:schema-drift` aktif untuk verifikasi drift Rust→TS schema.
- ✅ Gate Wave 4A dijalankan di CI (`.github/workflows/quality.yml`) dan sudah masuk aggregate pipeline `npm run stability:cross-package`.

**Wave 4B — Auto-Sync Completion:** ✅ **STABIL**
- `napi-rs` migration v2 → v3 sudah diterapkan (`napi = "3"`, `napi-derive = "3"`, `napi-build = "2"` di `native/Cargo.toml`).
- Auto-generated type declarations sudah ada via `packages/shared/src/generated/rust-schema-types.d.ts` (dihasilkan oleh `scripts/generate-json-schemas.ts`).
- `wave1:export-schemas` sekarang memakai launcher `scripts/wave1/export-schemas.mjs` yang memprioritaskan binary lokal (`native/target/debug/export-schemas`) sebelum fallback ke `cargo run`, sehingga gate tetap stabil di environment terbatas.
- **Verdict saat ini:** Wave 4 stabil untuk scope gate + auto-sync baseline.

### B. ESM Migration — 34 unchecked items (3 wave penuh)
**Status saat ini:** ✅ **CLEAR & STABIL (gated)**  
Progress terbaru: Wave 1 (audit CJS assumptions) sudah stabil lewat guard `npm run esm:nonregression` (baseline default `0` untuk pattern `createRequire`/`module.require`/`__dirname` pada package target). Wave 3 package-level cutover sudah selesai: tidak ada lagi `require` export pada `packages/*/package.json` dan diverifikasi oleh `npm run esm:package-cutover`. Root/umbrella juga sudah masuk mode ESM-only dan diverifikasi oleh gate baru `npm run test:wave3:root-esm` (assert tidak ada `require` pada root exports + semua export object punya target `import`).
- **Verdict status saat ini:** track B clear end-to-end untuk jalur ESM-only + gated non-regression.

### C. Monorepo Checklist — 41 unchecked items
**Status saat ini:** ✅ **STABIL untuk scope gate yang sudah diimplementasi**  
Progress awal mulai jalan: smoke gate `npm run adapter:smoke` memverifikasi facade engine (`scanWorkspace/analyzeWorkspace/build/generateSafelist`) dan export adapter `vite/next/rspack` (`scripts/validate/adapter-smoke.ts`). Tambahan gate `npm run artifact:assertions` kini memverifikasi artifact dasar facade engine dari fixture nyata (`scripts/validate/artifact-assertions.ts`: scan/safelist/build artifact assertions). Kedua gate ini sudah dipasang ke aggregate pipeline `npm run stability:cross-package` dan tervalidasi hijau pada eksekusi end-to-end terbaru (termasuk `wave1:gate`, `wave4:schema-drift`, `wave3:esm-cutover`, `remove-js-fallback:check`). Plugin starter template dan shared observability contract lintas CLI/dashboard/devtools masih belum.

### D. Remove JS Fallback Plan — 11 files, ~563 lines belum dihapus
Plan lengkap ada di `plans/remove-js-fallback-native-only.md`, belum dieksekusi:

Progress terbaru (mulai eksekusi): jalur disable-native berbasis env (`TWS_NO_NATIVE`/`TWS_NO_RUST`/`TWS_DISABLE_NATIVE`) sudah dihapus dari loader scanner & compiler, sehingga runtime langsung hard-fail ketika binding native tidak tersedia (tanpa jalur disable/fallback tambahan). Selain itu, kontrak hasil `ast-native` scanner kini dipersempit ke `engine: "rust"` saja (tidak lagi membuka jalur fallback engine lain pada tipe API), binding `astExtractClasses` kini diperlakukan mandatory (tanpa optional runtime guard), parser binding scanner dipersempit ke `extractClassesFromSource` saja, kontrak in-memory cache scanner dipersempit ke full native API wajib (`scanCacheGet/scanCachePut/scanCacheInvalidate/scanCacheStats`), dan `scanWorkspaceAsync` tidak lagi fallback otomatis ke sync scanner saat worker error (harus explicit via `TWS_DISABLE_SCANNER_WORKER=1`). Pada engine watch path, loader sekarang memakai resolver shared (`resolveNativeBindingCandidates` + `loadNativeBinding`) dan poll error kini hard-fail (tidak ada jalur lanjut-silent); pada engine native-bridge, fungsi inti (`computeIncrementalDiff/hashFileContent/processFileChange`) kini diperlakukan mandatory di contract binding (tanpa optional call path). Pada compiler, regex export lama di `twDetector` (`TEMPLATE_RE/OBJECT_RE/WRAP_RE/EXTEND_RE`) juga sudah dihapus agar modul ini murni detector native + utility kecil, `astParser` kini import langsung `parseSync` dari `oxc-parser` (tanpa dynamic runtime-require branch), `tailwindEngine` tidak lagi menjalankan minify JS manual pada output CSS route, dan `coreCompiler` sudah tidak lagi dynamic-require `cssCompiler` saat deadStyleElimination (langsung import + native-analyze wajib). Gate verifikasi awal juga ditambah lewat `npm run remove-js-fallback:check` (`scripts/validate/remove-js-fallback-check.ts`) untuk menolak pattern fallback lama pada 11 file scope D, dan gate ini sudah dimasukkan ke aggregate pipeline `npm run stability:cross-package`.

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
| QA #21 | `schemars` dependency masih perlu evaluasi lanjut (opt-level sudah `"z"`) | `Cargo.toml` | Potensi bloat/dead dep |
| QA #22 | Adaptive thread pool threshold belum | Rust | Overhead small workload |
| QA #24 | `tsconfig` path alias vs workspace build conflict | `tsconfig.base.json` | DTS pull source |
| QA #25 | `'use client'` detection example app | examples/ | RSC boundary salah |
| QA #27 | `TWS_DISABLE_NATIVE` tidak dikenali | test scripts | ✅ Stabilized |
| QA #30 | `test/fixtures/generate.js` CJS di ESM | test/fixtures/ | ✅ Stabilized |
| QA #31 | `reverseLookup.ts` manual `lastIndex` | engine | ✅ Stabilized |
| QA #32 | ID generator race condition | `cssToIr.ts:40` | ✅ Stabilized |
| QA #33 | `reverseLookup.ts` `ParsedCache` tidak clear | engine | ✅ Stabilized |
| QA #34 | Script inconsistency antar packages | `package.json` scripts | ✅ Stabilized (agregasi `test:compiler/cache/sync/gate` + validation checks konsisten) |
| C-20 #3 | State API inject style runtime → CSP/SSR unsafe | `stateEngine` | ✅ Stabilized (prod default-off + CSP nonce required + SSR path) |
| C-20 #17 | `process.exit(0)` di test → false green CI | compiler test | ✅ Stabilized (runner test compiler tidak memakai `process.exit(0)`) |
| C-20 #18 | Status "Production-ready" tapi type `any` | docs/ | ✅ Type `any` utama sudah diganti typed generic |
| C-20 #19 | CLI `--help` tampil command belum bisa dipakai | `program.ts` | ✅ Stabilized (gate check `tw --help` + `tw setup --help` via `tsx`) |

## 📊 Grand Total

| Kategori | Jumlah |
|---|---:|
| Broken / tidak bisa jalan | 0 (6 sudah distabilkan) |
| Partial / setengah jalan | 0 (seluruh item #7–#18 stabil) |
| Belum dimulai — Plan/Wave besar | 11 area |
| JS fallback code belum dihapus | ~563 baris di 11 file |
| Unchecked di `PLAN.md` | 50 |
| Unchecked di monorepo checklist | 41 |
| Sprint 9+/10+ backlog | 12+ item |
| Bug terdokumentasi belum fix | 4 (11 sudah stabil) |
| any type belum dieliminasi | 145 occurrences |
| let belum dikonversi | 32 declarations |

## ▶️ LANJUTAN (Eksekusi setelah snapshot 2026-04-07)

Tujuan section ini: mengubah daftar backlog jadi urutan eksekusi yang bisa langsung dipakai tim delivery.

### 1) Top 10 prioritas implementasi (urut eksekusi)

1. **LSP Core Features (#12)**  
   Deliver: Go to Definition, Rename Symbol, Code Actions minimal untuk class token dan variant token.
2. **Studio Desktop TS migration + test harness (#17)**  
   Deliver: migrasi entrypoint JS→TS + smoke test startup + contract test API internal.
3. **`TwError` unification (Wave 3 PLAN.md)**  
   Deliver: class `TwError`, mapper `fromRust`, mapper `fromZod`, dan replacement gradual `throw new Error` lintas boundary.
4. **Rust schema export foundation (Wave 1 PLAN.md)**  
   Deliver: `schemars` derive + binary `export-schemas` + `native/json-schemas/` artifact pertama.
5. **Auto-sync pipeline Rust→TS (Wave 4 PLAN.md)**  
   Deliver: generate/check drift di CI + fail-fast saat schema drift.
6. **napi-rs v3 upgrade (K + QA #20)**  
   Deliver: runtime binding kompatibel + tipe auto-generated baseline.
7. **Oxc parser uplift (J / QA #23)**  
   Deliver: migrasi API visitor, pass parse-analyze minimal, unblock Rust phase 3 optimization.
8. **Monorepo facade stabilization (C)**  
   Deliver: facade `scanWorkspace/analyzeWorkspace/build/generateSafelist` + smoke per adapter (vite/next/rspack).
9. **Remove JS fallback wave-1 (D)**  
   Deliver: hapus fallback paling kecil-risiko dulu (`oxc-bridge`, `engine/incremental`, `shared/nativeBinding` branches legacy).
10. **Test-all-packages in next-js app (I)**  
    Deliver: coverage minimal 22 package testable (6 native + 16 mock-first).

### 2) Dependency map (apa yang blocker apa)

- **`TwError` unification** sebaiknya selesai **sebelum** upgrade besar parser/binding supaya error surface tidak makin melebar.
- **napi-rs v3** dan **schema export foundation** adalah prasyarat pipeline auto-generate `.d.ts` yang stabil.
- **Oxc uplift** memblokir optimisasi Rust phase 3, jadi nilainya tinggi setelah jalur error + binding lebih rapi.
- **Remove JS fallback** sebaiknya dilakukan bertahap setelah facade + smoke test adapter stabil, agar regresi mudah dideteksi.

### 3) Definition of Done (DoD) singkat per area

- **LSP (#12):**
  - Minimal 3 command aktif di extension host.
  - Ada integration test untuk masing-masing command.
  - Dokumentasi `docs/api/vscode.md` update.
- **Studio Desktop (#17):**
  - `tsconfig.json` aktif dan build hijau.
  - Minimal test startup + endpoint health.
  - Tidak ada import path unresolved di mode strict.
- **Rust schema + auto-sync (PLAN Wave 1/4):**
  - `export-schemas` menghasilkan artifact deterministik.
  - `--check` mendeteksi drift lokal/CI.
  - Ada workflow CI khusus schema gate.
- **napi-rs v3:**
  - Build native lintas platform tetap hijau.
  - API public tidak break (atau ada migration note eksplisit).
- **Oxc uplift:**
  - Parse + semantic baseline test pass.
  - Jalur optimizer yang sebelumnya blocked punya minimal 1 test enable.

### 4) Risk register (ringkas)

- **Risk:** upgrade parser/native men-trigger perubahan output scan class.  
  **Mitigasi:** tambahkan snapshot golden untuk `next-js-app` dan fixture besar sebelum upgrade.
- **Risk:** penghapusan JS fallback menurunkan kompatibilitas environment tertentu.  
  **Mitigasi:** feature flag transisi per package + deprecation window 1 minor release.
- **Risk:** CI makin lambat setelah gate bertambah.  
  **Mitigasi:** pisahkan gate cepat (PR) vs gate penuh (nightly/release).

### 5) Sprint slicing yang direkomendasikan

- **Sprint A (stabilize interface):** LSP #12 + Studio #17 + `TwError` baseline.
- **Sprint B (type/source-of-truth):** Rust schema export + auto-sync CI + napi-rs v3 prep.
- **Sprint C (perf/cleanup):** Oxc uplift + facade stabilization + remove JS fallback wave-1.
- **Sprint D (coverage/scale):** test-all-packages + plugin registry Track B + operasional sprint labels/PIC.

### 6) Catatan status

Dokumen ini tetap snapshot tanggal **2026-04-07**; section lanjutan ini adalah **proposed execution order** untuk implementasi berikutnya, bukan klaim bahwa item-item tersebut sudah selesai.
