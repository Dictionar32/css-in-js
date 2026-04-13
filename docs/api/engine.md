# Engine API

The `@tailwind-styled/engine` package orchestrates scanner + compiler into a unified build pipeline.

## Standalone Facade Functions

These functions work without instantiating a full engine — ideal for CLI tools and one-shot builds.

### `scanWorkspace(opts?)`

Scan all source files and return discovered Tailwind classes.

```typescript
import { scanWorkspace } from "@tailwind-styled/engine"

const result = await scanWorkspace({ root: "./src" })
console.log(result.uniqueClasses) // string[]
console.log(result.totalFiles)    // number
```

**Options:**
| Option | Type | Description |
|---|---|---|
| `root` | `string` | Root directory to scan (default: `process.cwd()`) |
| `extensions` | `string[]` | File extensions to include |
| `ignoreDirectories` | `string[]` | Directories to skip |

---

### `analyzeWorkspace(opts?)`

Scan and analyze classes — includes frequency counts, conflict detection.

```typescript
const report = await analyzeWorkspace({ root: "./src", top: 20 })
console.log(report.topClasses)
```

---

### `generateSafelist(opts?)`

Generate a Tailwind safelist from workspace scan. Useful for `tailwind.config.ts`.

```typescript
const safelist = await generateSafelist({ root: "./src" })
// tailwind.config.ts: { safelist }
```

---

### `build(opts?)`

One-shot build without watch mode.

```typescript
import { build } from "@tailwind-styled/engine"
import fs from "node:fs"

const result = await build({ root: "./src" })
fs.writeFileSync("dist/tailwind.css", result.css)
console.log(`${result.classes.length} classes, ${result.totalFiles} files`)
```

---

## `createEngine(config)`

Full engine with watch mode and lifecycle hooks.

```typescript
import { createEngine } from "@tailwind-styled/engine"

const engine = await createEngine({
  root: "./src",
  compileCss: true,
  plugins: [],
})
```

**Options (`EngineOptions`):**

| Option | Type | Default | Description |
|---|---|---|---|
| `root` | `string` | `process.cwd()` | Workspace root directory |
| `scanner` | `ScanWorkspaceOptions` | — | Scanner options passed through |
| `compileCss` | `boolean` | `true` | Whether to generate CSS output |
| `tailwindConfigPath` | `string` | — | Explicit path to tailwind config |
| `plugins` | `EnginePlugin[]` | `[]` | Engine lifecycle plugins |

---

## Engine Methods

### `engine.scan()`

Run workspace scan. Returns `Promise<ScanWorkspaceResult>`.

```typescript
const scan = await engine.scan()
console.log(scan.uniqueClasses)
```

---

### `engine.build()`

Run a full build. Returns compiled CSS and class metadata.

```typescript
const result = await engine.build()
// result.css        — compiled CSS string
// result.classes    — all discovered classes
// result.metadata   — build metadata (totalFiles, duration, etc.)
```

---

### `engine.watch(onEvent, options?)`

Start watch mode with incremental rebuilds.

```typescript
const handle = await engine.watch((event) => {
  console.log(event.type, event.css)
}, {
  debounceMs: 100,
})

// Later:
await handle.close()
```

**Event types:**
| Type | Description |
|---|---|
| `initial` | First build on watch start |
| `change` | File changed — incremental rebuild |
| `unlink` | File removed — incremental rebuild |
| `full-rescan` | Fallback when incremental fails |
| `error` | Watch error (engine auto-recovers) |

**Watch Options:**
| Option | Default | Description |
|---|---|---|
| `debounceMs` | `100` | Debounce interval for event batching |
| `maxEventsPerFlush` | `100` | Max events per batch |
| `largeFileThreshold` | `10485760` (10MB) | Files above this force full-rescan |

---

## Plugin API

Engine plugins let you hook into the build lifecycle.

```typescript
const myPlugin = {
  name: "my-plugin",
  setup(ctx) {
    ctx.onBeforeScan(async (context) => {
      console.log("About to scan:", context.root)
    })

    ctx.onAfterBuild(async (result, context) => {
      console.log("Build done:", result.classes.length, "classes")
    })
  },
}

const engine = await createEngine({ plugins: [myPlugin] })
```

**Available hooks:**
| Hook | When |
|---|---|
| `beforeScan(context)` | Before workspace scan |
| `afterScan(scan, context)` | After scan, before compile |
| `transformClasses(classes, context)` | Modify class list before compile |
| `beforeBuild(scan, context)` | Before CSS generation |
| `afterBuild(result, context)` | After CSS generation |
| `onError(error, context)` | On any build error |

---

## ImpactTracker

Analyze the impact of removing a class.

```typescript
import { ImpactTracker } from "@tailwind-styled/engine"

const tracker = new ImpactTracker()
const report = tracker.analyzeWithBundle("flex", scanResult, cssString)

console.log(report.riskLevel)        // "low" | "medium" | "high"
console.log(report.totalComponents)  // number of affected components
console.log(report.suggestions)      // string[] of actionable suggestions
```

---

## BundleAnalyzer

Analyze CSS bundle contribution per class.

```typescript
import { BundleAnalyzer } from "@tailwind-styled/engine"

const analyzer = new BundleAnalyzer()
const info = analyzer.analyzeClass("flex", scanResult, cssString)

console.log(info.bundleSizeBytes) // estimated CSS bytes for this class
console.log(info.isDeadCode)      // true if class not found in scan
console.log(info.files)           // files that use this class
```
