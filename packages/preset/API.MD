# API Reference — `@tailwind-styled/preset`

Default preset dan design tokens untuk `tailwind-styled-v4` — zero-config setup dengan token warna, spacing, dan tipografi siap pakai.

## Import

```ts
// Default preset (auto-loaded via tw setup)
import preset from "@tailwind-styled/preset"

// Design tokens saja
import { tokens, colors, spacing, typography } from "@tailwind-styled/preset/default"
```

---

## Cara Pakai

Preset sudah di-load otomatis ketika menjalankan `npx tw setup`. Tidak perlu konfigurasi manual untuk proyek baru.

Untuk kustomisasi:

```ts
// tailwind-styled.config.json
{
  "preset": "@tailwind-styled/preset",
  "extend": {
    "colors": {
      "brand": "#ff6b6b",
      "brand-dark": "#cc5555"
    },
    "spacing": {
      "18": "4.5rem"
    }
  }
}
```

---

## Design Tokens Bawaan

### Colors
Semua warna Tailwind v4 standard tersedia sebagai CSS variables:
`--color-slate-*`, `--color-blue-*`, `--color-red-*`, dst (50–950).

### Spacing
Scale spacing Tailwind v4: `0`, `px`, `0.5`, `1` ... `96`, plus arbitrary value support.

### Typography
Font family defaults: `font-sans`, `font-serif`, `font-mono` dengan font stack modern.

### Border Radius
`rounded-*` scale: `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`, `full`.

---

## Subpath Exports

| Import | Keterangan |
|---|---|
| `@tailwind-styled/preset` | Preset object lengkap |
| `@tailwind-styled/preset/default` | Token individual — `colors`, `spacing`, `typography` |
| `@tailwind-styled/preset/colors` | Hanya token warna |
| `@tailwind-styled/preset/spacing` | Hanya token spacing |
| `@tailwind-styled/preset/typography` | Hanya token tipografi |

---

## Lisensi

MIT License.