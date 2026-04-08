# API Reference — `@tailwind-styled/devtools`

> Dokumentasi lengkap ada di [`packages/devtools/README.md`](../../packages/devtools/README.md).

Visual debug overlay — zero production impact.

## Komponen

```tsx
import { TwDevTools } from "@tailwind-styled/devtools"

// Di layout.tsx
{process.env.NODE_ENV === "development" && <TwDevTools />}
```

## Panel

| Shortcut | Panel | Keterangan |
|---|---|---|
| `1` | Inspector | Hover element → lihat classes + variant props |
| `2` | State | Komponen State Engine aktif |
| `3` | Container | Container Query breakpoints aktif |
| `4` | Tokens | Live token editor |
| `5` | Analyzer | Duplikat class + engine metrics |
| `6` | Trace | Build timeline |

Toggle: `Ctrl+Shift+D` · Tutup: `Escape`
 ·
## Pengaturan

```tsx
import { TwDevTools } from "@tailwind-styled/devtools"

<TwDevTools
  // Panel aktif default
  defaultPanel="inspector"

  // Shortcut toggle
  toggleShortcut="ctrl+shift+d"

  // Shortcut tutup
  closeShortcut="escape"

  // Shortcut panel
  panelShortcuts={{
    inspector: "1",
    state: "2",
    container: "3",
    tokens: "4",
    analyzer: "5",
    trace: "6",
  }}
/>
 
 // Shortcut untuk menampilkan/menyembunyikan overlay
  toggleOverlayShortcut="ctrl+shift+o"
/>