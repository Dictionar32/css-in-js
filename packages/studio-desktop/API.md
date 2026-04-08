# API Reference — `@tailwind-styled/studio-desktop`

Electron desktop application untuk tailwind-styled Studio — visual editor, engine metrics, dan real-time build monitoring.

## Development

```bash
# Start dev mode
npm run dev -w @tailwind-styled/studio-desktop

# Start production mode
npm run start -w @tailwind-styled/studio-desktop
```

## Build Distribusi

```bash
npm run build:mac    # macOS DMG + ZIP
npm run build:win    # Windows NSIS installer
npm run build:linux  # AppImage + DEB
npm run build:all    # Semua platform
```

---

## Window API (`window.studioDesktop`)

Tersedia di renderer process via `contextBridge`:

### Engine Operations

```js
// Scan workspace
const scan = await window.studioDesktop.engineScan()
// → { ok: true, totalFiles: 42, uniqueClasses: 312 }

// Build CSS
const build = await window.studioDesktop.engineBuild()
// → { ok: true, cssLength: 18540, buildTimeMs: 4.2 }

// Watch mode
await window.studioDesktop.engineWatchStart()
await window.studioDesktop.engineWatchStop()

// Reset engine state
await window.studioDesktop.engineReset()
```

### Engine Events

```js
// Subscribe engine events (live updates)
window.studioDesktop.onEngineEvent((event) => {
  if (event.type === "change") {
    console.log("Rebuilt:", event.result.cssLength, "bytes")
  }
  if (event.type === "error") {
    console.error("Build error:", event.error)
  }
})
```

### Project Management

```js
// Ganti project yang sedang dibuka
await window.studioDesktop.changeProject("/path/to/project")
```

---

## IPC Handlers (Main Process)

| Channel | Keterangan |
|---|---|
| `engine-scan` | Jalankan `scanWorkspace` |
| `engine-build` | Jalankan `build()` engine |
| `engine-watch-start` | Mulai watch mode |
| `engine-watch-stop` | Stop watch mode |
| `engine-reset` | Reset engine instance |
| `change-project` | Ganti direktori project |

---

## Environment Variables

| Variable | Default | Keterangan |
|---|---|---|
| `STUDIO_PORT` | `3030` | Port dashboard server internal |
| `STUDIO_VERBOSE` | tidak ada | Tampilkan stdout/stderr server |

---

## Script Resolution

Main process mencari studio server script via `resolveStudioScript()` — urutan prioritas:
1. `process.resourcesPath/scripts/v48/lsp.mjs` (packaged app)
2. `__dirname/../../scripts/v48/lsp.mjs` (dev)
3. `cwd/scripts/v48/lsp.mjs` (fallback)

---

## Catatan Implementasi

- Engine di-lazy-load per project via `createEngine` dari `@tailwind-styled/engine`
- Engine instance di-reset otomatis saat `change-project` dipanggil
- Engine events di-forward dari main → renderer via `webContents.send("engine-event")`
- `electron` dan `electron-builder` ada di `optionalDependencies` — jangan pindahkan ke `dependencies`