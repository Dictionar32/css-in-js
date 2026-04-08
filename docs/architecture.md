# Architecture Guide

## Overview

tailwind-styled-v4 adalah **styling compiler** bukan styling library biasa.
Developer menulis `tw.div\`p-4\`` — compiler mengubahnya ke React component statis.

```
DEVELOPER CODE                    COMPILED OUTPUT
──────────────                    ───────────────
tw.div`p-4 bg-white`    →    React.forwardRef(function _Tw_div(props, ref) {
                               ...return createElement("div", {..., className: "p-4 bg-white"});
                             })

tw.button({ variants })  →    const __vt_c1 = { size: { sm: "px-4 text-sm", lg: "px-4 text-lg" } };
                              React.forwardRef(function _TwV_button_c1(...) { ...lookup... })
```

---

## Monorepo Structure

```
tailwind-styled-v4/
│
├── packages/
│   │
│   ├── core/              ← runtime (~1.5kb)
│   │   └── src/
│   │       ├── twProxy.ts         tw.div, tw.server.div, tw(Component)
│   │       ├── createComponent.ts React.forwardRef factory
│   │       ├── cv.ts              standalone class variants
│   │       ├── cx.ts              class utilities
│   │       └── types.ts           TypeScript types
│   │
│   ├── compiler/          ← build-only, tidak masuk bundle
│   │   └── src/
│   │       ├── astTransform.ts       main pipeline orchestrator
│   │       ├── twDetector.ts         regex patterns + detectors
│   │       ├── classExtractor.ts     extract classes from source
│   │       ├── classMerger.ts        static conflict resolution
│   │       ├── variantCompiler.ts    compile variants to lookup table
│   │       ├── componentHoister.ts   hoist from render() to module scope
│   │       ├── rscAnalyzer.ts        RSC server/client detection
│   │       ├── atomicCss.ts          atomic CSS mode
│   │       ├── routeCssCollector.ts  collect CSS per route
│   │       ├── tailwindEngine.ts     embedded Tailwind CSS generation
│   │       ├── safelistGenerator.ts  generate safelist JSON
│   │       └── loadTailwindConfig.ts zero-config fallback
│   │
│   ├── preset/            ← built-in Tailwind config
│   │   └── src/
│   │       └── defaultPreset.ts     design tokens + zero-config preset
│   │
│   ├── runtime-css/       ← CSS injection for route CSS mode
│   │   └── src/
│   │       └── CssInjector.tsx      Server Component CSS injector
│   │
│   ├── next/              ← Next.js integration
│   │   └── src/
│   │       ├── withTailwindStyled.ts Next.js plugin
│   │       ├── turbopackLoader.ts    Turbopack loader
│   │       └── webpackLoader.ts      Webpack loader
│   │
│   ├── vite/              ← Vite integration
│   │   └── src/
│   │       └── plugin.ts
│   │
│   ├── cli/               ← project generator + unified CLI
│   │   └── src/
│   │       └── createApp.ts  npx create-tailwind-styled
│   │
│   ├── vue/               ← Vue 3 adapter (NEW v4.2)
│   │   └── src/
│   │       └── index.ts   tw(), cv(), extend(), TailwindStyledPlugin
│   │
│   ├── svelte/            ← Svelte 4/5 adapter (NEW v4.2)
│   │   └── src/
│   │       └── index.ts   cv(), tw(), use:styled, createVariants
│   │
│   ├── testing/           ← Test utilities (NEW v4.2)
│   ├── storybook-addon/   ← Storybook integration (NEW v4.2)
│   ├── dashboard/         ← Live metrics server (NEW v4.2)
│   └── studio-desktop/    ← Electron app (NEW v4.2)
│
├── examples/
│   └── next-app/          ← demo project (next-app-standar-config upgraded)
│
└── docs/
    ├── getting-started.md
    ├── api-reference.md
    └── architecture.md
```

---

## Compiler Pipeline (Full)

```
source.tsx
    │
    ▼
hasTwUsage()           → fast exit jika tidak ada tw syntax
    │
    ▼
analyzeFile()          → RSC analysis
    │                    - isServer / needsClientDirective
    │                    - clientReasons (hooks, event handlers)
    │
    ▼
hoistComponents()      → pindahkan tw declarations dari render() ke module scope
    │
    ▼
TEMPLATE_RE replace    → tw.tag`classes` / tw.server.tag`classes`
    │                    → renderStaticComponent()
    │                    → React.forwardRef(fn) dengan static className
    │
    ▼
OBJECT_RE replace      → tw.tag({ base, variants })
    │                    → compileVariants() → lookup table
    │                    → generateVariantCode() → const __vt_id = {...}
    │                    → renderVariantComponent()
    │
    ▼
WRAP_RE replace        → tw(Component)`classes`
    │                    → React.forwardRef wrapper
    │
    ▼
EXTEND_RE replace      → Component.extend`extra`
    │                    → React.forwardRef dengan merged className
    │
    ▼
inject prelude         → variant lookup tables → after imports
    │
    ▼
ensure React import    → jika belum ada
    │
    ▼
injectClientDirective  → hanya jika RSC analysis needsClientDirective = true
    │                    (CSS-only hover: focus: tidak trigger ini)
    │
    ▼
strip tw import        → jika semua tw usage sudah ter-transform
    │
    ▼
output.tsx             → pure React, zero runtime deps
```

---

## RSC Analysis Logic

```
CSS-only interactivity        → stays server
  hover:, focus:, active:
  group-hover:, peer-
  md:, lg:, responsive
  dark:, print:

JS-required                   → needs "use client"
  useState, useEffect, useRef
  onClick, onChange, onSubmit
  window., document.
  localStorage, sessionStorage
```

---

## Variant Compile

Developer writes:
```tsx
const Button = tw.button({
  base: "px-4 py-2",
  variants: { size: { sm: "text-sm", lg: "text-lg" } }
})
```

Compiler output:
```js
// Lookup table (prelude) — O(1) runtime access
const __vt_c1 = {
  "size": {
    "sm": "px-4 py-2 text-sm",   // base merged at compile time
    "lg": "px-4 py-2 text-lg"    // base merged at compile time
  }
};

// Component — no variant engine, just object lookup
const Button = React.forwardRef(function _TwV_button_c1(props, ref) {
  var _rest = Object.assign({}, props);
  delete _rest.className;
  var _vp = {}; ["size"].forEach(k => { _vp[k] = props[k]; delete _rest[k]; });
  return React.createElement("button", Object.assign({ ref }, _rest, {
    className: ["px-4 py-2", __vt_c1["size"][_vp["size"] ?? "sm"] || "", _rest.className]
      .filter(Boolean).join(" ")
  }));
});
```

---

## Route CSS Architecture

```
Build time:
  Compiler transform file.tsx
    → registers classes via registerFileClasses(filepath, classes)
    → fileToRoute(filepath) maps to /dashboard
    → RouteClassMap: { "/dashboard": Set<class> }

End of build:
  generateAllRouteCss()
    → getRouteClasses("/dashboard") → ["p-4", "bg-zinc-900", ...]
    → generateCssForClasses(classes) → CSS string
    → write .next/static/css/tw/dashboard.css

Runtime (Server Component):
  TwCssInjector
    → reads .next/static/css/tw/dashboard.css
    → injects <style> inline → zero network request, fastest FCP
```

---

## Bundle Composition

| Layer                | In client bundle? | Size    |
|----------------------|-------------------|---------|
| core/createComponent | Yes               | ~600B   |
| core/twProxy         | Yes               | ~800B   |
| core/cv              | Yes               | ~300B   |
| core/cx              | Yes               | ~100B   |
| tailwind-merge       | Yes               | ~6kb    |
| compiler/*           | **No** (build only) | 0     |
| styled-components    | **Removed**        | 0      |
| **Total**            |                   | **~1.5kb** |

---

## Comparison vs Similar Libraries

| Feature                    | styled-components | twin.macro | panda css | tailwind-styled-v4 |
|----------------------------|:-----------------:|:----------:|:---------:|:------------------:|
| Runtime size               | ~16kb             | ~10kb      | ~6kb      | **~1.5kb**        |
| Zero styled-components     | ❌                | ✅          | ✅        | ✅                 |
| RSC-aware                  | ❌                | ❌          | ✅        | **✅**            |
| Auto "use client"          | ❌                | ❌          | ❌        | **✅**            |
| Variant compile            | ❌                | ❌          | ✅        | **✅**            |
| Component hoisting         | ❌                | ❌          | ❌        | **✅**            |
| Route CSS bundling         | ❌                | ❌          | Partial   | **✅**            |
| Zero-config setup          | ❌                | ❌          | ❌        | **✅**            |
| tw.div API                 | ❌                | ✅          | ❌        | **✅**            |
| Tailwind intellisense      | ❌                | ✅          | ✅        | **✅**            |

---

## Native Engine (Rust)

Sejak v5.0, komponen kritis pipeline dijalankan via **Rust engine** di `native/` — dikompilasi sebagai `.node` addon via NAPI-RS.

```
packages/scanner     →  scan_workspace()        (Rayon parallel, ~425× lebih cepat)
packages/compiler    →  compile_css()           (atomic CSS, CSS variable resolution)
packages/analyzer    →  analyze_classes()       (class usage, frequency analysis)
packages/engine      →  compute_incremental_diff() / process_file_change()
packages/animate     →  compile_animation() / compile_keyframes()
packages/theme       →  compile_theme() / extract_css_vars()
```

### Dependency Graph (Native → JS)

```
native/ (Rust binary)
    └── @tailwind-styled/shared (nativeBinding.ts)
            └── consumer packages (scanner, compiler, engine, ...)
```

Semua akses ke native binding melalui satu titik:

```ts
import { loadNativeBinding } from "@tailwind-styled/shared"
const native = await loadNativeBinding()
```

### Fallback Strategy

- Jika binary tidak tersedia: throw `TwError` — tidak ada silent fallback di v5.0
- Environment variable `TWS_NO_NATIVE=1` sedang dalam proses penghapusan (lihat `plans/remove-js-fallback-native-only.md`)
- Pre-built binary Linux x64 disertakan di repo — macOS/Windows harus build dari source

### Build Native dari Source

```bash
cd native
cargo build --release
# Output: native/target/release/tailwind_styled_parser.node
# Copy ke: native/tailwind_styled_parser.node
```

### Schema Auto-Sync (Wave 1/4)

Rust struct dengan `#[derive(JsonSchema)]` otomatis generate JSON schema:

```bash
# Generate schema dari Rust struct
npm run wave1:export-schemas

# Generate TypeScript types dari schema
npm run schemas:generate

# Verifikasi tidak ada drift
npm run wave4:schema-drift
```

Output: `packages/shared/src/generated/rust-schema-types.d.ts`

---

## Package Dependency Map

```
tailwind-styled-v4 (root)
├── core          ← standalone, peer: react
├── shared        ← utility, peer: none
├── native        ← Rust binary
│
├── syntax        → shared, native
├── scanner       → shared, native
├── analyzer      → shared, native, scanner
├── compiler      → shared, native, syntax, plugin-api
├── engine        → shared, native, scanner, compiler, analyzer
│
├── animate       → shared, native
├── theme         → shared, native, runtime-css
├── runtime       → theme
├── runtime-css   ← standalone (client-only)
│
├── plugin-api    → shared
├── plugin        → plugin-api, shared
├── plugin-registry → plugin-api, shared
│
├── preset        ← standalone
├── atomic        ← standalone
├── syntax        → shared, native
│
├── next          → compiler, engine, scanner (bundled inline)
├── vite          → compiler, engine, scanner (bundled inline)
├── rspack        → compiler (bundled inline)
│
├── cli           → engine, scanner, analyzer, compiler, plugin-registry
├── dashboard     ← standalone (HTTP server)
├── devtools      → shared (React component)
│
├── testing       ← standalone (test matchers)
├── storybook-addon ← standalone
│
├── vue           → tailwind-merge (peer)
├── svelte        → tailwind-merge (peer)
│
├── vscode        → shared, scanner (LSP providers)
└── studio-desktop → engine (Electron app)
```

> Catatan: adapter next/vite/rspack mem-bundle compiler/engine/scanner secara inline — user tidak perlu install terpisah.