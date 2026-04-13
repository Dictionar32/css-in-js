# @tailwind-styled/shared API

Shared utilities used by all packages in the monorepo. Zero external dependencies (except Zod for schema validation).

## `LRUCache<K, V>`

Fixed-size LRU cache with optional TTL.

```typescript
import { LRUCache } from "@tailwind-styled/shared"

const cache = new LRUCache<string, number>(256, 60_000) // max 256 entries, 60s TTL
cache.set("key", 42)
cache.get("key")    // → 42
cache.has("key")    // → true
cache.delete("key")
cache.clear()
```

**Constructor options:**
| Param | Type | Default | Description |
|---|---|---|---|
| `max` | `number` | `256` | Maximum entries before LRU eviction |
| `ttlMs` | `number \| null` | `null` | TTL in ms. `null` = no expiry |

---

## `TwError` — Unified Error Class

```typescript
import { TwError, isTwError, wrapUnknownError } from "@tailwind-styled/shared"

// Create
const err = new TwError("rust", "SCAN_FAILED", "Scanner returned null")

// From native binding
const nativeErr = TwError.fromRust({ code: "PARSE_ERROR", message: "..." })

// From Zod validation failure
const zodErr = TwError.fromZod(zodError)

// Wrap unknown
const wrapped = TwError.wrap("io", "FILE_NOT_FOUND", unknownError)

// Type guard
if (isTwError(error)) {
  console.log(error.source) // "rust" | "validation" | "compile" | "io" | "config" | "unknown"
  console.log(error.code)
  console.log(error.toCliMessage()) // "[RUST:SCAN_FAILED] Scanner returned null"
  console.log(error.toJSON())
}
```

**Error sources:**
| Source | When |
|---|---|
| `"rust"` | Native Rust binding failure |
| `"validation"` | Zod schema validation failure |
| `"compile"` | Compiler/transform failure |
| `"io"` | File system / I/O failure |
| `"config"` | Configuration error |
| `"unknown"` | Unclassified error |

---

## Native Binding Schemas (Zod)

Validate data from Rust native bindings before entering domain logic.

```typescript
import {
  NativeScanResultSchema,
  NativeTransformResultSchema,
  NativeCssCompileResultSchema,
  safeParseNative,
  parseNative,
} from "@tailwind-styled/shared"

// Safe parse — returns fallback on failure (for hot paths)
const scan = safeParseNative(
  NativeScanResultSchema,
  rawNativeData,
  { files: [], totalFiles: 0, uniqueClasses: [] }
)

// Strict parse — throws TwError on failure (for boundary entry points)
const result = parseNative(NativeTransformResultSchema, rawData, "compiler.transform")
```

**Available schemas:**
- `NativeScanFileSchema` — single file scan result
- `NativeScanResultSchema` — workspace scan result
- `NativeAnalyzerReportSchema` — analyzer report
- `NativeTransformResultSchema` — transform result
- `NativeCssCompileResultSchema` — CSS compile result
- `NativeWatchResultSchema` — watch handle
- `NativeCacheEntrySchema` — cache entry
- `NativeCacheReadResultSchema` — cache read result

---

## `hashContent(input)` — Deterministic Hashing

```typescript
import { hashContent } from "@tailwind-styled/shared"

const hash = hashContent("source code or any string")
// → deterministic hex string, same input always produces same output
```

---

## `createLogger(namespace)` — Structured Logging

```typescript
import { createLogger } from "@tailwind-styled/shared"

const log = createLogger("engine:scanner")

log.debug("Scanning 42 files")     // only if TWS_DEBUG=1
log.info("Scan complete")
log.warn("Cache miss for file.ts")
log.error("Native binding failed", error)
```

Debug logging respects:
- `TWS_DEBUG=1` — enable all debug output
- `DEBUG=engine:*` — enable namespaced debug (same pattern as `debug` npm package)

---

## `debounce(fn, ms)` and `throttle(fn, ms)`

```typescript
import { debounce, throttle } from "@tailwind-styled/shared"

const debouncedSave = debounce((data: string) => save(data), 300)
const throttledUpdate = throttle((ev: Event) => update(ev), 100)
```

---

## `resolveNativeBindingCandidates(opts)` — Native Binding Path Resolution

```typescript
import { resolveNativeBindingCandidates, loadNativeBinding } from "@tailwind-styled/shared"

const candidates = resolveNativeBindingCandidates({
  packageName: "@tailwind-styled/native",
  runtimeDir: __dirname,
})

const { binding } = loadNativeBinding({
  candidates,
  runtimeDir: __dirname,
  isValid: (mod) => typeof mod.scanWorkspace === "function",
  invalidExportMessage: "scanWorkspace not found",
})
```

**Env var overrides:**
- `TW_NATIVE_PATH` — absolute path to `.node` file (highest priority)
- `TWS_NO_NATIVE=1` / `TWS_NO_RUST=1` / `TWS_DISABLE_NATIVE=1` — disable native, return null

---

## `isDebugNamespaceEnabled(namespace)` — Debug Check

```typescript
import { isDebugNamespaceEnabled } from "@tailwind-styled/shared"

if (isDebugNamespaceEnabled("engine:scanner")) {
  console.log("Debug mode active for engine:scanner")
}
```

---

## `parseVersion(versionString)` — Semver Parsing

```typescript
import { parseVersion } from "@tailwind-styled/shared"

const { major, minor, patch } = parseVersion("5.0.2")
```
