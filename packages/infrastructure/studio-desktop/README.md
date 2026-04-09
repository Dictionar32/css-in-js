# Studio Desktop — tailwind-styled Studio (Electron)

Web-based component studio yang dibungkus dalam Electron desktop app.

## Mode

### Web Studio (tidak perlu Electron)
```bash
tw studio --project=.          # buka di browser
tw studio --project=. --port=3030
```

### Desktop App (perlu Electron)
```bash
# Development
cd packages/studio-desktop
npm install
npm run dev      # buka Electron window dengan DevTools

# Production build
npm run build:mac    # .dmg untuk macOS (arm64 + x64)
npm run build:win    # .exe NSIS installer untuk Windows
npm run build:linux  # .AppImage dan .deb untuk Linux
npm run build:all    # semua platform sekaligus
```

## Setup

### Prerequisites
```bash
cd packages/studio-desktop
npm install electron electron-builder electron-updater
```

### Icon assets (diperlukan untuk packaging)
```
packages/studio-desktop/assets/
  icon.icns    # macOS (1024×1024)
  icon.ico     # Windows (256×256)
  icon.png     # Linux (512×512)
```

Buat icon dengan tool seperti `electron-icon-builder` atau manual.

## Fitur

| Fitur | Status |
|-------|--------|
| Component scanner | ✅ Scan tw()/cv() components |
| Search & filter | ✅ Real-time filter by name/type/file |
| AI generator | ✅ tw ai "describe" via endpoint |
| Route CSS split | ✅ Via menu Tools → Split Route CSS |
| Native file picker | ✅ Electron dialog.showOpenDialog |
| System tray | ✅ Sprint 9 — gradient PNG icon, context menu, click-to-toggle |
| Auto-updater | ✅ electron-updater konfigurasi GitHub releases |
| Dark mode | ✅ Auto via nativeTheme.shouldUseDarkColors |

## Konfigurasi

### Environment variables
```bash
STUDIO_PORT=3030        # port web studio server (default: 3030)
ANTHROPIC_API_KEY=...   # untuk AI generator
NODE_ENV=development    # enable DevTools
```

### electron-builder publish
Edit `packages/studio-desktop/package.json`:
```json
"publish": {
  "provider": "github",
  "owner": "your-org",
  "repo": "tailwind-styled-v4"
}
```

Lalu set `GH_TOKEN` environment variable untuk publish ke GitHub releases.

## IPC API (preload.js)

Tersedia di window sebagai `window.studioDesktop`:

```javascript
window.studioDesktop.getProjectPath()      // → "/path/to/project"
window.studioDesktop.openFilePicker()      // → "/selected/path" | null
window.studioDesktop.changeProject(path)   // → { ok, url }
window.studioDesktop.isElectron            // → true
window.studioDesktop.platform             // → "darwin" | "win32" | "linux"
```

## Distribusi

Output di `packages/studio-desktop/dist-electron/`:
- macOS: `tailwind-styled Studio-4.2.0-arm64.dmg`, `...-x64.dmg`
- Windows: `tailwind-styled Studio Setup 4.2.0.exe`
- Linux: `tailwind-styled Studio-4.2.0.AppImage`, `..._amd64.deb`

## Known limitations

- Icon assets harus dibuat manual (tidak termasuk dalam repo)
- ✅ Tray icon Sprint 9 done — gradient PNG icon, context menu (Open Studio, Open in Browser, Quit), click to toggle, double-click to focus
- Auto-updater butuh GitHub token dan published release
- Build cross-platform butuh OS yang sesuai atau Docker

Lihat juga: [docs/known-limitations/](known-limitations/) untuk limitasi per command.

## Engine API (window.studioDesktop)

Tersedia di renderer process via `contextBridge`:

```js
// Scan workspace
const scan = await window.studioDesktop.engineScan()
// → { ok: true, totalFiles: 42, uniqueClasses: 312 }

// Build CSS
const build = await window.studioDesktop.engineBuild()
// → { ok: true, cssLength: 18540, buildTimeMs: 4.2 }

// Watch mode
await window.studioDesktop.engineWatchStart()

// Subscribe events
window.studioDesktop.onEngineEvent((event) => {
  if (event.type === "change") console.log("Rebuilt:", event.result.cssLength, "bytes")
  if (event.type === "error")  console.error("Error:", event.error)
})

// Stop watch & reset
await window.studioDesktop.engineWatchStop()
await window.studioDesktop.engineReset()

// Project management
await window.studioDesktop.changeProject("/path/to/project")
```

## System Tray

Tray icon (gradient PNG) dengan context menu:
- **Open Studio** — buka/fokus main window
- **Open in Browser** — buka di browser default
- **Quit** — keluar aplikasi

Single-click: toggle window. Double-click: fokus window.

## Auto-Updater

Extension `electron-updater` sudah dikonfigurasi untuk GitHub releases. Setup:

```json
// packages/studio-desktop/package.json
"publish": {
  "provider": "github",
  "owner": "your-org",
  "repo": "tailwind-styled-v4"
}
```

Set `GH_TOKEN` environment variable saat publish:
```bash
GH_TOKEN=xxx npm run build:all
```