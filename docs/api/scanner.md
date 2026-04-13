# Scanner API

The `@tailwind-styled/scanner` package extracts Tailwind class names from source files using Rust-powered AST parsing.

## `scanFile(filePath, options?)`

Scan a single file and return discovered classes.

```typescript
import { scanFile } from "@tailwind-styled/scanner"

const result = scanFile("./src/Button.tsx")
console.log(result.file)    // "./src/Button.tsx"
console.log(result.classes) // ["flex", "px-4", "py-2", "hover:bg-blue-600"]
console.log(result.hash)    // file hash for cache invalidation
```

---

## `scanWorkspace(rootDir, options?)`

Scan all source files in a directory (synchronous).

```typescript
import { scanWorkspace } from "@tailwind-styled/scanner"

const result = scanWorkspace("./src", {
  includeExtensions: [".ts", ".tsx", ".jsx", ".js"],
  ignoreDirectories: ["node_modules", ".next", "dist"],
  useCache: true,
})

console.log(result.totalFiles)     // number of scanned files
console.log(result.uniqueClasses)  // sorted array of unique classes
console.log(result.files)          // per-file results
```

---

## `scanWorkspaceAsync(rootDir, options?)`

Async version of `scanWorkspace` — preferred for CLI and build tools.

```typescript
import { scanWorkspaceAsync } from "@tailwind-styled/scanner"

const result = await scanWorkspaceAsync("./src")
```

---

## `scanSource(source)`

Extract classes from a source code string (no file I/O).

```typescript
import { scanSource } from "@tailwind-styled/scanner"

const classes = scanSource(`
  const Button = () => (
    <button className="flex px-4 py-2 bg-blue-500 hover:bg-blue-600">
      Click
    </button>
  )
`)
// → ["flex", "px-4", "py-2", "bg-blue-500", "hover:bg-blue-600"]
```

---

## `isScannableFile(filePath, extensions?)`

Check if a file should be scanned based on its extension.

```typescript
import { isScannableFile } from "@tailwind-styled/scanner"

isScannableFile("Button.tsx")         // → true
isScannableFile("styles.css")         // → false
isScannableFile("comp.vue", [".vue"]) // → true
```

---

## Constants

```typescript
import { DEFAULT_EXTENSIONS, DEFAULT_IGNORES } from "@tailwind-styled/scanner"

// Default extensions scanned
DEFAULT_EXTENSIONS // [".ts", ".tsx", ".jsx", ".js", ".mjs", ".cjs"]

// Default directories skipped
DEFAULT_IGNORES // ["node_modules", ".git", ".next", "dist", "out", ".turbo"]
```

---

## `ScanWorkspaceOptions`

```typescript
interface ScanWorkspaceOptions {
  includeExtensions?: string[]    // File extensions to scan (default: DEFAULT_EXTENSIONS)
  ignoreDirectories?: string[]    // Directories to skip (default: DEFAULT_IGNORES)
  useCache?: boolean              // Use Rust DashMap in-memory cache (default: true)
  cacheDir?: string               // Custom cache directory
  smartInvalidation?: boolean     // Hash-based cache invalidation (default: true)
}
```

---

## `ScanWorkspaceResult`

```typescript
interface ScanWorkspaceResult {
  files: ScanFileResult[]    // Per-file scan results
  totalFiles: number         // Total files scanned
  uniqueClasses: string[]    // Sorted unique class names
}

interface ScanFileResult {
  file: string       // Absolute file path
  classes: string[]  // Classes found in file
  hash?: string      // File hash for cache invalidation
}
```

---

## Performance Notes

- **Native mode** (default): Rust-powered scanning via NAPI bindings — 3–10x faster than JS
- **Files < 5**: Sequential scan (no rayon overhead) — QA #22 adaptive threshold
- **Files >= 5**: Parallel scan via rayon thread pool
- **Cache**: Rust DashMap in-memory cache with hash-based invalidation
- **Large workloads**: ~8–12x faster than JS sequential for 200+ files

---

## Known Limitations

- Requires native Rust bindings (`npm run build:rust`)
- Dynamic class names (`` `bg-${color}` ``) are not detected — use safelist
- JSX template literals with complex expressions may miss some classes
