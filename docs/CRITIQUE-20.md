# 20 Pertanyaan Kritik + Jawaban — tailwind-styled-v4

> Analisis berbasis kode nyata. Setiap klaim dikutip dari file spesifik.

---

## DX (Developer Experience)

---

### 1. `CvFn<C> = any` dan `TwComponentFactory<T> = any` — nilai jual type safety-nya di mana?

**Pertanyaan:**
Library ini mengklaim "TypeScript tahu variant apa yang valid" di README. Tapi di `packages/core/src/types.ts` baris 44 dan 89:
```typescript
export type CvFn<C = any> = any
export type TwComponentFactory<T = any> = any
```
`cv()` return `any`. `tw(MyComponent)` return `any`. Editor tidak bisa autocomplete variant, tidak ada red underline saat typo. Kalau return type `any`, klaim type safety-nya jadi marketing copy, bukan fitur teknis. **Pertanyaannya: kenapa fitur yang paling sering diiklankan justru paling lemah type-safety-nya?**

**Jawaban:**
Root cause-nya adalah teknis nyata, bukan malas. `cv()` perlu menghasilkan tipe seperti:
```typescript
(props: { size?: "sm" | "lg"; intent?: "primary" | "danger" }) => string
```
Ini butuh conditional type yang dalam: `keyof C["variants"]` untuk keys, `keyof C["variants"][K]` untuk values. Implementasi yang benar bisa dibuat:
```typescript
type CvFn<C extends ComponentConfig> = (
  props?: { [K in keyof C["variants"]]?: keyof C["variants"][K] } 
        & { className?: string }
) => string
```
Masalahnya compound variants — tipe `{ class: string; intent: "primary"; size: "sm" }` butuh `Partial<VariantValues<C>>` yang valid, bukan `Record<string, string>`. Ini yang bikin `CVA` (class-variance-authority) juga pernah struggle. **Solusi:** Ganti `CvFn<C> = any` dengan tipe proper di `types.ts`, pakai template literal types untuk build exhaustive union. Prioritas tinggi — ini yang paling sering dipakai user setelah `tw.button`.

---

### 2. `extend()` hanya menerima template literal — bagaimana kalau mau extend variants juga?

**Pertanyaan:**
`Button.extend` baris di `createComponent.ts`:
```typescript
component.extend = (strings: TemplateStringsArray) => { ... }
```
`extend()` hanya menerima template literal. Tidak bisa extend dan tambah variant baru sekaligus. Kalau mau tambah variant, harus pakai `withVariants()` terpisah. Tapi tidak ada cara `extend` sekaligus override `defaultVariants`. **Apakah ini disengaja sebagai constraint desain, atau oversight?**

**Jawaban:**
Ini gap desain. `extend` sengaja dibuat hanya untuk class extension (`base` merging), sedangkan variant extension ada di `withVariants()`. Tapi kombinasi keduanya tidak ada chaining yang bersih:
```typescript
// Yang ada sekarang — awkward:
const DangerButton = Button.withVariants({ variants: { loading: { true: "opacity-50" } } })
const BigDangerButton = DangerButton.extend`text-lg px-8`
// Tidak ada single-call: Button.extend`text-lg`.withVariants({...})
```
**Solusi:** Ubah signature `extend` menjadi overloaded:
```typescript
component.extend(strings: TemplateStringsArray): TwStyledComponent
component.extend(config: Partial<ComponentConfig>): TwStyledComponent  
component.extend(strings: TemplateStringsArray, config: Partial<ComponentConfig>): TwStyledComponent
```
Ini breaking change kecil tapi DX gain-nya signifikan.

---

### 3. State engine inject `<style>` tag per komponen ke DOM — konflik dengan CSP dan SSR?

**Pertanyaan:**
Di `packages/core/src/stateEngine.ts` baris 204:
```typescript
const style = document.createElement("style")
style.id = styleId
```
State engine inject style tag langsung ke DOM di runtime. Ini: (1) tidak bisa jalan di SSR tanpa `document` check, (2) kena Content-Security-Policy `style-src 'unsafe-inline'` di sebagian besar production app, (3) bypasss Tailwind's purging — CSS yang diinject tidak ada di build output, tidak bisa di-tree-shake. **Seberapa serius ini untuk production use?**

**Jawaban:**
Sangat serius. State API (`tw.button({ state: { active: "...", loading: "..." } })`) adalah fitur unik yang tidak ada di Tailwind biasa. Tapi mekanismenya bertentangan dengan best practice modern:
- **CSP**: Hampir semua Next.js production setup enforce `style-src` tanpa `unsafe-inline`. Style injection akan di-block diam-diam.
- **SSR**: Ada guard `if (typeof document === "undefined") return` tapi artinya style state tidak ada di HTML awal — flicker di hydration.
- **Purging**: Karena diinject runtime, PurgeCSS/Tailwind extractor tidak bisa menemukan class ini → produksi bisa strip class state yang dipakai.

**Solusi yang benar:** State CSS harus diekstrak di build time oleh compiler (seperti CSS Modules), bukan diinject runtime. Compiler sudah punya `rscAnalyzer` — state config juga harus diekstrak ke static CSS sheet. Sampai ini difix, `state` API tidak production-safe di strict CSP environments.

---

### 4. Language mixing: CLI berbahasa Indonesia, error berbahasa English, docs sebagian bilingual — siapa target user-nya?

**Pertanyaan:**
`packages/cli/src/commands/setup/prompt.ts`:
```
"Project type dipaksa via flag: ${label}"
"Non-interactive shell terdeteksi, pilih default: ${label}"
```
Tapi `packages/compiler/src/astParser.ts`:
```
"FATAL: oxc-parser parseSync is not available."
"Expected VariableDeclaration in parsed config"
```
`docs/faq.md` ditulis Bahasa Indonesia. `docs/getting-started.md` campuran. README punya tabel `Apa ini?` dalam Bahasa Indonesia. **Ini library untuk developer Indonesia saja, atau internasional? Kalau internasional, kenapa half of the UX text tidak bisa dibaca oleh non-Indonesian speakers?**

**Jawaban:**
Ini bukan soal preferensi — ini soal konsistensi yang mempengaruhi adoption. Library open-source yang mau dipakai luas harus memilih satu dari dua path yang konsisten:
- **Path A (Indonesia-first):** Semua user-facing text dalam Bahasa Indonesia, termasuk error messages. Cocok untuk library yang targetnya komunitas lokal.
- **Path B (English-first):** Semua user-facing text dalam English. Ini standar untuk library npm publik yang mau diindeks, didiskusikan, dan di-Stack Overflow oleh komunitas global.

Campuran sekarang tidak menguntungkan siapapun. **Rekomendasi konkret:** Audit semua string di `packages/cli/src/` dan `packages/*/src/` — pisahkan ke file i18n constant, implementasi pertama English, bahasa lain bisa jadi contribution path.

---

## UX (User Experience — API Design)

---

### 5. `tw.server.div` hanya runtime warning — kenapa bukan compile-time error?

**Pertanyaan:**
`packages/core/src/twProxy.ts` baris 200:
```typescript
`[tailwind-styled-v4] tw.server.${tagName} rendered in browser. `
```
Ini hanya `console.warn`. Tapi library sudah punya `rscAnalyzer.ts` yang bisa deteksi konteks RSC/client saat compile time. Compiler tahu mana file yang punya `'use client'` directive. **Kenapa pelanggaran `tw.server` tidak dijadikan compile error yang gagalkan build?**

**Jawaban:**
`rscAnalyzer.ts` sudah melakukan analisis ini — hasil `needsClientDirective` sudah dipakai untuk auto-inject `'use client'`. Tapi analisis ini satu arah: dia detect komponen yang _butuh_ client directive, bukan yang _salah gunakan_ server marker. Untuk compile-time error `tw.server` di client context:
```typescript
// Di astTransform.ts, setelah rscAnalysis:
if (!rscAnalysis.isServer && source.includes("tw.server.")) {
  throw new TwError("compile", "TW_SERVER_IN_CLIENT", 
    "tw.server.* tidak bisa dipakai di client component")
}
```
Ini straightforward karena semua info sudah ada. **Alasan belum diimplementasikan:** kemungkinan karena ada false positive risk — file yang import `tw.server` tapi tidak render langsung (misal re-export utility). Perlu granular AST check, bukan `string.includes`. Worth implementing sebagai opt-in flag `strictServerComponents: true` di config.

---

### 6. `cv()` tidak bisa dipakai headless di luar React — tapi `TwPlugin.setup()` sinkron dengan async hook

**Pertanyaan:**
`cv()` didesain "tanpa element HTML — untuk komponen custom" dan "Compatible with shadcn/ui, Radix, Headless UI." Tapi `TwPlugin` di `packages/plugin-api/src/index.ts`:
```typescript
export interface TwPlugin {
  name: string
  setup(ctx: TwContext): void  // sinkron
}
```
Dengan `ctx.onBuildEnd(hook: () => void | Promise<void>)` sebagai async hook. Plugin tidak bisa melakukan async initialization — tidak bisa fetch remote config, tidak bisa baca file async di setup. **Kalau library target-nya framework-agnostic, kenapa plugin API-nya tidak async dari awal?**

**Jawaban:**
Plugin lifecycle `setup()` sinkron adalah desain yang umum (Vite plugin juga punya beberapa sync lifecycle). Masalahnya bukan sinkron vs async di `setup` — masalahnya tidak ada hook lifecycle yang tepat untuk async initialization. Vite solves ini dengan `buildStart()` async hook. **Fix yang benar:**
```typescript
export interface TwPlugin {
  name: string
  setup(ctx: TwContext): void          // tetap sync untuk registrasi
  buildStart?(): void | Promise<void>   // TAMBAH: async init sebelum build
  configResolved?(config: unknown): void | Promise<void>
}
```
`setup()` tetap sync untuk mendaftarkan variants/utilities/transforms. `buildStart()` untuk async work. Ini non-breaking karena additive.

---

### 7. Dua `ComponentConfig` berbeda di `core/types.ts` vs `plugin-api/src/index.ts`

**Pertanyaan:**
`packages/core/src/types.ts`:
```typescript
export interface ComponentConfig {
  base?: string
  variants?: Record<string, Record<string, string>>
  defaultVariants?: Record<string, string>
  compoundVariants?: Array<{ class: string; [key: string]: string }>
  state?: Record<string, Record<string, string>>
  container?: Record<string, string>
  containerName?: string
}
```
`packages/plugin-api/src/index.ts`:
```typescript
export interface ComponentConfig {
  base: string           // required di sini
  variants: Record<...>  // required
  compoundVariants: Array<{ class: string } & CompoundCondition>  // shape berbeda
  defaultVariants: Record<...>
  // tidak ada: state, container, containerName
}
```
Plugin author yang pakai `ComponentConfig` dari `plugin-api` akan dapat tipe yang berbeda dari yang dirender oleh `core`. **Ini bukan cuma inkonsistensi gaya — ini contract yang berbeda.**

**Jawaban:**
Ini technical debt dari arsitektur plugin-api yang dibuat setelah core. Waktu `plugin-api` dibuat sebagai package terpisah untuk memutus circular dependency, `ComponentConfig` di-redefinisi locally alih-alih diimport dari `shared`. **Fix:**
```typescript
// packages/shared/src/schemas.ts — SATU definisi
export interface ComponentConfig {
  base?: string
  variants?: Record<string, Record<string, string>>
  defaultVariants?: Record<string, string>
  compoundVariants?: Array<{ class: string; [key: string]: unknown }>
  state?: Record<string, Record<string, string>>
  container?: Record<string, string>
  containerName?: string
}

// packages/plugin-api/src/index.ts
export type { ComponentConfig } from "@tailwind-styled/shared"

// packages/core/src/types.ts
export type { ComponentConfig } from "@tailwind-styled/shared"
```
Satu source of truth. Tidak ada lagi field yang hilang tergantung kamu import dari mana.

---

## CX (Contributor Experience)

---

### 8. 917 file, tidak ada StackBlitz/CodeSandbox, setup butuh Rust toolchain — barrier to entry terlalu tinggi

**Pertanyaan:**
Untuk coba library ini, contributor atau evaluator harus: clone repo 917 file, install Rust 1.75+, jalankan `npm run build:rust` (bisa 5–10 menit tergantung mesin), build semua 28 packages, baru bisa test. Padahal ada `examples/simple-app-html`. **Berapa banyak potential contributors yang gugur di step install Rust?**

**Jawaban:**
Ini friction nyata yang bisa diukur. Solusi berlapis:

1. **Immediate:** Publish pre-built binary di npm `optionalDependencies` per platform (seperti yang sudah dilakukan esbuild dan Biome). User yang `npm install` langsung dapat binary tanpa build Rust.

2. **Short-term:** Buat `npx create-tailwind-styled` yang: setup project baru, download pre-built binary, dan langsung ready. Saat ini `create-tailwind-styled` sudah ada di packages tapi tidak ada versi `npx`-ready.

3. **Contribution path:** Pisahkan "full contributor" (butuh Rust) dari "JS contributor" (hanya butuh Node). Banyak improvement di CLI, docs, dan packages non-native tidak butuh Rust sama sekali. CONTRIBUTING.md harus jelaskan ini.

---

### 9. FAQ kontradiksi langsung dengan Plan: "native opsional" vs "remove all JS fallbacks"

**Pertanyaan:**
`docs/faq.md`:
```
"Apakah wajib pakai Rust parser? Tidak. Itu fase optimasi lanjutan (opsional). 
Default tetap JS path dengan fallback aman."
```
Tapi `plans/remove-js-fallback-native-only.md`:
```
"Goal: Remove all JavaScript fallback code... 
FATAL: Native binding 'X' not found. There is no JavaScript fallback."
```
Dua dokumen resmi, dua posisi yang berlawanan 180 derajat. **User yang baca FAQ dan user yang baca plans mendapat kontrak yang berbeda tentang native requirement.**

**Jawaban:**
Ini bukan ambiguitas — ini documentation drift yang konkret. FAQ ditulis waktu masih ada fallback, plan ditulis setelah keputusan untuk remove fallback, tapi FAQ tidak diupdate. **Fix langsung:**

```markdown
## Apakah wajib pakai Rust parser?

Ya, mulai v5. Native Rust binding diperlukan — tidak ada JavaScript fallback.
Gunakan `npm run build:rust` untuk build dari source, atau install package 
dengan pre-built binary (tersedia untuk Linux/macOS/Windows).

Versi lama (v4.x) masih punya JS fallback sebagai compatibility shim.
```

Setiap plan yang sudah dieksekusi harus trigger update ke FAQ dan README. Idealnya ini jadi checklist item di release gate.

---

## Architecture

---

### 10. `@tailwind-styled/atomic` dan `packages/compiler/src/atomicCss.ts` adalah dua implementasi hal yang sama

**Pertanyaan:**
`packages/compiler/src/atomicCss.ts` baris 2:
```
* @deprecated in v5 — Use @tailwind-styled/atomic package instead
```
Kedua file punya `TW_PROPERTY_MAP`, `parseAtomicClass`, dan CSS generation logic. `atomicCss.ts` = 278 baris, `packages/atomic/src/index.ts` = 214 baris. Tapi `atomicCss.ts` masih ada di compiler, masih diimport, belum dihapus. **Ini bukan deprecation — ini dead code yang masih berjalan paralel dengan penggantinya.**

**Jawaban:**
`@deprecated` comment tanpa removal plan adalah technical debt yang tumbuh. Selama `atomicCss.ts` masih diimport di `compiler`, ada dua implementasi yang bisa diverge secara silent — bug fix di satu tidak otomatis masuk ke yang lain. **Plan konkret:**

1. Audit semua import `atomicCss` di compiler — ada berapa file yang masih import?
2. Ganti semua import ke `@tailwind-styled/atomic`
3. Hapus `atomicCss.ts` dari compiler dalam satu PR
4. Pastikan `packages/atomic` punya semua fungsi yang dibutuhkan compiler

Deprecated file dengan masa pakai tidak jelas = maintenance burden permanen.

---

### 11. `stateEngine` inject CSS pakai `document.createElement("style")` yang tidak bisa di-SSR

**Pertanyaan (lanjutan dari #3 — aspek arsitektur):**
State engine pakai `@apply` di comment tapi actual implementation pakai hardcoded property map:
```typescript
const TW_PROPERTY_MAP = {
  "inline-flex": "display:inline-flex",
  "opacity-50": "opacity:.5",
  // ...
}
```
Ini partial Tailwind implementation — hanya cover subset class. Kalau user pakai `state: { active: "shadow-xl ring-2 ring-blue-500" }`, `shadow-xl` tidak ada di map dan akan di-skip diam-diam. **Ini silent failure, bukan error.**

**Jawaban:**
Silent failure di styling API adalah yang paling susah di-debug — user lihat komponen tidak berubah saat state aktif, tapi tidak ada error. Ini terjadi karena `stateEngine` punya fallback:
```typescript
const declaration = TW_PROPERTY_MAP[cls]
if (!declaration) continue  // skip unknown class — silent
```
**Fix architectural:** State config harus diekstrak dan dikompilasi seperti `variants`. Compiler sudah tahu semua class yang dipakai — state class juga harus masuk extraction pipeline saat build, bukan diinterpretasikan runtime dari map parsial. Ini butuh perubahan ke compiler `astTransform.ts`, bukan hanya `stateEngine.ts`.

---

## Performance

---

### 12. Benchmark `tw parse avg 162ms` tidak jelas konteksnya — CLI subprocess atau in-process transform?

**Pertanyaan:**
`docs/benchmark/toolchain-comparison.json`:
```json
{ "label": "tw parse", "avgMs": 162, "p95Ms": 273 }
```
162ms per operasi adalah angka yang sangat berbeda maknanya tergantung konteks:
- Kalau ini cold-start CLI subprocess: wajar, startup Node overhead.
- Kalau ini per-file transform di Vite dev server: catastrophic — 162ms/file × 200 files = 32 detik HMR.
- Kalau ini warm in-process transform: perlu dicompare dengan esbuild (< 1ms) dan Rollup (< 5ms).

**Benchmark tanpa konteks adalah marketing, bukan data.**

**Jawaban:**
Dari `benchmarks/native-parser-bench.mjs` dan `docs/benchmark/`, semua benchmark dijalankan sebagai CLI subprocess terpisah — ini cold-start measurement. Ini valid untuk CLI UX (seberapa cepat `tw analyze` terasa), tapi sama sekali tidak relevan untuk mengevaluasi performa build-time transform. **Yang perlu ditambahkan:**
1. **In-process benchmark:** Ukur waktu transform per file dari dalam Vite plugin — bukan subprocess.
2. **Comparative benchmark:** Compare dengan vanilla Tailwind CSS v4's own Oxide engine (yang juga Rust-based).
3. **HMR latency benchmark:** Ukur end-to-end dari save file sampai browser update.

Tanpa ini, claim "Rust-powered" tidak bisa diverifikasi secara independen.

---

### 13. `twMerge` dipanggil di setiap render — bukan caching

**Pertanyaan:**
Di `packages/core/src/createComponent.ts`, setiap kali komponen render:
```typescript
const variantClasses = resolveVariants(variants, props, defaults)
const compoundClasses = resolveCompound(compoundVariants, props)
// lalu:
const className = twMerge(base, variantClasses, compoundClasses, runtimeClassName)
```
`twMerge` melakukan string parsing dan conflict resolution setiap render. Untuk komponen stateless yang selalu punya props sama (misal `<Button intent="primary" size="md">`), hasil merge selalu identik — tapi selalu dihitung ulang. **Tidak ada memoization sama sekali.**

**Jawaban:**
Ini genuine perf issue untuk high-frequency render components. `twMerge` bukan trivial — ia parse class string, build conflict map, dan resolve. Untuk komponen dengan fixed variant combination:
```typescript
// Solusi: memoize berdasarkan variant combination key
const mergeCache = new Map<string, string>()

function cachedMerge(base: string, variants: string, compound: string, extra?: string): string {
  const key = `${base}|${variants}|${compound}|${extra ?? ""}`
  if (mergeCache.has(key)) return mergeCache.get(key)!
  const result = twMerge(base, variants, compound, extra)
  mergeCache.set(key, result)
  return result
}
```
Cache key bisa dibuat lebih efisien pakai hashing. Alternatif: extract class computation ke luar render function untuk komponen yang variant combination-nya finite dan small.

---

## Security & Reliability

---

### 14. Native binding error message expose daftar path internal sistem — potential info leak

**Pertanyaan:**
`packages/shared/src/nativeBinding.ts` saat binding tidak ditemukan:
```
"The binding was not found in any of these paths:"
"  - /home/user/.npm/lib/node_modules/..."
"  - /var/app/node_modules/@tailwind-styled/..."
```
Error message ini print semua candidate paths ke stderr. Di production environment (Next.js error overlay, Vercel build logs yang bisa diakses), ini expose internal directory structure server. **Ini standard practice di build tools, tapi perlu disadari.**

**Jawaban:**
Ini trade-off antara debuggability dan information exposure. Build tools seperti esbuild dan Biome juga print paths — ini dianggap acceptable karena error ini hanya muncul di build-time (developer environment), bukan runtime user-facing. **Yang perlu diperhatikan:**
- Path exposure di **build logs** = acceptable, ini developer debugging info
- Path exposure di **runtime SSR error** = problematic jika leak ke client

Saat ini `loadNativeBindingOrThrow` hanya dipakai di build/compile path, bukan request path — jadi ini acceptable. **Tapi** perlu dipastikan dengan explicit guard bahwa native binding error tidak bisa bubble ke SSR render response. Tambahkan note di error handling docs.

---

### 15. `require()` dengan `createRequire` untuk load native binding — tidak aman di strict ESM-only context

**Pertanyaan:**
`packages/shared/src/nativeBinding.ts`:
```typescript
import { createRequire } from "node:module"
const req = createRequire(import.meta.url)
// ...
const mod = req(candidate)  // CJS require di ESM context
```
`createRequire` dalam ESM works tapi ada edge cases: Bun runtime punya behavior berbeda, Deno dengan Node compat mode kadang fail, dan beberapa bundler yang aggressively tree-shake bisa strip `createRequire`. **Project sudah state ESM-first tapi native loading masih pakai CJS mechanism.**

**Jawaban:**
`createRequire` adalah cara resmi untuk load `.node` native addons di ESM context — ini bukan workaround, ini spec-compliant. `.node` files adalah CommonJS native modules dan memang harus diload via `require()`. Tidak ada `import()` equivalent untuk native addons di Node.js standard. **Apa yang perlu diperhatikan:**
- **Bun:** Sudah support `createRequire` dengan benar sejak Bun 1.0
- **Bundlers:** `tsup` dan `rollup` perlu `external: [/\.node$/]` untuk tidak mencoba bundle native files — ini sudah ada di beberapa tsup configs tapi perlu diverifikasi konsisten di semua adapter

Ini bukan bug tapi perlu dokumentasi eksplisit bahwa native addons hanya bisa dipakai di Node.js-compatible runtimes (bukan edge/Cloudflare Workers).

---

## Testing

---

### 16. `packages/shared` punya 0 test files — padahal ini package paling kritis

**Pertanyaan:**
```
shared: 0 test files
```
`packages/shared` berisi: `TwError`, `logger`, `nativeBinding`, `schemas`, `hash`, `cache`, `timing`, `telemetry`, `version`. Ini adalah fondasi dari seluruh monorepo — setiap package lain depend on `shared`. Tapi tidak ada satupun test file. `packages/testing` punya 10 test files — tapi untuk testing utilities yang dipakai user, bukan untuk `shared` internals.

**Jawaban:**
Ironis — package yang paling banyak dipakai oleh semua packages lain adalah yang paling tidak ditest. Ini berarti:
- Bug di `TwError.fromZod()` tidak akan terdeteksi sampai ada error di production
- Perubahan di `nativeBinding.ts` candidate resolution tidak punya regression safety
- `hash.ts` yang dipakai untuk cache key generation tidak punya correctness guarantee

**Test yang harus ada minimal:**
```javascript
// packages/shared/test/errors.test.mjs
test("TwError.fromZod() extracts first issue path and message")
test("TwError.fromRust() preserves code and message")
test("TwError.toJSON() serializes correctly")

// packages/shared/test/hash.test.mjs  
test("hash() is deterministic for same input")
test("hash() produces different output for different inputs")

// packages/shared/test/nativeBinding.test.mjs
test("resolveNativeBindingCandidates() includes env var override first")
test("formatErrorMessage() handles non-Error objects")
```

---

### 17. Test pattern `mod = require(dist)` berarti semua tests hanya bisa jalan setelah full build

**Pertanyaan:**
`packages/compiler/test/dse.test.mjs`:
```javascript
try {
  mod = require(path.resolve(__dirname, "../dist/index.js"))
} catch {
  console.warn("compiler dist not found — run `npm run build` first")
  process.exit(0)  // ← exit 0, bukan fail
}
```
Test tidak fail saat dist tidak ada — `process.exit(0)` adalah success exit code. Berarti `npm test` di CI bisa pass bahkan ketika semua test di-skip karena dist belum ada. **False green di CI.**

**Jawaban:**
`process.exit(0)` di sini adalah pragmatic decision untuk development workflow — developer yang `npm test` di package individual tidak harus build dulu. Tapi di CI context ini berbahaya. **Fix dua lapis:**

1. **CI fix:** `turbo.json` pipeline harus enforce `build` sebelum `test` untuk packages yang test-nya depend on dist:
```json
"test": {
  "dependsOn": ["build", "^build"]
}
```

2. **Test fix:** Ganti `process.exit(0)` dengan proper skip:
```javascript
import { skip } from "node:test"
if (!distExists) {
  skip("dist not found — run build first")
}
```
`skip()` di `node:test` membuat test appear sebagai skipped (bukan passed) di output — visible di CI tanpa failing the suite.

---

## Documentation & Roadmap

---

### 18. Status dashboard "DONE/Production-ready" untuk fitur yang punya `CvFn = any` di type definition

**Pertanyaan:**
`docs/faq.md` status table:
```
DONE / Production-ready: Core Engine, scanner, CLI, Vue/Svelte adapters, ...
```
Tapi `packages/core/src/types.ts` punya 9 `any` annotations, `CvFn<C> = any`, dan `TwComponentFactory<T> = any`. Sebuah library styling yang main selling point-nya adalah type safety, tapi public API types-nya `any` — apakah definisi "production-ready" yang dipakai di sini sama dengan definisi industri?

**Jawaban:**
"Production-ready" di sini berarti "runtime behavior benar dan stabil" — bukan "type definitions lengkap". Ini bukan salah, tapi perlu dikomunikasikan lebih jelas. Ada dua dimensi yang perlu dipisahkan di status tracking:

| Dimensi | Status |
|---------|--------|
| Runtime correctness | ✅ Core engine works |
| Type safety (public API) | 🟡 Partial — cv(), tw() return any |
| Type safety (internal) | ✅ Strict |
| Documentation coverage | 🟡 Partial — bilingual gap |
| Test coverage | 🟡 Good for compiler, zero for shared |

Status dashboard perlu multi-dimensional, bukan single DONE/Production-ready label yang ambigu.

---

### 19. 8 commands di `--help` adalah stub placeholder — user tidak tahu mana yang jalan

**Pertanyaan:**
CLI `--help` menampilkan: `tw optimize`, `tw split`, `tw critical`, `tw cache`, `tw cluster`, `tw adopt`, `tw metrics`, `tw audit`. Semua terdaftar di `program.ts` via loop:
```typescript
;["cache", "cluster", "cluster-server", "adopt", "metrics", "audit"].forEach((name) => {
```
User yang jalankan `tw cache enable` hari ini kemungkinan dapat error atau no-op tanpa pesan jelas. **`--help` yang menampilkan command yang belum bisa dipakai menurunkan kepercayaan pada command yang sudah bisa dipakai.**

**Jawaban:**
Ada dua pendekatan valid:

**Option A — Hide unimplemented commands:**
```typescript
// Jangan register command yang belum ada implementasinya di --help
// Register tapi dengan .hidden():
program.command("cache [args...]").hidden()
```

**Option B — Explicit experimental label:**
```
tw cache <enable|status> [remote]     [planned: v5.1]
tw cluster <init|build> [workers]     [planned: v5.1]
```

**Recommendation:** Option B lebih jujur dan jadi roadmap preview yang berguna. Tambahkan middleware handler yang intercept unimplemented commands:
```typescript
program.hook("preAction", (thisCommand) => {
  if (PLANNED_COMMANDS.has(thisCommand.name())) {
    console.log(`tw ${thisCommand.name()} is planned for v5.1`)
    console.log("Follow: github.com/user/tailwind-styled-v4/issues/XX")
    process.exit(0)
  }
})
```

---

### 20. Tidak ada contribution path yang jelas untuk non-Rust contributor — monorepo terlalu intimidating

**Pertanyaan:**
`CONTRIBUTING.md` ada, `CODE_OF_CONDUCT.md` ada. Tapi tidak ada "good first issue" label guide, tidak ada "JS-only packages" list, tidak ada "tasks yang tidak butuh Rust" section. Seseorang yang mau berkontribusi ke docs, CLI, atau Vue adapter tidak butuh Rust sama sekali — tapi tidak ada petunjuk bahwa itu memungkinkan tanpa setup native build.

**Jawaban:**
Ini contributor funnel yang bocor. Dari semua 29 packages, ada setidaknya 15 yang sama sekali tidak menyentuh native:

**Packages yang 100% JS/TS, tidak butuh Rust:**
`cli`, `dashboard`, `devtools`, `plugin`, `plugin-api`, `plugin-registry`, `preset`, `runtime`, `runtime-css`, `storybook-addon`, `svelte`, `syntax`, `theme`, `testing`, `vue`

**Fix konkret di CONTRIBUTING.md:**
```markdown
## Berkontribusi Tanpa Rust

Banyak area yang bisa dikerjakan tanpa install Rust toolchain:

### Quick Setup (JS only)
npm install
npm run build -w packages/shared -w packages/syntax  # 2 dep packages
npm run dev -w packages/cli  # mulai develop

### Area yang tidak butuh native build:
- packages/cli — CLI commands
- packages/devtools — DevTools overlay UI  
- packages/vue, packages/svelte — framework adapters
- docs/ — documentation
- packages/plugin-* — plugin system
```

Ini bisa triple contributor pool tanpa mengubah satu baris kode pun.

---

*Dokumen ini dihasilkan dari analisis langsung source code per 2026-04-04. Setiap klaim memiliki file dan baris referensi yang bisa diverifikasi.*
