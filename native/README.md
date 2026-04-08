# `native/` — Rust Engine

Direktori ini berisi **Rust engine** yang menjadi inti performa `tailwind-styled-v4`. Engine dikompilasi sebagai native Node.js addon (`.node`) via [NAPI-RS](https://napi.rs/) dan diakses langsung oleh packages JS/TS tanpa overhead FFI tambahan.

---

## Struktur

```
native/
├── src/
│   ├── lib.rs              # Entry point — 49 fungsi #[napi] yang diekspor ke JS
│   ├── oxc_parser.rs       # Integrasi Oxc AST parser (template literal & JSX)
│   ├── ast_optimizer.rs    # Benchmark & optimisasi AST vs regex
│   ├── scan_cache.rs       # In-memory DashMap cache untuk scan result
│   ├── watcher.rs          # File watcher berbasis `notify` crate
│   └── bin/
│       └── export-schemas.rs  # Binary untuk generate JSON schema dari Rust struct
├── json-schemas/           # Output schema (auto-generated, jangan edit manual)
│   ├── AnalyzerReport.json
│   ├── ParsedClass.json
│   ├── RouteClassMap.json
│   ├── ScanResult.json
│   └── TransformResult.json
├── .cargo/
│   └── config.toml         # Linker config untuk cross-compile Windows
├── Cargo.toml              # Dependencies dan release profile
├── napi.config.json        # Config NAPI-RS (nama binary, typedef header)
├── build.rs               # Build script untuk napi-build
└── index.mjs              # JS wrapper — re-export semua fungsi native
```

---

## Dependencies utama

| Crate | Versi | Fungsi |
|---|---|---|
| `napi` | 3 | N-API bridge ke Node.js |
| `napi-derive` | 3 | Macro `#[napi]` untuk export fungsi |
| `rayon` | 1.7 | Parallel iterator (scan workspace) |
| `dashmap` | 6.1 | Concurrent hashmap (in-memory cache) |
| `notify` | 6 | File system watcher |
| `oxc_parser` | 0.1 | AST parser untuk JS/TS/JSX |
| `regex` | 1 | Regex engine class tokenization |
| `once_cell` | 1 | Lazy static regex (compile sekali) |
| `serde` / `serde_json` | 1 | Serialisasi struct ke/dari JSON |
| `schemars` | 0.8 | Generate JSON Schema dari Rust struct |

**Release profile** dikonfigurasi untuk ukuran binary minimal:
```toml
[profile.release]
opt-level = "z"   # optimasi ukuran
lto = true
strip = true
codegen-units = 1
panic = "abort"
```

---

## Fungsi yang Diekspor (49 `#[napi]`)

Semua fungsi di bawah ini tersedia di JS via `import { ... } from "@tailwind-styled/native"` atau lewat `native/index.mjs`.

### 1. Parser & Deteksi

| Fungsi | Input | Output | Keterangan |
|---|---|---|---|
| `parseClasses(input)` | `string` | `ParsedClass[]` | Parse class string jadi objek `{ className, variants[] }` |
| `hasTwUsage(source)` | `string` | `boolean \| null` | Deteksi apakah source mengandung pola `tw.*` |
| `isAlreadyTransformed(source)` | `string` | `boolean \| null` | Cek apakah file sudah pernah ditransform compiler |
| `analyzeRsc(source, filename)` | `string, string` | `RscAnalysis` | Deteksi RSC boundary — ada `"use client"`? ada `tw.server`? |
| `transformSource(source, opts?)` | `string, Map?` | `TransformResult` | Transform `tw.*` call jadi output yang sudah dicompile |

### 2. Scanner & Ekstraksi Kelas

| Fungsi | Input | Output | Keterangan |
|---|---|---|---|
| `scanWorkspace(root, extensions?)` | `string, string[]?` | `ScanResult` | Scan direktori secara rekursif — **parallel via Rayon** |
| `extractClassesFromSource(source)` | `string` | `string[]` | Ekstraksi kelas dari satu file (regex hybrid) |
| `batchExtractClasses(filePaths)` | `string[]` | `BatchExtractResult[]` | Ekstrak dari banyak file sekaligus — **parallel I/O** |
| `extractComponentUsage(source)` | `string` | `ComponentPropUsage[]` | Ekstrak JSX prop usage untuk dead style elimination |

### 3. AST-based Extraction

| Fungsi | Input | Output | Keterangan |
|---|---|---|---|
| `astExtractClasses(source, filename)` | `string, string` | `AstExtractResult` | Ekstraksi via regex hybrid + AST heuristic |
| `oxcExtractClasses(source, filename)` | `string, string` | `OxcExtractResult` | Ekstraksi via Oxc AST — lebih akurat, handle JSX/TS |

> `oxcExtractClasses` lebih lambat dari regex tapi tidak menghasilkan false positive pada template literal kompleks atau conditional class.

### 4. Cache (In-memory & File)

| Fungsi | Input | Output | Keterangan |
|---|---|---|---|
| `scanCacheGet(filePath, contentHash)` | `string, string` | `string[] \| null` | Baca dari DashMap cache — null = miss |
| `scanCachePut(filePath, contentHash, classes)` | `string, string, string[]` | `void` | Simpan ke DashMap cache |
| `scanCacheInvalidate(filePath)` | `string` | `void` | Hapus entry (file dihapus/rename) |
| `scanCacheStats()` | — | `ScanCacheStats` | Jumlah entry cache saat ini |
| `cacheRead(cachePath)` | `string` | `CacheReadResult` | Baca cache JSON dari disk |
| `cacheWrite(cachePath, entries)` | `string, CacheEntry[]` | `boolean` | Tulis cache JSON ke disk |
| `cachePriority(filePath, fileSize, lastModified)` | `string, number, number` | `number` | Hitung skor prioritas SmartCache |

### 5. Incremental & Diff

| Fungsi | Input | Output | Keterangan |
|---|---|---|---|
| `computeIncrementalDiff(previousJson, currentJson)` | `string, string` | `IncrementalDiff` | Diff dua scan result — kelas apa yang berubah |
| `hashFileContent(content)` | `string` | `string` | Hash cepat untuk change detection |
| `processFileChange(filePath, newClasses, content?)` | `string, string[], string?` | `FileChangeResult` | Update registry incremental untuk satu file |
| `diffClassLists(previous, current)` | `string[], string[]` | `ClassDiffResult` | Diff dua class list — O(n+m) via HashSet |

### 6. CSS Compilation

| Fungsi | Input | Output | Keterangan |
|---|---|---|---|
| `compileCss(classes, prefix?)` | `string[], string?` | `CssCompileResult` | Compile daftar kelas jadi CSS atomic |
| `compileVariantTable(configJson)` | `string` | `VariantTableResult` | Build lookup table dari config variant |
| `mergeCssDeclarations(cssChunks)` | `string[]` | `CssDeclarationMap` | Merge beberapa CSS chunk — dedupe declaration |
| `parseCssRules(css)` | `string` | `CssRuleLookup[]` | Parse CSS string jadi rule list |
| `parseCssToRules(css, prefix?)` | `string, string?` | `ParsedCssRule[]` | Parse + associate ke prefix/namespace |
| `classifyAndSortClasses(classes)` | `string[]` | `BucketedClass[]` | Sort kelas ke bucket (layout/typography/color/dll) |

### 7. Class Utilities

| Fungsi | Input | Output | Keterangan |
|---|---|---|---|
| `normalizeAndDedupClasses(raw)` | `string` | `NormalizeResult` | Trim, dedup, pertahankan urutan pertama |
| `parseClassesFromString(raw)` | `string` | `string[]` | Split class string ke array |
| `classifyKnownClasses(classes)` | `string[]` | `Classification[]` | Label tiap kelas (known/arbitrary/unknown) |
| `batchSplitClasses(classes)` | `string[]` | `VariantSplitResult[]` | Split variant prefix dari setiap kelas |
| `detectClassConflicts(usagesJson)` | `string` | `ConflictDetectionResult` | Deteksi konflik utility (mis. `p-2` vs `p-4`) |
| `checkAgainstSafelist(classes, safelistJson)` | `string[], string` | `SafelistCheckResult` | Filter kelas vs safelist |

### 8. Analyzer

| Fungsi | Input | Output | Keterangan |
|---|---|---|---|
| `analyzeClasses(filesJson, root, topN)` | `string, string, number` | `AnalyzerReport` | Analisis class usage lintas file — top N, frekuensi |
| `analyzeClassUsage(usagesJson)` | `string` | `ClassUsageReport` | Ringkasan penggunaan per kelas |
| `analyzeRouteClassDistribution(routesJson)` | `string` | `RouteDistributionReport` | Distribusi kelas per route (untuk route splitting) |

### 9. Bundle & Dead Code

| Fungsi | Input | Output | Keterangan |
|---|---|---|---|
| `calculateBundleContributions(bundleJson)` | `string` | `BundleContribution[]` | Kontribusi ukuran per package ke bundle |
| `calculateImpactScores(classesJson)` | `string` | `ImpactScore[]` | Skor dampak kelas terhadap bundle size |
| `detectDeadCode(usagesJson, definitionsJson)` | `string, string` | `DeadCodeReport` | Deteksi kelas yang didefinisikan tapi tidak dipakai |
| `hoistComponents(source)` | `string` | `HoistResult` | Hoist komponen `tw.*` ke top-level scope |

### 10. Animation & Theme

| Fungsi | Input | Output | Keterangan |
|---|---|---|---|
| `compileAnimation(from, to, name, duration?)` | `string, string, string, string?` | `CompiledAnimation` | Generate `@keyframes` + `animation` CSS |
| `compileKeyframes(name, stopsJson)` | `string, string` | `CompiledAnimation` | Generate `@keyframes` dari stop kustom |
| `compileTheme(tokensJson, themeName, prefix)` | `string, string, string` | `CompiledTheme` | Compile token map jadi CSS custom properties |
| `extractCssVars(source)` | `string` | `string[]` | Ekstrak `--var-name` yang direferensikan di source |

### 11. File Watcher

| Fungsi | Input | Output | Keterangan |
|---|---|---|---|
| `startWatch(rootDir)` | `string` | `WatchStartResult` | Mulai watch direktori — kembalikan `handleId` |
| `pollWatchEvents(handleId)` | `number` | `WatchChangeEvent[]` | Poll events sejak panggilan terakhir |
| `stopWatch(handleId)` | `number` | `boolean` | Hentikan watcher |

> Watcher memakai polling model — JS memanggil `pollWatchEvents` tiap ~200ms. Ini menghindari masalah event thread N-API yang kompleks.

---

## JSON Schemas

Folder `json-schemas/` berisi schema JSON untuk tipe data utama yang dikembalikan Rust. Schema ini di-generate oleh binary `export-schemas` dan dipakai oleh pipeline `scripts/generate-json-schemas.ts` untuk menghasilkan TypeScript types di `packages/shared/src/generated/`.

| Schema | Deskripsi |
|---|---|
| `ScanResult.json` | Output `scanWorkspace` — `filesScanned`, `uniqueClasses` |
| `ParsedClass.json` | Satu class yang diparsed — `className`, `variants[]` |
| `AnalyzerReport.json` | Output `analyzeClasses` — frekuensi, top classes |
| `RouteClassMap.json` | Map route → classes untuk route splitting |
| `TransformResult.json` | Output `transformSource` — code, sourcemap, error |

> **Jangan edit file ini secara manual.** Jalankan `npm run wave1:gate` untuk regenerate dari source Rust.

---

## Build

### Prasyarat

- Rust 1.75+
- Node.js 20+
- `cargo` dan `rustup` sudah di PATH

### Dari source

```bash
# Build debug (cepat, binary besar)
cd native
cargo build

# Build release (lambat, binary optimal)
cargo build --release
```

### Via npm (dari root monorepo)

```bash
# Build semua packages termasuk native binary
npm run build

# Build native saja
npm run build:native
```

Binary output: `native/tailwind_styled_parser.node` (Linux x64 sudah disertakan pre-built).

### Generate schemas

```bash
# Generate JSON schemas dari Rust structs
cargo run --bin export-schemas

# Atau via npm script
npm run wave1:export-schemas

# Verifikasi tidak ada drift
npm run wave1:gate
```

---

## Integrasi dengan JS Packages

Engine native diakses via `packages/shared/src/nativeBinding.ts` yang menyediakan lazy-load dengan fallback graceful:

```ts
import { loadNativeBinding } from "@tailwind-styled/shared"

const native = await loadNativeBinding()
const result = native.scanWorkspace("./src", [".tsx", ".ts"])
```

Packages yang langsung menggunakan native engine:
- `packages/scanner` — `scanWorkspace`, `extractClassesFromSource`, cache
- `packages/compiler` — `compileCss`, `transformSource`, `analyzeClasses`
- `packages/engine` — `computeIncrementalDiff`, `processFileChange`, watcher
- `packages/analyzer` — `analyzeClasses`, `analyzeRouteClassDistribution`
- `packages/animate` — `compileAnimation`, `compileKeyframes`
- `packages/theme` — `compileTheme`, `extractCssVars`

---

## Environment Variables

| Variable | Default | Efek |
|---|---|---|
| `TWS_NO_NATIVE` | `0` | `1` = paksa JS fallback (deprecated, segera dihapus) |
| `TWS_NO_RUST` | `0` | Alias untuk `TWS_NO_NATIVE` |
| `TWS_DEBUG_SCANNER` | `0` | `1` = log debug scanner ke stderr |

> **Catatan:** jalur `TWS_NO_NATIVE`/`TWS_NO_RUST` sedang dalam proses penghapusan (lihat `plans/remove-js-fallback-native-only.md`). Setelah dihapus, engine akan hard-fail jika binary tidak tersedia.

---

## Known Limitations

- `oxc_parser` masih versi `0.1` — visitor API baru di versi ~0.49 belum dimigrasikan. Ini memblokir optimisasi Phase 3 Rust (lihat master list item J).
- Adaptive thread pool threshold belum diimplementasikan (QA #22) — saat ini selalu pakai `num_cpus` penuh.
- Pre-built binary baru tersedia untuk **Linux x64**. macOS dan Windows membutuhkan build dari source.
- `schemars` dependency masih perlu evaluasi apakah perlu dipertahankan atau diganti (QA #21).