# Monorepo Structure Analysis: tailwind-styled-v4

**Analysis Date**: March 30, 2026 (Updated: April 9, 2026)  
**Workspace**: `packages/` directory with 28 packages  
**Architecture Pattern**: Domain-Driven Design (DDD) v2 restructure  
**Key Focus**: CSS-in-JS integration, framework adapters, and cross-package dependencies

---

## 0. Architecture Overview: DDD 3-Layer Structure

### v2 Restructure (2026-03) — 3 Organizational Layers

The monorepo uses **Domain-Driven Design** to separate concerns:

```
┌─────────────────────────────────────────────────────────────────┐
│ PRESENTATION/ (5 packages)                                      │
│ Framework-specific adapters for React ecosystem                 │
│ Depend on: DOMAIN, INFRASTRUCTURE packages                      │
├─────────────────────────────────────────────────────────────────┤
│  • packages/next/      — Next.js 15+ (RSC aware)                │
│  • packages/vite/      — Vite 5+ plugin                         │
│  • packages/svelte/    — Svelte 4/5 (runes aware)               │
│  • packages/vue/       — Vue 3.3+ Composition API               │
│  • packages/rspack/    — Rspack bundler integration             │
└──────────────────────┬───────────────────────────────────────────┘
                       │ consumes
┌──────────────────────▼───────────────────────────────────────────┐
│ INFRASTRUCTURE/ (6 packages)                                     │
│ CLI tools, dashboards, external integrations, DevTools           │
│ Depend on: DOMAIN packages                                       │
├─────────────────────────────────────────────────────────────────┤
│  • packages/cli/           — tw CLI (parse, lint, sync, etc)     │
│  • packages/dashboard/     — Metrics & build analytics UI        │
│  • packages/devtools/      — Dev utilities & helpers             │
│  • packages/vscode/        — VS Code language extension (LSP)    │
│  • packages/storybook-addon/ — Storybook component integration   │
│  • packages/studio-desktop/ — Desktop Studio (Electron app)      │
└──────────────────────┬───────────────────────────────────────────┘
                       │ uses
┌──────────────────────▼───────────────────────────────────────────┐
│ DOMAIN/ (17 packages)                                            │
│ Pure business logic — Reusable across ALL frameworks             │
│ No dependencies between layers; self-contained logic             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│ Core DSL Engine:                                                 │
│  • packages/compiler/    — CSS compilation pipeline              │
│  • packages/scanner/     — Rust-powered class scanning           │
│  • packages/engine/      — Build orchestration                   │
│  • packages/syntax/      — Parser & AST handling                 │
│  • packages/core/        — Core contracts & types                │
│                                                                   │
│ Feature Domains:                                                 │
│  • packages/plugin/      — Plugin system                         │
│  • packages/plugin-api/  — Plugin contracts                      │
│  • packages/plugin-registry/ — Plugin discovery                  │
│  • packages/theme/       — Live token engine                     │
│  • packages/preset/      — Configuration presets                 │
│  • packages/animate/     — Animation utilities                   │
│  • packages/atomic/      — Atomic CSS generation                 │
│  • packages/runtime/     — React runtime helpers                 │
│  • packages/runtime-css/ — CSS runtime generation                │
│                                                                   │
│ Cross-Cutting Concerns:                                          │
│  • packages/shared/      — Utilities, errors, logging            │
│  • packages/analyzer/    — Static analysis                       │
│  • packages/testing/     — Testing utilities                     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**Benefits of DDD Structure:**
- **Clear separation of concerns** — Each layer has distinct responsibility
- **Framework agnostic core** — DOMAIN packages work with any framework
- **Testability** — DOMAIN packages testable without framework dependencies
- **Scalability** — Easy to add new PRESENTATION adapters without touching core logic
- **Maintainability** — Clear dependency flow prevents circular imports

---

## 1. Package Inventory & Dependencies (Reorganized by DDD Layers)

### DOMAIN Layer — Core Business Logic (17 packages)

#### DSL & Compilation Engine (5 packages)
| Package | Path | Purpose | Key Dependencies |
|---------|------|---------|------------------|
| `@tailwind-styled/compiler` | [packages/compiler/package.json](packages/compiler/package.json) | CSS compilation pipeline & transform logic | `@tailwind-styled/plugin-api`, `@tailwind-styled/syntax`, `postcss`, `tailwind-merge`, `inversify` |
| `@tailwind-styled/engine` | [packages/engine/package.json](packages/engine/package.json) | Build orchestration & coordination | `@tailwind-styled/compiler`, `@tailwind-styled/scanner`, `@tailwind-styled/analyzer`, `inversify` |
| `@tailwind-styled/scanner` | [packages/scanner/src/index.ts](packages/scanner/src/index.ts) | CSS class scanner (Rust native) | `@tailwind-styled/shared`, uses native `tailwind_styled_parser.node` |
| `@tailwind-styled/syntax` | [packages/syntax/package.json](packages/syntax/package.json) | Parser & AST handling | `@tailwind-styled/shared` |
| `@tailwind-styled/core` | [packages/core/package.json](packages/core/package.json) | Core contracts & utility types | (foundation, no internal deps) |

#### Feature & Capability Domains (9 packages)
| Package | Path | Purpose | Key Dependencies |
|---------|------|---------|------------------|
| `@tailwind-styled/plugin` | [packages/plugin/package.json](packages/plugin/package.json) | Plugin system implementation | `@tailwind-styled/compiler`, `@tailwind-styled/plugin-api` |
| `@tailwind-styled/plugin-api` | [packages/plugin-api/package.json](packages/plugin-api/package.json) | Plugin contracts & registry | `zod`, (foundation) |
| `@tailwind-styled/plugin-registry` | [packages/plugin-registry/package.json](packages/plugin-registry/package.json) | Plugin discovery & install | `@tailwind-styled/plugin-api` |
| `@tailwind-styled/theme` | [packages/theme/package.json](packages/theme/package.json) | Live token engine + theme reader | (foundation, no internal deps) |
| `@tailwind-styled/preset` | [packages/preset/package.json](packages/preset/package.json) | Tailwind preset configuration | (foundation) |
| `@tailwind-styled/animate` | [packages/animate/package.json](packages/animate/package.json) | Animation utilities domain | (foundation) |
| `@tailwind-styled/atomic` | [packages/atomic/package.json](packages/atomic/package.json) | Atomic CSS generation | `@tailwind-styled/compiler` |
| `@tailwind-styled/runtime` | [packages/runtime/package.json](packages/runtime/package.json) | React runtime helpers | `@tailwind-styled/theme` |
| `@tailwind-styled/runtime-css` | [packages/runtime-css/package.json](packages/runtime-css/package.json) | CSS runtime generation | (foundation) |

#### Cross-Cutting Infrastructure (3 packages)
| Package | Path | Purpose |
|---------|------|---------|
| `@tailwind-styled/shared` | [packages/shared/package.json](packages/shared/package.json) | Cross-package utilities, errors, logging |
| `@tailwind-styled/analyzer` | [packages/analyzer/package.json](packages/analyzer/package.json) | Static analysis & optimization |
| `@tailwind-styled/testing` | [packages/testing/package.json](packages/testing/package.json) | Jest/Vitest matchers & testing utilities |

### INFRASTRUCTURE Layer — Tools & External Services (6 packages)
| Package | Path | Purpose | Consumers |
|---------|------|---------|-----------|
| `@tailwind-styled/cli` | [packages/cli/package.json](packages/cli/package.json) | Project generator & CLI commands (tw parse, lint, sync, optimize, etc) | External users, CI/CD |
| `@tailwind-styled/dashboard` | [packages/dashboard/package.json](packages/dashboard/package.json) | Metrics & build analytics UI (Express server) | Web browsers, PRESENTATION adapters |
| `@tailwind-styled/devtools` | [packages/devtools/package.json](packages/devtools/package.json) | Development utilities & helpers | PRESENTATION adapters |
| `@tailwind-styled/vscode` | [packages/vscode/package.json](packages/vscode/package.json) | VS Code language extension (LSP protocol) | VS Code IDE |
| `@tailwind-styled/storybook-addon` | [packages/storybook-addon/package.json](packages/storybook-addon/package.json) | Storybook component integration | Storybook UI |
| `@tailwind-styled/studio-desktop` | [packages/studio-desktop/package.json](packages/studio-desktop/package.json) | Component studio desktop app (Electron) | Desktop users |

### PRESENTATION Layer — Framework Adapters (5 packages)
| Package | Path | Framework | Integration Method | Depends On |
|---------|------|---------|---|---|
| `@tailwind-styled/next` | [packages/next/package.json](packages/next/package.json) | Next.js 15+ (RSC compatible) | `withTailwindStyled()` in `next.config.ts` (webpack+turbopack) | DOMAIN (compiler, engine) |
| `@tailwind-styled/vite` | [packages/vite/package.json](packages/vite/package.json) | Vite 5+ | `tailwindStyledPlugin()` in `vite.config.ts` | DOMAIN (compiler, engine) |
| `@tailwind-styled/vue` | [packages/vue/package.json](packages/vue/package.json) | Vue 3.3+ Composition API | `TailwindStyledPlugin` Vue plugin + `tw()`, `cv()`, `extend()` | DOMAIN (runtime, theme) |
| `@tailwind-styled/svelte` | [packages/svelte/package.json](packages/svelte/package.json) | Svelte 4/5 (runes compatible) | Direct usage: `cv()`, `tw()`, `use:styled` action | DOMAIN (runtime, theme) |
| `@tailwind-styled/rspack` | [packages/rspack/package.json](packages/rspack/package.json) | Rspack bundler | Rspack plugin integration (similar to Vite) | DOMAIN (compiler, engine) |

---

### Core Infrastructure (5 packages)

---

## 2. Cross-Package Dependency Map (DDD Layered Architecture)

### Dependency Flow (Top-to-Bottom)

```
PRESENTATION LAYER (Framework Adapters)
├─ next/    ──────┐
├─ vite/    ──────┤
├─ svelte/  ──────┼─── Consume ──→  INFRASTRUCTURE + DOMAIN
├─ vue/     ──────┤
└─ rspack/  ──────┘

INFRASTRUCTURE LAYER (Tools & Services)
├─ cli/
├─ dashboard/
├─ devtools/
├─ vscode/
├─ storybook-addon/
└─ studio-desktop/ ──────┐
                         ├─── Consume ──→  DOMAIN LAYER
DOMAIN LAYER (Business Logic)
├─ compiler ──────────┬──┐
├─ engine ────────────┤  ├─── Foundation ──→  shared, core
├─ scanner ──────────┬┘  │
├─ plugin/api ────────┤  │
├─ theme ──────────────┤  │
├─ atomic ─────────────┤  │
├─ runtime ────────────┤  │
└─ [13 more packages] ─┴──┘
```

### Detailed Dependency Hierarchy (Bottom-up from DOMAIN)

**Level 0 — Foundation (No internal dependencies):**
```
DOMAIN Layer:
  ├─ shared        (utilities, errors, logging foundation)
  ├─ core          (core types & contracts)
  ├─ plugin-api    (contracts only, uses zod)
  ├─ theme         (token engine, standalone)
  ├─ preset        (config presets, standalone)
  ├─ animate       (animations, standalone)
  └─ runtime-css   (runtime utilities, standalone)
```

**Level 1 — Core DSL (Depend on Level 0):**
```
DOMAIN Layer:
  ├─ syntax        (uses: shared)
  ├─ compiler      (uses: shared, plugin-api)
  ├─ scanner       (uses: shared, native parser)
  └─ analyzer      (uses: compiler)
```

**Level 2 — Orchestration & Features (Depend on Level 0-1):**
```
DOMAIN Layer:
  ├─ engine        (uses: compiler, scanner, analyzer)
  ├─ plugin        (uses: compiler, plugin-api)
  ├─ atomic        (uses: compiler)
  ├─ runtime       (uses: theme)
  └─ plugin-registry (uses: plugin-api)
```

**Level 3 — INFRASTRUCTURE Tools (Depend on DOMAIN):**
```
INFRASTRUCTURE Layer:
  ├─ cli           (uses: engine, compiler, scanner + all DOMAIN)
  ├─ dashboard     (uses: engine, metrics from builds)
  ├─ devtools      (uses: DOMAIN packages)
  ├─ vscode        (uses: scanner, syntax for LSP)
  ├─ storybook-addon (uses: DOMAIN for integration)
  └─ studio-desktop (uses: DOMAIN + engine for orchestration)
```

**Level 4 — PRESENTATION Adapters (Depend on DOMAIN + INFRASTRUCTURE):**
```
PRESENTATION Layer:
  ├─ next          (uses: compiler, engine, plugin)
  ├─ vite          (uses: compiler, engine, plugin)
  ├─ rspack        (uses: compiler, engine, plugin)
  ├─ vue           (uses: runtime, theme)
  └─ svelte        (uses: runtime, theme)
```

---

### Dependency Hierarchy (Bottom-up)

```
Level 1 (No internal deps):
  ├─ @tailwind-styled/shared (utility foundation)
  ├─ @tailwind-styled/plugin-api (contracts)
  └─ @tailwind-styled/theme (token engine)

Level 2 (Depend on Level 1):
  ├─ @tailwind-styled/compiler (uses: shared, plugin-api)
  ├─ @tailwind-styled/syntax (uses: shared)
  ├─ @tailwind-styled/atomic (uses: compiler)
  ├─ @tailwind-styled/runtime (uses: theme)
  └─ @tailwind-styled/scanner (uses: shared)

Level 3 (Depend on Level 2):
  ├─ @tailwind-styled/engine (uses: compiler, scanner, analyzer)
  ├─ @tailwind-styled/plugin (uses: compiler, plugin-api)
  └─ @tailwind-styled/analyzer (uses: compiler)

Level 4 (Framework Adapters - Depend on Level 3):
  ├─ @tailwind-styled/next (uses: compiler, engine, plugin)
```

### Critical Cross-Package Dependencies (Bundlers)

**Next.js Integration** ([packages/next/src/withTailwindStyled.ts](packages/next/src/withTailwindStyled.ts)):
- Depends on: `@tailwind-styled/compiler`, `@tailwind-styled/engine`, `@tailwind-styled/plugin`
- Exports loader options: `TailwindStyledLoaderOptions`, `TailwindStyledNextOptions`
- Pattern: Webpack/Turbopack rule injection with compiler options

**Vite Integration** ([packages/vite/package.json](packages/vite/package.json)):
- Depends on: `@tailwind-styled/compiler`, `@tailwind-styled/engine`, `@tailwind-styled/plugin`
- Exports: `tailwindStyledPlugin()` for plugin array

---

## 📝 Historical Note: v1 vs v2 Restructure

**Before v2 (Early 2026)**: Packages were organized by functional concern:
- Core Infrastructure (compiler, engine, scanner, shared, plugin-api)
- Framework Adapters (next, vite, vue, svelte, rspack)
- Runtime & Component Libraries (runtime, runtime-css, theme, preset)
- Development & Tooling (cli, testing, storybook-addon, dashboard, devtools, analyzer)
- Language Bindings & Extensions (syntax, atomic, animate, plugin, plugin-registry, studio-desktop, vscode)

**After v2 (2026-03 Restructure)**: Adopted Domain-Driven Design (DDD) with 3 organizational layers:
- **DOMAIN/** — Business logic, reusable across frameworks (17 packages)
- **INFRASTRUCTURE/** — Tools, CLI, external integrations (6 packages)
- **PRESENTATION/** — Framework-specific adapters (5 packages)

This restructuring improves:
- Clear separation of concerns
- Reduced circular dependencies
- Better testability of domain logic
- Easier to add new framework adapters without modifying core

---

## 3. CSS-in-JS Integration Patterns

### Pattern Overview by Framework

#### **A. Next.js/React (Server-Side Compiler)**
**Files**: [packages/next/src/withTailwindStyled.ts](packages/next/src/withTailwindStyled.ts), [examples/next-js-app/next.config.ts](examples/next-js-app/next.config.ts)

```typescript
// Configuration (next.config.ts)
import { withTailwindStyled } from "@tailwind-styled/next"
export default withTailwindStyled()(nextConfig)

// Usage Pattern: Template literal + Object config hybrid
import { tw, cv } from "tailwind-styled-v4"

// Template literal (compiled away at build time)
const Heading = tw.h1`text-3xl font-extrabold text-gray-900`

// Object config with variants (runtime resolution)
const Button = tw.button({
  base: "px-4 py-2 rounded-lg font-medium transition",
  variants: {
    variant: {
      primary: "bg-blue-500 text-white hover:bg-blue-600",
      ghost: "border border-zinc-700 hover:bg-zinc-800",
    },
    size: { sm: "h-8 text-sm", lg: "h-12 text-base" },
  },
  defaultVariants: { variant: "primary", size: "sm" },
})

// Extension pattern (twMerge conflict resolution)
const HoverableCard = CardBase.extend`transition-all hover:-translate-y-1 hover:shadow-md`
```

**Key Characteristics**:
- ✅ Zero-runtime (template literals compiled away)
- ✅ Server-Component compatible (RSC aware)
- ✅ Variants with `twMerge` conflict handling
- ✅ `.extend()` inheritance API
- ✅ `cx()` utility for conditional merge

---

#### **B. Vite/React (Browser-Based)**
**Files**: [examples/vite/src/App.tsx](examples/vite/src/App.tsx), [packages/vite/](packages/vite/)

```typescript
// Configuration (vite.config.ts)
import { tailwindStyledPlugin } from "@tailwind-styled/vite"
export default defineConfig({ plugins: [react(), tailwindStyledPlugin()] })

// Usage: Same as Next.js
const Button = tw.button({
  base: "inline-flex items-center gap-2 rounded-lg px-4 py-2 font-medium",
  variants: {
    intent: {
      primary: "bg-blue-600 text-white hover:bg-blue-700",
      secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
      danger: "bg-red-600 text-white hover:bg-red-700",
    },
    size: {
      sm: "text-sm px-3 py-1.5",
      md: "text-base px-4 py-2",
      lg: "text-lg px-6 py-3",
    },
  },
  defaultVariants: { intent: "primary", size: "md" },
})

// Compound components pattern
const Card = tw.div`rounded-xl border border-gray-200 bg-white shadow-sm`
const CardHeader = tw.div`px-6 py-4 border-b border-gray-100`
const CardBody = tw.div`px-6 py-4`
const CardFooter = tw.div`px-6 py-4 border-t border-gray-100 bg-gray-50`
```

**Key Characteristics**:
- ✅ Template literal + object config hybrid (same as Next.js)
- ✅ `.extend()` for composed variants
- ✅ `cx()` for conditional class merge
- ✅ Compound component pattern
- ✅ Live reload via HMR

---

#### **C. Vue 3 (Composition API)**
**Files**: [packages/vue/src/index.ts](packages/vue/src/index.ts), [packages/cli/src/createApp.ts](packages/cli/src/createApp.ts#L268-L283)

```typescript
// Configuration (main.ts)
import { TailwindStyledPlugin } from "@tailwind-styled/vue"
createApp(App).use(TailwindStyledPlugin).mount("#app")

// Usage: tw() component factory pattern
import { tw } from "@tailwind-styled/vue"

const Button = tw("button", {
  base: "px-4 py-2 rounded font-medium",
  variants: {
    intent: {
      primary: "bg-blue-500 text-white hover:bg-blue-600",
      danger: "bg-red-500 text-white hover:bg-red-600",
    },
    size: {
      sm: "h-8 text-sm",
      md: "h-10 text-base",
      lg: "h-12 text-lg",
    },
  },
  defaultVariants: { intent: "primary", size: "md" },
})

// Template usage with reactive variants
<Button intent="danger" size="lg">Delete</Button>
```

**Key Characteristics**:
- ✅ Function-based component factory (`tw()`)
- ✅ Composition API compatible
- ✅ Full variant/compound variant support
- ✅ `twMerge` conflict resolution
- ✅ No template string needed (Vue 3 prop binding)

---

#### **D. Svelte 4/5 (Runes Mode)**
**Files**: [packages/svelte/src/index.ts](packages/svelte/src/index.ts), [packages/cli/src/createApp.ts](packages/cli/src/createApp.ts#L380-L397)

```typescript
// Pattern 1: cv() — Class resolver (most common)
import { cv } from "@tailwind-styled/svelte"

const button = cv({
  base: "px-4 py-2 rounded font-medium",
  variants: {
    intent: {
      primary: "bg-blue-500 text-white",
      danger: "bg-red-500 text-white",
    },
    size: { sm: "h-8 text-sm", lg: "h-12 text-lg" },
  },
  defaultVariants: { intent: "primary", size: "sm" },
})

export let intent = "primary"
export let size = "sm"

// Template usage
<button class={button({ intent, size })}>
  <slot />
</button>

// Pattern 2: tw() — Class string merger
import { tw } from "@tailwind-styled/svelte"
const classes = tw("px-4 py-2", "rounded-lg", conditional && "bg-blue-500")

// Pattern 3: use:styled action (Svelte 5)
<div use:styled={{ base: "px-4", variant: intent }}>Content</div>

// Pattern 4: createVariants() — Svelte 5 runes compatible
function createVariants(config, getProps) { ... }
```

**Key Characteristics**:
- ✅ `cv()` — returns function to resolve classes
- ✅ `tw()` — class string utility (like `clsx`)
- ✅ `use:styled` action for Svelte 5
- ✅ Runes mode compatible
- ✅ `createVariants()` for advanced patterns

---

### Common Pattern Across All Frameworks

**Variant Config Structure** (consistent across all adapters):
```typescript
interface ComponentConfig {
  base?: string                           // Base classes
  variants?: Record<string, Record<string, string>>  // Variant definitions
  defaultVariants?: Record<string, string | number | boolean>  // Defaults
  compoundVariants?: Array<{
    when: Record<string, string | boolean>
    class: string
  }>                                      // Compound variant logic
}
```

**Class Resolution Pipeline**:
1. Apply `base` classes
2. Search variant groups for matching props
3. Apply compound variants if conditions match
4. Run `twMerge()` to resolve class conflicts (Tailwind v4 format)
5. Return merged class string

---

## 4. Current Examples & Documentation

### Live Examples Location

#### Next.js Example
**Path**: [examples/next-js-app/](examples/next-js-app/)
- ✅ Shows: Template literal + object config hybrid
- ✅ Shows: `.extend()` inheritance
- ✅ Shows: Compound components (Card, Alert)
- ✅ Uses: `@tailwind-styled/next` plugin
- Files: [next.config.ts](examples/next-js-app/next.config.ts), [src/app/page.tsx](examples/next-js-app/src/app/page.tsx)

#### Vite Example
**Path**: [examples/vite/](examples/vite/)
- ✅ Shows: Button variants with multiple options
- ✅ Shows: Card compound layout
- ✅ Shows: `cx()` conditional merge
- ✅ Shows: Template literal usage
- ✅ Uses: `@tailwind-styled/vite` plugin
- Files: [vite.config.ts](examples/vite/vite.config.ts), [src/App.tsx](examples/vite/src/App.tsx)

#### Demo Subcomponents
**Path**: [examples/demo-subcomponents/](examples/demo-subcomponents/)
- ✅ Shows: Reusable component patterns
- ✅ Shows: Component composition
- Files: [src/components/Button.tsx](examples/demo-subcomponents/src/components/Button.tsx), [src/components/Card.tsx](examples/demo-subcomponents/src/components/Card.tsx)

#### Simple HTML Example
**Path**: [examples/simple-app-html/](examples/simple-app-html/)
- ✅ Shows: Zero-build setup
- ✅ Shows: CDN/UMD usage

#### Integration Test Project
**Path**: [examples/integration-test/](examples/integration-test/)
- ✅ Multi-framework integration tests
- ✅ Cross-package compatibility tests

### Documentation Files

| Doc File | Coverage |
|----------|----------|
| [docs/getting-started.md](docs/getting-started.md) | Project setup, basic patterns, Next.js + Vite quick start |
| [docs/examples.md](docs/examples.md) | 8 runnable code examples showing all APIs: `tw()`, `cv()`, `styled()`, Vue, Svelte, CLI, testing |
| [docs/api-reference.md](docs/api-reference.md) | Full API documentation |
| [docs/cli.md](docs/cli.md) | CLI command reference (`tw parse`, `tw shake`, `tw ai`, `tw sync`) |
| [docs/plugins.md](docs/plugins.md) | Plugin system & registry |
| [docs/architecture.md](docs/architecture.md) | System design & compiler pipeline |
| [README.md](README.md) | Project overview, feature list, quick links |

---

## 5. Shared Utilities & Factory Functions

### Core Factory Functions (Across Adapters)

#### **tw() — Tagged Template + Object Config**
**Location**: Exported from each adapter package
- Next.js: `tailwind-styled-v4` → core export
- Vite: `tailwind-styled-v4` → core export
- Vue: `@tailwind-styled/vue` → function factory
- Svelte: `@tailwind-styled/svelte` → implicit via `cv()`

**Signatures**:
```typescript
// React/Next/Vite: Both patterns work
tw.div`px-4 py-2 rounded` // Template literal
tw.button({ base: "...", variants: {...} }) // Object config

// Vue: Function factory only
tw("button", { base: "...", variants: {...} })

// Svelte: No tw() for components, use cv() instead
```

---

#### **cv() — Class Value Resolver**
**Location**: `@tailwind-styled/vue`, `@tailwind-styled/svelte`

```typescript
// Vue/Svelte shared signature
function cv(config: ComponentConfig): (props: Props) => string

// Usage
const button = cv({...})
button({ intent: "primary", size: "lg" }) // Returns: "px-4 py-2 bg-blue-500..."
```

---

#### **styled() — Core Resolver (Compiler-Generated)**
**Location**: [packages/plugin-api/src/index.ts](packages/plugin-api/src/index.ts#L208-211)

```typescript
export function createTw(config: Record<string, unknown> = {}): TwContext & {
  // Returns resolver with variant handling
}
```

---

### Shared Class Merge Utilities

#### **twMerge** (External, Required Peer Dependency)
- **Package**: `tailwind-merge` v3.5.0+
- **Used in**: All adapters for conflict resolution
- **Why**: Handles Tailwind v4 CSS custom property layers
- **Peak Usage**: Vue, Svelte adapters (explicit in code), React adapters (implicit)

```typescript
// Conflict resolution example
twMerge("px-2", "px-4") // Returns: "px-4" (v4 format)
twMerge("dark:bg-blue-500", "dark:bg-red-500") // Returns: "dark:bg-red-500"
```

---

#### **cx()** — Conditional Class Merger
**Location**: React adapter (exported from `tailwind-styled-v4`)

```typescript
// Like clsx but optimized for Tailwind
cx(
  "base-class",
  isError && "text-red-500",
  isLarge && "text-lg",
  conditional ? "accept-variant" : "reject-variant"
)
```

---

### Live Token Engine (Dynamic Theming)
**Package**: `@tailwind-styled/theme` ([packages/theme/package.json](packages/theme/package.json))

**Exports**:
- `liveToken` — Token reference system
- `liveTokenEngine` — Runtime engine
- `setToken(name, value)` — Update token
- `getToken(name)` — Fetch token
- `subscribeTokens(callback)` — Watch changes
- `createUseTokens()` — React hook factory

**Usage Pattern**:
```typescript
// In component
const useTokens = createUseTokens()
const { primary, secondary } = useTokens()

// Update at runtime
setToken("--color-primary", "#ff0000")
// All subscribed components re-render with new value
```

---

## 6. Architecture Insights: CSS-in-JS Pattern

### Compilation Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. SOURCE CODE (String/Config)                                  │
│    ├─ tw.button`px-4 py-2` (template literal)                   │
│    └─ tw.button({ base: "...", variants: {...} }) (object)      │
└────────────────────┬────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────────┐
│ 2. SCANNER (@tailwind-styled/scanner)                           │
│    ├─ Rust native parser (tailwind_styled_parser.node)          │
│    └─ Extracts: class names, variant groups, compound patterns  │
└────────────────────┬────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────────┐
│ 3. COMPILER (@tailwind-styled/compiler)                         │
│    ├─ Transform tw() calls → compiled resolvers                 │
│    ├─ Apply PostCSS plugins via plugin system                   │
│    └─ Generate scoped class names (Rust-generated)              │
└────────────────────┬────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────────┐
│ 4. ENGINE (@tailwind-styled/engine)                             │
│    ├─ Orchestrate scanner + compiler                            │
│    ├─ Cache management via @tailwind-styled/shared (LRUCache)   │
│    └─ File watching & incremental build                         │
└────────────────────┬────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────────┐
│ 5. RUNTIME (@tailwind-styled/runtime + adapters)                │
│    ├─ Vue: Vue 3 plugin injection                               │
│    ├─ Svelte: Direct component usage                            │
│    ├─ React: Zero-runtime (template compiled away)              │
│    └─ Live token subscriptions (if using themes)                │
└────────────────────┬────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────────┐
│ 6. OUTPUT (CSS Class String)                                    │
│    └─ "px-4 py-2 rounded font-medium..." (with twMerge)         │
└─────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **Zero-Runtime for Template Literals** (React/Next/Vite)
   - Template literals compiled away at build time
   - Only object config remains runtime

2. **Rust-Native Parser** (Performance)
   - `tailwind_styled_parser.node` for fast class extraction
   - Shared across all adapters via `@tailwind-styled/scanner`

3. **twMerge Dependency** (Conflict Resolution)
   - Handles Tailwind v4 CSS custom property layers
   - Peer dependency (not bundled)
   - Explicit in Vue/Svelte, implicit in React

4. **Plugin System** (Extensibility)
   - `@tailwind-styled/plugin-api` contracts
   - Plugin registry for discovery & install
   - PostCSS integration point

5. **Live Token Engine** (Theming)
   - Separate from styling resolution
   - Optional, on-demand subscription
   - Runtime-only (no compile time required)

---

## 7. Cross-Package Integration Matrix

### Dependency Relationships

| Package | Produces | Consumes | Used By |
|---------|----------|----------|---------|
| **compiler** | Compiled resolvers, PostCSS transformed CSS | plugin-api, syntax, shared | engine, adapters, cli |
| **engine** | Build artifacts, cache, metrics | compiler, scanner, analyzer, shared | adapters, dashboard |
| **scanner** | Class extraction results | shared, native.node | engine, compiler |
| **shared** | Utilities (logger, cache, hash) | — | All packages |
| **runtime** | React component helpers | theme | React components |
| **theme** | Live token engine | — | runtime, examples |
| **next** | Next.js webpack/turbopack config | compiler, engine, plugin | User projects |
| **vite** | Vite plugin | compiler, engine, plugin | User projects |
| **vue** | Vue component factory (tw) | tailwind-merge (peer) | Vue projects |
| **svelte** | Svelte adapters (cv, tw) | tailwind-merge (peer) | Svelte projects |

### Bundle Analysis

**Bundled Together** (monolithic):
- `@tailwind-styled/compiler`
- `@tailwind-styled/engine`
- `@tailwind-styled/analyzer`
- `@tailwind-styled/scanner`
- Build tooling

**Published Separately** (peer deps):
- Vue adapter (peer: vue, tailwind-merge)
- Svelte adapter (peer: svelte, tailwind-merge)
- React/Next (peer: react, tailwind-merge)

---

## 8. Key Findings Summary

### Strengths
✅ **Unified Variant System** across 5+ frameworks  
✅ **Zero-Runtime for Templates** (React/Next/Vite)  
✅ **Rust-Native Parser** for performance  
✅ **Live Token Engine** for dynamic theming  
✅ **Plugin Ecosystem** for extensibility  
✅ **Cross-Framework Consistency** (same config structure)  
✅ **Testing Utilities** (@tailwind-styled/testing)  
✅ **Developer Tools** (Dashboard, DevTools, VS Code)  

### Entry Points by Framework
- **Next.js**: Import `tw` + add plugin to `next.config.ts`
- **Vite**: Import `tw` + add plugin to `vite.config.ts`
- **Vue**: Import `tw` + use `TailwindStyledPlugin`
- **Svelte**: Import `cv()` or `tw()` directly in components
- **React**: Import `tw` (same as Vite)

### CSS-in-JS Pattern Classification
- **React/Next/Vite**: Hybrid (template literal + object config) with compile-time removal
- **Vue**: Factory pattern (tw function) with Vue 3 plugin integration
- **Svelte**: Direct export pattern (cv, tw functions) with runes support

---

## 9. Documentation & Reference Files

| Resource | Location | Type |
|----------|----------|------|
| Getting Started | [docs/getting-started.md](docs/getting-started.md) | Setup guide |
| Examples with Code | [docs/examples.md](docs/examples.md) | 8 runnable examples |
| API Reference | [docs/api-reference.md](docs/api-reference.md) | Complete API |
| CLI Commands | [docs/cli.md](docs/cli.md) | Command reference |
| CLI Generator | [packages/cli/src/createApp.ts](packages/cli/src/createApp.ts) | Template generator (shows all framework setups) |
| Example: Next.js | [examples/next-js-app/](examples/next-js-app/) | Working project |
| Example: Vite | [examples/vite/](examples/vite/) | Working project |
| Example: Components | [examples/demo-subcomponents/](examples/demo-subcomponents/) | Component library patterns |
| Vue Adapter Source | [packages/vue/src/index.ts](packages/vue/src/index.ts) | 250 lines of adapter code |
| Svelte Adapter Source | [packages/svelte/src/index.ts](packages/svelte/src/index.ts) | 200 lines of adapter code |
| Dependency Cruiser Config | [dependency-cruiser.cjs](dependency-cruiser.cjs) | Cross-package rules |

---

## Appendix: Package Exports Reference

### Core Exports (tailwind-styled-v4)

```typescript
// From root package
export { tw, cv, styled, extend, cx } from "tailwind-styled-v4"
export { parseTailwindClasses } from "tailwind-styled-v4"
export { extractThemeFromCSS } from "tailwind-styled-v4"
export { withTailwindStyled } from "tailwind-styled-v4/next"
export { tailwindStyledPlugin } from "tailwind-styled-v4/vite"
```

### Adapter-Specific Exports

```typescript
// @tailwind-styled/vue
export { tw, cv, extend, TailwindStyledPlugin }

// @tailwind-styled/svelte
export { cv, tw, styled, createVariants, use:styled }

// @tailwind-styled/next
export { withTailwindStyled, TailwindStyledNextOptions }

// @tailwind-styled/vite
export { tailwindStyledPlugin }

// @tailwind-styled/runtime (React)
export { SubComponentDef, ConditionalProps, liveToken, ... }

// @tailwind-styled/testing
export { expectClasses, expectNoClasses, testAllVariants, expandVariantMatrix, tailwindMatchers }

// @tailwind-styled/storybook-addon
export { generateArgTypes, withTailwindStyled, getVariantClass, createVariantStoryArgs }
```

---

**End of Analysis**  
Generated: March 30, 2026
