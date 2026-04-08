# API Reference — `@tailwind-styled/dashboard`

> Dokumentasi lengkap ada di [`packages/dashboard/README.md`](../../packages/dashboard/README.md).

## Quick Start

```bash
# Via CLI
tw dashboard

# Atau langsung
node -e "import('@tailwind-styled/dashboard').then(m => m.startDashboard())"
```

Buka `http://localhost:3000` di browser.

---

## Endpoints

| Method | Path | Response | Keterangan |
|---|---|---|---|
| `GET` | `/` | HTML | Dashboard UI |
| `GET` | `/metrics` | JSON | Snapshot metrics saat ini |
| `GET` | `/history` | JSON array | Semua snapshot metrics |
| `GET` | `/summary` | JSON | Agregasi history (avg, min, max) |
| `GET` | `/health` | `{ ok: true }` | Health check |
| `POST` | `/reset` | `{ ok: true }` | Reset history |

---

## Metrics Format

```json
{
  "buildTimeMs": 4.2,
  "totalFiles": 142,
  "uniqueClasses": 891,
  "cssLength": 18540,
  "cacheHitRate": 0.97,
  "mode": "incremental",
  "generatedAt": 1712500000000
}
```

---

## Cara Kerja

Server membaca metrics dari file `.tw-cache/metrics.json` yang ditulis oleh engine saat build. Perubahan file dipantau via `fs.watch` — jika tidak tersedia, fallback ke polling setiap 2 detik.

```
Engine build → tulis .tw-cache/metrics.json
                          │
Dashboard server ◄── fs.watch ─── update in-memory state
        │
   GET /metrics ──────────────── kembalikan currentMetrics
   GET /history ──────────────── kembalikan snapshot array
```

---

## File Utama

| File | Keterangan |
|---|---|
| `src/server.ts` | HTTP server — routing semua endpoint |
| `src/server.mjs` | ESM wrapper untuk import langsung |
| `src/state.ts` | In-memory state — `currentMetrics`, `history`, `updateMetrics` |
| `src/state.d.ts` | Type declarations state |
| `src/index.ts` | Entry point — re-export `startDashboard` |

---

## Environment Variables

| Variable | Default | Keterangan |
|---|---|---|
| `PORT` | `3000` | Port HTTP server |
| `STUDIO_VERBOSE` | tidak ada | Tampilkan stdout/stderr server |

---

## Integrasi dengan CLI

Dashboard dijalankan via perintah `tw dashboard` di `@tailwind-styled/cli`. Studio Desktop juga me-forward metrics ke dashboard via IPC. Lihat [@tailwind-styled/cli](https://github.com/bratislava/tailwind-styled/tree/main/packages/cli) untuk detail.
   tw dashboard 
   │
   └── startDashboard() ───> server.listen()
      │
       └── state.updateMetrics() ───> fs.watch()
         │
           └── .tw-cache/metrics.json ───> Engine build
             │
               └── Engine build ───> tulis metrics.json
                 │
                  └── fs.watch() ───> updateMetrics()
                   │
                     └── GET /metrics ───> currentMetrics
                     │
                       └── GET /history ───> history
                       │
                         └── Studio Desktop ───> IPC ───> updateMetrics()
                         │
                           └── GET /metrics ───> currentMetrics
                           │
                             └── GET /history ───> history
                             │
                             └── CLI ───> startDashboard() ───> server.listen()
                             │
                             └── state.updateMetrics() ───> fs.watch()
                             │
                             └── .tw-cache/metrics.json ───> Engine build
                             │
                             └── Engine build ───> tulis metrics.json
                             │
                             └── fs.watch() ───> updateMetrics()
                             │
                             └── GET /metrics ───> currentMetrics
                             │
                             └── GET /history ───> history