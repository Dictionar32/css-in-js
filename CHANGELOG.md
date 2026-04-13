# Changelog

## v4.5.0 — Sprint 6–10 Platform Overhaul (2026-03-21)

### Sprint 6 — Error Handling & Logging

#### Rust (`native/src/lib.rs`)
- `cache_read` return type diubah dari `CacheReadResult` → `napi::Result<CacheReadResult>` — error file tidak bisa dibaca sekarang dipropagasi ke JS dengan pesan deskriptif
- `scan_workspace` sudah return `napi::Result` — error directory tidak ditemukan langsung dilempar ke JS

#### Scanner (`packages/scanner/src/index.ts`)
- Hapus `debugScanner()` dan `isDebugEnabled()` yang tersebar — ganti dengan `createLogger("scanner")` dari `@tailwind-styled/shared`
- Cache HIT/MISS/write-fail sekarang semua melalui `log.debug()` — terkontrol via `TWS_LOG_LEVEL`

#### Engine (`packages/engine/src/index.ts`)
- Plugin `onError` hook dipanggil sebelum error dipropagasi — plugin tidak bisa crash engine
- `watch()` emit event `{ type: "error" }` saat watcher atau transform gagal

#### Shared Logger (`packages/shared/src/logger.ts`)
- Sudah support `TWS_LOG_LEVEL=debug|info|warn|error|silent`
- `TWS_DEBUG_SCANNER=1` sebagai shorthand untuk debug scanner

---

### Sprint 7 — Platform Adapters

#### Next.js (`packages/next/tsup.config.ts`)
- Hapus `@tailwind-styled/compiler` dan `@tailwind-styled/plugin` dari `external`
- Tambah `noExternal` agar compiler di-bundle inline ke adapter
- `esbuildOptions` skip `*.node` native binaries Tailwind v4

#### Vite (`packages/vite/tsup.config.ts`, `src/plugin.ts`)
- Hapus `@tailwind-styled/compiler`, `engine`, `scanner` dari `external`
- Tambah `noExternal` untuk semua internal packages
- `preserveImports: true` di `loaderOptions` transform hook

#### Rspack (`packages/rspack/tsup.config.ts` — file baru, `src/loader.ts`)
- Buat `tsup.config.ts` dari scratch
- `noExternal: ["@tailwind-styled/compiler"]`
- `preserveImports: true` di `runLoaderTransform` call

#### Semua Loaders
- `turbopackLoader.ts`, `webpackLoader.ts`, `plugin.ts`, `loader.ts` — semua set `preserveImports: true`
- `cv`, `cx`, `cn` dijamin tidak distrip oleh compiler

---

### Sprint 8 — Developer Tooling

#### CLI (`packages/cli/src/analyze.ts`, `src/stats.ts`)
- Suppress `console.log("Analyzing...")` saat `--json` aktif — output JSON sekarang clean parseable
- `tw analyze --json` dan `tw stats --json` bisa di-pipe ke tools lain

#### DevTools (`packages/devtools/src/index.tsx`)
- Hapus tombol "Run Rust Workspace Scan" — tidak bisa jalan di browser environment
- Hapus `getRustAnalyzer()`, `runRustScan`, `rustReport`, `rustScanning`
- Ganti dengan panel **Engine Metrics** yang fetch dari `http://localhost:3000/metrics` (dashboard)
- Fallback message: "Rust analyzer hanya tersedia via CLI atau dashboard — `tw analyze . | tw dashboard`"
- DOM Scan tetap ada dan berfungsi

#### VSCode Extension (`packages/vscode/src/extension.ts`, `scripts/postbuild.cjs`)
- `startLspServer` cek `dist/lsp.mjs` sebagai kandidat pertama (bundled bersama extension)
- Tambah `packages/vscode/scripts/postbuild.cjs` — copy `scripts/v48/lsp.mjs` ke `dist/lsp.mjs` setiap build
- `package.json` tambah `"postbuild": "node scripts/postbuild.cjs"`

---

### Sprint 9 — Studio Desktop (Electron)

#### Main Process (`packages/studio-desktop/src/main.js`)
- `STUDIO_SCRIPT` sekarang di-resolve via `resolveStudioScript()` — cek `process.resourcesPath` (packaged), `__dirname/../..` (dev), dan `cwd` (fallback)
- Engine IPC handlers baru: `engine-scan`, `engine-build`, `engine-watch-start`, `engine-watch-stop`, `engine-reset`
- `createEngine` dari `@tailwind-styled/engine` di-lazy-load per project
- Engine di-reset otomatis saat `change-project` dipanggil
- Engine events di-forward ke renderer via `mainWindow.webContents.send("engine-event")`

#### Preload (`packages/studio-desktop/src/preload.js`)
- Ekspos `engineScan`, `engineBuild`, `engineWatchStart`, `engineWatchStop`, `onEngineEvent` ke renderer via `contextBridge`

#### Package (`packages/studio-desktop/package.json`)
- Tambah `@tailwind-styled/shared` ke dependencies
- Script `dev` update dengan fallback message jika Electron belum terinstall

---

### Sprint 10 — Testing & Documentation

#### Testing Package (`packages/testing/src/index.ts`)
- Tambah `EngineMetricsSnapshot` interface
- Tambah `expectEngineMetrics(metrics, expectations)` — assert minFiles, maxBuildTimeMs, minUniqueClasses, cacheHitRateMin
- Tambah `toHaveEngineMetrics(expectations)` — Jest/Vitest custom matcher
- Tambah `tailwindMatchersWithMetrics` — combined export semua matchers

#### Test Suites Baru
- `packages/testing/test/sprint9-platform.test.mjs` — 23 tests: next/vite/rspack adapter configs, preserveImports, studio-desktop engine IPC
- `packages/testing/test/sprint10-integration.test.mjs` — 28 tests: Sprint 6–8 error handling, logging, engine propagation, DevTools safety, VSCode LSP, metrics matchers

#### Test Results
- Total: **84/86 tests pass**
- 2 failing tests: pre-existing `twMerge/cn` extraction (unrelated to engine changes)

---

## v4.2.0 — Sprint 1 & 2 Complete (2026-03-15)

### New Packages

- **`@tailwind-styled/vue`** — Vue 3 adapter: `tw()`, `cv()`, `extend()`, `TailwindStyledPlugin`. Full variant/compound variant support with `twMerge` conflict resolution.
- **`@tailwind-styled/svelte`** — Svelte 4/5 adapter: `cv()`, `tw()`, `use:styled` action, `createVariants()` (Svelte 5 runes compatible).

### New Features

#### Parser & Compiler (v4.6)
- `tw parse <file>` — Full AST traversal with 3-tier strategy: `oxc-parser` (Rust) → `@babel/parser` → regex fallback. Extracts classes from JSX `className`, template literals, `twMerge()`, `cn()`, `clsx()` calls.
- Real tree shaking (`tw shake <css>`) — CSS selector analysis against source scan. Removes unused rules based on actual class usage, not sentinel strings. Supports `@layer`, `@media` preservation.

#### Compiler Optimization (v4.7/v4.9)
- `tw optimize <file>` — Constant folding (`true ? A : B → A`), class deduplication, `twMerge` literal pre-computation.

#### Parallel & Ecosystem (v4.8)
- `scripts/v48/lint-parallel.mjs` — Multi-threaded linting via `worker_threads`
- LSP server (`tw lsp`) — hover, completion (Tailwind class autocomplete), diagnostics via `vscode-languageserver`

#### Dashboard & Metrics
- `@tailwind-styled/dashboard` — Live metrics server with file-watch IPC. Reads `.tw-cache/metrics.json` written by engine. Real-time HTML UI with build history chart.
- `packages/engine/src/metricsWriter.ts` — Connects engine build results → `.tw-cache/metrics.json` → dashboard.

#### Plugin Registry
- `@tailwind-styled/plugin-registry` — `tw-plugin search/install/list` CLI. Registry now includes 4 official + 2 community plugins with docs and install commands.

#### Testing & Storybook
- `@tailwind-styled/testing` — `expectClasses()`, `expectNoClasses()`, `expandVariantMatrix()`, `testAllVariants()`, `expectClassesEqual()`, Jest/Vitest custom matchers (`tailwindMatchers`).
- `@tailwind-styled/storybook-addon` — `generateArgTypes()`, `withTailwindStyled()` decorator, `getVariantClass()`, `createVariantStoryArgs()`.

#### AI & Studio (v4.5)
- `tw ai "describe"` — Anthropic API integration for component generation. Fallback to smart static templates (card/nav/button detection) when `ANTHROPIC_API_KEY` not set.
- `tw studio` — Web-based component studio: scans project for `tw()`/`cv()` components, HTML UI with search + AI generator endpoint.
- `tw sync <init|pull|push|diff>` — W3C DTCG design token sync. Push to CSS variables (`--color-primary: #3b82f6`) or Tailwind `@theme {}` block.

#### Distributed Build (v5.0 preview)
- `tw cluster <init|build|status>` — Real `worker_threads` pool. Distributes file scan across CPU cores. Reports throughput (files/sec).

### Tests Added (Sprint 2)
- `packages/scanner/test/parse-v46.test.mjs` — 20 unit tests for parse pipeline
- `packages/compiler/test/shake-v47.test.mjs` — 10 unit tests for tree shaking
- `packages/vue/test/vue-adapter.test.mjs` — 9 unit tests for Vue cv()
- `packages/svelte/test/svelte-adapter.test.mjs` — 12 unit tests for Svelte cv()/tw()
- `packages/testing/test/testing-utils.test.mjs` — 18 unit tests for testing utilities
- `examples/integration-test/sprint2.integration.test.mjs` — 9 integration tests (parse→shake pipeline, dashboard HTTP, real-world component patterns)

### Benchmark
- `scripts/benchmark/sprint2-bench.mjs` — Measures parse (files/sec), shake (% CSS reduction), cluster (throughput) with memory snapshot. Output: `docs/benchmark/sprint2-results.json`.

### Documentation
- `docs/known-limitations/tw-parse.md` — Fallback modes, `.vue`/`.svelte` support gap, dynamic class limitations
- `docs/known-limitations/tw-transform.md` — JSX runtime requirements, hoist behavior, source map availability
- `docs/known-limitations/tw-lint.md` — Worker config, exit codes, missing `--format json`

### CI & Quality
- Smoke tests expanded to cover Sprint 1+2 features (Oxide pipeline, plugin registry, sync, AI, cluster)
- All packages bumped to `4.2.0`

---

## v2.1.0-alpha.1 — Tailwind v4 Upgrade Path

### Added
- New workspace packages: `@tailwind-styled/scanner` and `@tailwind-styled/engine`.
- Core Tailwind v4 helpers: parser, CSS-first theme reader, merge layer, styled resolver.
- CLI phase upgrades: `init`, `scan`, `migrate`, and interactive `migrate --wizard`.
- Vite plugin build-end integration with scanner reports and optional engine build call.
- Native parser scaffold (`native/`) plus benchmark script (`benchmarks/native-parser-bench.mjs`).
- Release workflow/docs scaffold: `.github/workflows/publish-alpha.yml`, `RELEASE.md`, `ANNOUNCEMENT.md`.

### Notes
- Native parser remains optional and uses fallback strategy until binding is shipped in CI artifacts.

---

## v2.0.0 — Major Upgrade (Compiler-Driven)

### Breaking Changes
- **Removed `styled-components` dependency** — peer dep dihapus.
- **`styledFactory`, `shouldForwardProp`, `blockProp`, `allowProp`** — dihapus.
- **`propEngine`, `responsiveEngine`** — dipindahkan ke compiler.
- **`ThemeContext`** — dihapus.

### New Features
- **Zero-runtime output** — `tw.div\`...\`` dikompilasi ke pure `React.forwardRef`.
- **Compiler-driven variants** — Variant config dikompilasi ke static lookup table.
- **RSC-aware** — Auto detect server vs client components.
- **`withTailwindStyled()` plugin** — Next.js plugin dengan Turbopack + Webpack support.
- **`tailwindStyledPlugin()` Vite plugin** — Same compiler pipeline untuk Vite 5+.

---

## v4.3–v4.5 Upgrade (2026-03-16)

### v4.3 — Command Densification
- `tw studio` — sekarang spawn `scripts/v45/studio.mjs` langsung (sebelumnya: `console.log` placeholder)
- `tw dashboard` — direct spawn `packages/dashboard/src/server.mjs` tanpa butuh build (sebelumnya: `npm run dev`)
- `tw storybook` — tanpa `--variants` → launch Storybook dev server via `npx storybook dev`; dengan `--variants` → enumerate JSON (CI mode)

### v4.4 — DX & Quality
- `tw preflight [--fix] [--json]` — command baru: 8 checks (Node version, package.json, tailwind-styled, bundler, tailwind-merge, Tailwind config, deprecated patterns, TypeScript), auto-fix sederhana
- `tw audit` — real checks: deprecated class scanner, a11y (img alt, onClick keyboard, div onClick, focus state), npm audit security, class count estimate; `--scope=deprecated|a11y|security|performance` dan `--json`
- `tw deploy` — baca package.json, tulis `.tw-cache/deploy-manifest.json`, `--dry-run` support
- `tw share` — baca manifest yang ada, generate payload dengan installCommand dan importExample

### v4.5 — Platform Mode
- `tw sync figma <pull|push|diff>` — CLI sekarang route subcommand `figma` ke `scripts/v45/figma-sync.mjs`
- `tw ai` — multi-provider: `--provider=anthropic|openai|ollama`, `--model=name`, auto-fallback ke Anthropic → static template
- `@tailwind-styled/shared` — package baru: `LRUCache` (TTL support), `createLogger`, `hashContent`/`hashFile`, `debounce`/`throttle`, `parseVersion`/`satisfiesMinVersion`
- `packages/compiler` — migrasi `hashFileContent` ke `@tailwind-styled/shared`

### Tests
- `packages/testing/test/v43-v45.test.mjs` — 28 tests covering shared package, audit, AI provider, preflight

### v4.2.0 patch (2026-03-16)

- `scripts/v49/critical-css.mjs` — upgraded: real CSS rule parsing, `--inline`, `--out=file`, id/tag/class extraction, savedPercent metric
- `scripts/v48/lint-parallel.mjs` — `--format=sarif` (SARIF 2.1 untuk GitHub Code Scanning), `--fix` auto-deduplicate duplicate classes
- `scripts/v46/parse.mjs` — bugfix: regex fallback sekarang mengekstrak kelas dari `twMerge()`, `cn()`, `cx()`, `clsx()` calls
- `packages/vscode/package.json` — tambah keybindings (Ctrl+Shift+T/N/S), `configuration` settings, `menus` context
- `packages/shared/tsconfig.json` — tsconfig untuk build
- `.github/workflows/benchmark.yml` — sprint2-bench, plugin-registry SLO, toolchain benchmark
- `scripts/validate/dependency-matrix-check.mjs` — validasi packages baru v4.2
- `packages/cli/src/index.ts` — fix preflight handler (hapus `--input-type=module` orphan)
- `docs/known-limitations/` — update status aktual untuk tw-lint, tw-split-optimize, tw-v50

---

## v4.3–v6.0 Sprint 6 (2026-03-16)

### New Features

#### Registry (`tw registry`)
- `scripts/v45/registry.mjs` — Lightweight local/team HTTP registry server
- `tw deploy --registry=http://localhost:4040` — Real HTTP publish ke registry
- `tw registry serve|list|info` — Manage registry dari CLI
- Token auth via `TW_REGISTRY_TOKEN` env var

#### Remote build (`tw cluster-server`)
- `scripts/v50/cluster-server.mjs` — Remote build worker HTTP server
- `tw cluster build src/ --remote=http://host:7070 --token=secret` — Dispatch ke remote workers
- `tw cluster-server [--port=7070] [--workers=N] [--token=secret]`

#### Remote token sync
- `tw sync pull --from=https://cdn.example.com/tokens.json` — HTTP/HTTPS URL pull
- `tw sync push --to-url=https://api.example.com/tokens` — HTTP push ke endpoint
- Figma subcommand sekarang tersedia: `tw sync figma pull|push|diff`

#### Next.js route CSS injection
- `packages/next/src/routeCssMiddleware.ts` — `getRouteCssLinks(route)`, `injectRouteCssIntoHtml()`
- `withTailwindStyled` sekarang write `css-manifest.json` ke `.next/static/css/tw/`
- Konsumsi di layout: `import { getRouteCssLinks } from 'tailwind-styled-v4/next/route-css'`

#### Vite plugin route CSS
- `routeCss: true` option di `tailwindStyledPlugin()` — run split-routes + shake per route
- `routeCssDir` — konfigurasi output dir
- `deadStyleElimination: true` — shake setiap route CSS chunk

#### Studio Desktop
- `packages/studio-desktop/src/loading-error.html` — loading fallback dengan auto-retry + error state
- `packages/studio-desktop/src/updater.js` — electron-updater integration (GitHub Releases)
- Auto-update check 10 detik setelah startup, manual via Tools menu

---

## Sprint 7 (2026-03-16)

### Tarball Registry (npm-compatible)
- `scripts/v45/registry-tarball.mjs` — `tw registry publish` buat + upload tarball, `tw install <pkg>` download + install, `tw registry versions <pkg>` list versions
- `scripts/v45/registry.mjs` — upgrade: PUT `/packages/:name` endpoint, GET `/packages/:name/versions`, GET `/packages/:name/-/:tarball.tgz`, tarball storage di `tarballs/`, version history di `.versions.json`
- `tw install` shorthand command di CLI

### RSC Auto-inject
- `packages/compiler/src/rscAnalyzer.ts` — export `detectRSCBoundary()` dan `autoInjectClientBoundary()` sebagai public API Sprint 7
- `packages/next/src/webpackLoader.ts` — import rscAnalyzer, auto-inject `"use client"` berdasarkan `analyzeFile()` analysis
- `packages/next/src/turbopackLoader.ts` — import rscAnalyzer (Sprint 7 alignment)

### Figma Multi-mode
- `scripts/v45/figma-multi.mjs` — pull dari multiple Figma files (`--file=key1,key2`), mode selection (`--mode=dark`), diff antar mode (`diff --from=light --to=dark`), `modes` command untuk list available modes
- `tw sync figma` CLI otomatis route ke `figma-multi.mjs` jika ada `--file=`, `--mode=`, atau `modes` command

### Dynamic Route CSS (Sprint 7)
- `packages/next/src/routeCssMiddleware.ts` — `getDynamicRouteCssPaths()`, `getDynamicRouteCssLinks()`, `resolveDynamicRoute()`, `invalidateDynamicRouteCache()`
- Support `[id]`, `[...slug]` dynamic segments dengan cache per kombinasi params
- Fallback otomatis ke parent route jika tidak ada CSS spesifik

### Oxc Minify Full Pipeline
- `scripts/v47/minify.mjs` — 3-tier: oxc-minify (mangle+dead-code+compress) → esbuild (transform) → regex fallback
- Opsi: `--mangle`, `--dead-code`, `--comments=false`, `--target=`, `--json`, `--write`, `--out=`
- Report: mode, original/minified bytes, reduction%, durationMs

### Tests
- `packages/testing/test/sprint7.test.mjs` — 30 tests, semua pass

---

## Sprint 8 (2026-03-16)

### adopt — Monorepo Detection
- Auto-detect: npm workspaces, pnpm (`pnpm-workspace.yaml`), Nx (`nx.json`), Turborepo (`turbo.json`)
- `--all` flag: jalankan analisis di semua workspace packages sekaligus
- `--project=<dir>` tetap override monorepo detection
- Informational log saat monorepo terdeteksi

### tw lint — Custom Rules
- `--rules=path/to/rules.json` — load custom rules dari file JSON
- `.tw-lint.json` di CWD auto-loaded tanpa flag
- `--rule="pattern:message"` — inline custom rule (repeatable)
- Rule format: `{ id, pattern, message, severity: "error"|"warning" }`
- Output report: `customRulesLoaded` field

### tw lint — `--no-exit-0` & `--severity`
- `--no-exit-0` — exit 0 meski ada issues (CI-safe mode, e.g. untuk warning-only runs)
- `--severity=error|warning` — set minimum severity yang memicu exit code 1
- Output report: `noExit0` dan `severity` fields

---

## Sprint 9 (2026-03-16)

### Studio Desktop — Tray Icon
- `packages/studio-desktop/src/icons/tray.png` + `tray@2x.png` — gradient blue-to-teal PNG icon
- `createTray()` fully implemented: `new Tray(iconPath)`, tooltip, context menu
- Context menu: Open Studio, Open in Browser, separator, project name, Quit
- `tray.on("click")` — toggle window visibility
- `tray.on("double-click")` — focus window

### Plugin Marketplace
- `scripts/v45/marketplace.mjs` — publish, search, featured, info, unpublish
- Auto-inference of category (animation/layout/theme/ui/typography/utilities)
- Offline fallback: publish to local `tw registry`, search in `.tw-registry/`
- `tw plugin marketplace` + `tw plugin publish` commands di CLI

### tw parse — .vue .svelte .mdx
- Hybrid strategy: `.vue/.svelte/.mdx/.html` → regex-direct (skip Babel, faster)
- `extractFromVue()` — extract `<script>` + `class=` from template
- `extractFromSvelte()` — extract `<script>` + `class=` / `class:directive`
- `extractFromMdx()` — extract JSX blocks + imports
- `.js/.jsx/.ts/.tsx` tetap Oxc-first → Babel → regex

### tw transform — .mdx
- `.mdx` pre-processing: strip markdown prose, keep JSX/imports for transform
- mode: `mdx-extracted`

---

## Sprint 10 (2026-03-16)

### tw lint — Tailwind config custom rules validation
- `loadTailwindConfigClasses()` — static analysis dari `tailwind.config.js/ts/mjs/cjs`
- Ekstrak: `addUtilities()`, `addComponents()`, `extend:` theme keys
- Config classes suppress false-positive deprecated warnings
- `knownConfigClasses` diteruskan ke worker threads via `workerData`

### Registry — npm packument protocol
- `GET /:name` endpoint — returns npm packument format: `dist-tags`, `versions`, `dist.tarball`
- Compatible dengan `npm install --registry=http://localhost:4040`
- `tw registry help` command added

### VS Code — LSP client
- `startLspServer()` / `stopLspServer()` — manage `lsp.mjs` process lifecycle
- Reads `tailwindStyled.lsp.enable` setting (default: true)
- Auto-restart on settings change via `onDidChangeConfiguration`
- Clean shutdown di `deactivate()`

### tw sync — S3:// protocol
- `tw sync pull --from=s3://bucket/key` — resolve via `AWS_ENDPOINT_URL` → HTTP
- Native `@aws-sdk/client-s3` fallback jika available
- Helpful error message jika tidak ada credentials

### tw parse — Native Rust tier 0
- Mencoba `native/index.mjs` (.node binding) sebagai Tier 0 sebelum Oxc
- Graceful fallback: native → Oxc → Babel → regex
- `mode: 'native-rust'` jika compiled binding tersedia

---

## Sprint 10+ (2026-03-16)

### Manifest dev mode serving
- `withTailwindStyled({ devManifest: true })` — default aktif di dev mode
- Next.js rewrites: `/__tw/css-manifest.json` → `.next/static/css/tw/css-manifest.json`
- `/__tw/:path*.css` → route CSS chunks di `.next/static/css/tw/`
- `routeCssMiddleware` — tambah `public/__tw/` sebagai path candidate

### Plugin registry checksum & auto-update
- `PluginRegistry.verifyIntegrity(name)` — sha256 hash comparison
- `PluginRegistry.checkForUpdate(name)` — semver diff vs installed version
- `PluginRegistry.checkAllUpdates()` — batch update check semua plugins
- CLI: `tw plugin update-check` + `tw plugin verify <name>` (+ `--json`)

### CSS generation heading fix (tw-v50.md)
- Heading diupdate: "Output hanya classCount — full CSS generation Sprint 10+" → "CSS Generation — cluster output Sprint 10+"
- Workaround diperjelas: `tw cluster build src/ && tw split src/ artifacts/route-css`

## [Implementation Session 2026-04] — Major Test Coverage + Bug Fixes

### Fixed
- **VSCode Extension**: `extension.ts` sekarang menggunakan `providers/completionProvider.ts` dan `hoverProvider.ts` yang benar (sebelumnya inline hardcoded)
- **CLI scan**: flag `--save` menulis `.tailwind-styled/scan-cache.json` dengan format lengkap untuk VSCode EngineService
- **RC Gate workflow**: referensi `.mjs` yang broken diganti dengan runner yang benar
- **TWS_DISABLE_NATIVE**: env var sekarang dikenali di `nativeBridge.ts` dan `nativeBinding.ts`
- **TwError**: upgrade dengan `fromZod()`, `source`, `originalCause`, `toJSON()`, `toCliMessage()`
- **ReverseLookup**: `clearCache()`, `pruneCache()`, MAX_CACHE_BYTES untuk mencegah memory leak (QA #33)
- **cssToIr**: `createIdGenerator()` factory pattern — eliminasi race condition (QA #32)
- **DSE**: `runDeadStyleElimination()` sekarang memanggil `eliminateDeadCss` + `optimizeCss` (Phase 3 compiler v5)
- **ImpactTracker**: `analyzeWithBundle()` dan `analyzeAll()` — bundleAnalyzer sekarang digunakan
- **CvFn/TwComponentFactory**: eliminasi `any`, proper generics dengan `InferVariantProps<C>` (CRITIQUE-20 #1)
- **extend()**: overload baru yang support `extend({ classes, variants })` dalam satu call (CRITIQUE-20 #2)
- **CLI prototype commands**: graceful handler dengan info berguna daripada crash
- **CLI docs**: label prototype di help dengan path script
- **test fixtures**: `generate.mjs` ESM rewrite (QA #30)
- **tsconfig**: pisahkan `tsconfig.build.json` (tanpa path aliases) dan `tsconfig.dev.json` (QA #24)
- **astParser**: zero-let — `loadOxcParseSync()` factory
- **astTransform**: `mode` option dihapus dari destructuring

### Added
- `packages/shared/src/errors.ts`: standalone TwError file
- `packages/shared/src/generated/`: scaffold untuk auto-generated schemas
- `packages/shared/src/native-schemas.ts`: Zod schemas untuk semua native binding responses (QA #19)
- Engine facade: `scanWorkspace()`, `analyzeWorkspace()`, `generateSafelist()`, `build()`
- `CONTRIBUTING.md`: section "Berkontribusi tanpa Rust" (CRITIQUE-20 #20)
- `docs/plugin-registry.md`: complete documentation (Track B Issue 7)
- `docs/api/engine.md`, `analyzer.md`, `cli.md`: English translation
- `artifacts/.gitkeep`: scaffold untuk RC gate artifacts
- `.github/workflows/plugin-registry-test.yml`: matrix CI (Track B Issue 1)
- `tsconfig.build.json`, `tsconfig.dev.json`: separation of concerns (QA #24)

### Tests Added (39 test files, 318 test cases)
- `packages/shared/tests/`: errors, hash, cache, nativeBinding, native-schemas
- `packages/compiler/tests/`: transformSource, extractAllClasses, incrementalEngine, variants, dse
- `packages/engine/tests/`: facade functions
- `packages/scanner/tests/`: isScannableFile, scanFile, scanWorkspace
- `packages/analyzer/tests/`: classToCss, analyzeWorkspace
- `packages/atomic/tests/`: parseAtomicClass, generateAtomicCss, toAtomicClasses
- `packages/preset/tests/`: defaultPreset, designTokens, generateTailwindCss
- `packages/plugin-registry/__tests__/`: 20 integration tests
- `packages/plugin-registry/benchmark/`: SLO benchmark
- `packages/vue/__tests__/`: cv(), tw(), extend()
- `packages/svelte/__tests__/`: cv(), tw()
- `packages/testing/__tests__/`: all matchers (18 tests)
- `packages/storybook-addon/tests/`: generateArgTypes, enumerateVariantProps (18 tests)
- `packages/theme/tests/`: liveToken, tokenRef, tokenVar, ThemeRegistry
- `packages/runtime-css/tests/`: batchedInjector
- `packages/runtime/tests/`: cx(), createComponent
- `packages/vite/tests/`: tailwindStyledPlugin
- `packages/next/tests/`: withTailwindStyled
- `packages/rspack/tests/`: TailwindStyledRspackPlugin
- `packages/cli/tests/`: scan (--save), preflight, args
- `packages/plugin-api/tests/`: createPluginRegistry, createPluginContext
- `packages/plugin/tests/`: createTwPlugin, registerTransform
- `packages/animate/tests/`: AnimationRegistry, animate, compileAnimation
- `packages/dashboard/tests/`: state, metrics, normalizeMetrics
- `packages/devtools/tests/`: exports
- `packages/core/tests/`: cv(), cx(), cxm()
- `packages/syntax/tests/`: parseClasses(), extractAllClasses()
- `tests/smoke/`: root-imports, pipeline, adapters
