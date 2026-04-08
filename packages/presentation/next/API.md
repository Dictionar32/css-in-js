# API Reference — `@tailwind-styled/next`

Next.js adapter untuk `tailwind-styled-v5` — integrasi webpack/Turbopack loader, route CSS splitting, dan RSC boundary detection.

## Setup

```ts
// next.config.ts
import type { NextConfig } from "next"
import { withTailwindStyled } from "@tailwind-styled/next"

const nextConfig: NextConfig = {
  reactStrictMode: true,
}

export default withTailwindStyled(nextConfig)
```

Dengan options:

```ts
export default withTailwindStyled({
  scanDirs: ["src", "app"],
  routeCss: true,
  preserveImports: true,
  debug: false,
})(nextConfig)
```

---

## Options

| Option | Tipe | Default | Keterangan |
|---|---|---|---|
| `scanDirs` | `string[]` | `["src", "app"]` | Direktori yang di-scan untuk class extraction |
| `routeCss` | `boolean` | `true` | Generate CSS terpisah per route (App Router) |
| `preserveImports` | `boolean` | `true` | Jangan strip import `tw`, `cx`, `cv`, `cn` |
| `debug` | `boolean` | `false` | Log transform detail ke console |
| `nativeBinding` | `string` | auto-detect | Path eksplisit ke `.node` binary |

---

## Cara Kerja

`withTailwindStyled()` meng-inject dua hal ke Next.js config:

1. **Webpack/Turbopack loader** — transform setiap file `.tsx`/`.ts` yang mengandung `tw.*` melalui compiler pipeline
2. **Plugin** — collect CSS hasil transform dari semua file, inject ke entry CSS

```
next build
    │
    ├─ Turbopack/Webpack loader → transform tiap file
    │       └─ compiler.transformSource(source)
    │
    └─ next.config plugin → inject CSS ke app/globals.css
```

---

## Route CSS Splitting

Dengan `routeCss: true` (default), CSS di-split per route di App Router:

```
.next/static/css/
├── app/page.css          → CSS untuk app/page.tsx
├── app/dashboard/page.css
└── app/__tw-safelist.css → CSS global (dipakai di banyak route)
```

Import di layout:

```tsx
// app/layout.tsx
import "@tailwind-styled/next/route-css"  // auto-inject route CSS
```

---

## RSC Support

Compiler secara otomatis mendeteksi RSC boundary. Komponen `tw.*` di Server Components tidak butuh `"use client"`:

```tsx
// app/page.tsx — Server Component, tidak perlu 'use client'
import { tw } from "tailwind-styled-v4"

const Hero = tw.section`py-24 text-center`  // ✅ jalan di RSC
```

Komponen yang menggunakan State Engine atau Container Query otomatis mendapat `"use client"` dari compiler.

---

## Subpath Exports

| Import | Keterangan |
|---|---|
| `@tailwind-styled/next` | `withTailwindStyled` |
| `@tailwind-styled/next/route-css` | Auto-inject route CSS di layout |

| `@tailwind-styled/next/next-image` | `tw(Image)` |
| `@tailwind-styled/next/link` | `tw(Link)` |
| `@tailwind-styled/next/next-font` | `tw(Font)` |
| `@tailwind-styled/next/next-script` | `tw(Script)` |

---

## Next.js 13+ Support

`tailwind-styled-v4` mendukung Next.js 13+ dengan baik. Untuk Next.js 12, gunakan `tailwind-styled-v3`.