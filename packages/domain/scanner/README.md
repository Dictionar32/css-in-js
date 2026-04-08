# `@tailwind-styled/scanner`

Scanner workspace untuk `tailwind-styled-v4` — ekstraksi Tailwind class dari seluruh file project secara paralel, dengan caching persistent dan worker thread support.

---

## Cara Kerja

```
scanWorkspace(root, options)
       │
       ├─ Rust native? ─── ya ──► scanWorkspaceNative() via napi ──► ScanResult
       │                               └─ parallel Rayon threads
       │
       └─ fallback JS ──────────► Worker Thread ──► scan file per file
                                       └─ extractClassesFromSource()
```

1. Coba load `@tailwind-styled/native` — gunakan `scan_workspace` Rust (parallel, ~425× lebih cepat)
2. Jika binary tidak tersedia, fallback ke Worker Thread Node.js
3. Hasil di-cache ke disk (`.tw-cache/`) dan in-memory (DashMap via Rust)

---

## API

```ts
import { scanWorkspace } from "@tailwind-styled/scanner"

const result = scanWorkspace("./src", {
  includeExtensions: [".tsx", ".ts", ".jsx", ".js"],
  ignoreDirectories: ["node_modules", ".next", "dist"],
  useCache: true,
  cacheDir: ".tw-cache",
  smartInvalidation: true,
})

// result: ScanWorkspaceResult
// {
//   files: Array<{ file: string; classes: string[]; hash?: string }>
//   totalFiles: number
//   uniqueClasses: string[]
//   scannedAt: number
// }
```

### Options

| Option | Tipe | Default | Keterangan |
|---|---|---|---|
| `includeExtensions` | `string[]` | `[".tsx",".ts",".jsx",".js",".html",".vue",".svelte"]` | Ekstensi file yang di-scan |
| `ignoreDirectories` | `string[]` | `["node_modules",".git","dist",".next"]` | Direktori yang diskip |
| `useCache` | `boolean` | `true` | Aktifkan persistent cache |
| `cacheDir` | `string` | `".tw-cache"` | Lokasi cache JSON |
| `smartInvalidation` | `boolean` | `true` | Hanya rescan file yang berubah (via hash) |

---

## File Utama

| File | Keterangan |
|---|---|
| `src/index.ts` | Entry point — `scanWorkspace()`, native loader, Worker dispatcher |
| `src/worker.ts` | Worker thread — jalankan `scanWorkspace` di thread terpisah |
| `src/schemas.ts` | Zod schemas — `ScanWorkspaceOptionsSchema`, `ScanWorkspaceResultSchema` |
| `src/cache.ts` | Cache JS (fallback) — baca/tulis `.tw-cache/*.json` |
| `src/cache-native.ts` | Cache via Rust — wrap `cache_read`/`cache_write` native |
| `src/in-memory-cache.ts` | In-memory Map cache (JS fallback) |
| `src/native-bridge.ts` | Bridge ke Rust — `scanWorkspaceNative`, `hashContentNative` |
| `src/ast-native.ts` | AST extraction via native — wrap `ast_extract_classes` |
| `src/oxc-bridge.ts` | Oxc extraction via native — wrap `oxc_extract_classes` |

---

## Environment Variables

| Variable | Efek |
|---|---|
| `TWS_LOG_LEVEL=debug` | Log cache HIT/MISS dan scan detail |
| `TWS_DEBUG_SCANNER=1` | Shorthand untuk debug scanner |
| `TWS_DISABLE_SCANNER_WORKER=1` | Paksa sync scan tanpa worker thread |

---

## Dependensi

- `@tailwind-styled/native` — Rust engine (opsional, fallback tersedia)
- `@tailwind-styled/shared` — logger, `loadNativeBinding`, `resolveRuntimeDir`