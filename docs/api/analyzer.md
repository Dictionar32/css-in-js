# Analyzer API

The `@tailwind-styled/analyzer` package provides deep analysis of Tailwind class usage in your codebase — frequency, conflicts, dead code detection, and CSS output.

## `analyzeWorkspace(root, options?)`

Scan and analyze a workspace. Returns a comprehensive report.

```typescript
import { analyzeWorkspace } from "@tailwind-styled/analyzer"

const report = await analyzeWorkspace("./src", {
  classStats: { top: 20 },
})

console.log(report.topClasses)        // top 20 most-used classes
console.log(report.uniqueClassCount)  // total unique classes
console.log(report.totalFiles)        // files scanned
```

**Options (`AnalyzerOptions`):**

| Option | Type | Default | Description |
|---|---|---|---|
| `scanner` | `ScanWorkspaceOptions` | — | Scanner options |
| `classStats.top` | `number` | `20` | Number of top classes to report |
| `classStats.frequentThreshold` | `number` | `5` | Min usage count to be "frequent" |
| `includeClass` | `(cls: string) => boolean` | — | Filter which classes to analyze |
| `semantic.tailwindConfigPath` | `string` | — | Path to tailwind config for semantic analysis |

**Return type (`AnalyzerReport`):**

```typescript
interface AnalyzerReport {
  root: string
  totalFiles: number
  uniqueClassCount: number
  topClasses: Array<{ name: string; count: number }>
  frequentClasses: Array<{ name: string; count: number }>
  unusedClasses: string[]
  conflicts: ClassConflict[]
  durationMs: number
}
```

---

## `classToCss(className, options?)`

Convert a single Tailwind class to its CSS output.

```typescript
import { classToCss } from "@tailwind-styled/analyzer"

const result = await classToCss("flex")
console.log(result.css)         // ".flex { display: flex }"
console.log(result.property)    // "display"
console.log(result.value)       // "flex"
```

**Options (`ClassToCssOptions`):**

| Option | Type | Description |
|---|---|---|
| `tailwindConfigPath` | `string` | Path to tailwind config |
| `unknownClassBehavior` | `"skip" \| "throw"` | What to do with unknown classes |

---

## Internal Utilities

These are available via `@tailwind-styled/analyzer` internal exports for advanced use cases:

```typescript
import { normalizeClassInput, splitVariantAndBase } from "@tailwind-styled/analyzer"

// Normalize class input — handles arrays, space-separated strings, etc.
const classes = normalizeClassInput("flex items-center gap-4")
// → ["flex", "items-center", "gap-4"]

// Split a class into its variant prefix and base class
const { variant, base } = splitVariantAndBase("hover:bg-blue-500")
// → { variant: "hover", base: "bg-blue-500" }
```

---

## Error Handling

```typescript
import { analyzeWorkspace } from "@tailwind-styled/analyzer"

try {
  const report = await analyzeWorkspace("./src")
} catch (err) {
  if (err.code === "NATIVE_BINDING_UNAVAILABLE") {
    console.error("Build native bindings first: npm run build:rust")
  }
}
```

---

## Known Limitations

- Requires native Rust bindings (`npm run build:rust`) for full analysis
- Very large workspaces (100k+ files) may take 5–15 seconds for initial analysis
- `classToCss()` requires Tailwind v4 CSS-first config or a valid `tailwind.config.ts`
