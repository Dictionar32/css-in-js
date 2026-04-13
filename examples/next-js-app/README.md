# tailwind-styled-v4 — Next.js App Router Demo

Demo lengkap `tailwind-styled-v4` dengan Next.js 15 App Router.

## Prerequisites

- Node.js >= 20
- npm >= 10
- (Optional) Rust toolchain untuk native binary

## Setup dari root monorepo

```bash
# 1. Install semua monorepo deps
npm install

# 2. Build dependency packages
npm run build -w @tailwind-styled/shared
npm run build -w @tailwind-styled/core
npm run build -w @tailwind-styled/next
npm run build -w tailwind-styled-v4

# 3. (Optional) Build native Rust binary untuk performa penuh
npm run build:rust

# 4. Jalankan dev server
npm run example:dev
```

Atau pakai shortcut dari root:
```bash
npm run example:dev      # start dev server
npm run example:build    # production build
npm run example:typecheck # TypeScript check saja
```

## Setup standalone (tanpa monorepo)

```bash
cd examples/next-js-app
npm install
npx next dev
```

> **Note**: Mode standalone membutuhkan `tailwind-styled-v4` sudah dipublish ke npm atau di-link secara lokal.

## Mode tanpa native binary

Jika Rust tidak terinstall, set environment variable:

```bash
TWS_DISABLE_NATIVE=1 npx next dev
```

Ini akan menggunakan JS fallback — lebih lambat tapi tetap berfungsi untuk development.

## Struktur

```
src/
  app/
    layout.tsx        # Root layout dengan TwCssInjector
    page.tsx          # Demo page: components, variants, RSC
    globals.css       # Tailwind CSS v4 entry point
  components/
    theme-and-cart-controls.tsx  # "use client" component
    DevToolsClient.tsx           # DevTools panel (client)
```

## Fitur yang didemokan

- `tw.div\`classes\`` — template literal syntax
- `tw.button({ base, variants })` — object config syntax
- `.extend\`extra-classes\`` — component inheritance
- `cv({ variants })` — class variant function
- RSC auto-inject `'use client'` detection
- Live token system (`liveToken`, `setToken`)
- DevTools panel

## CI/CD

Workflow: `.github/workflows/example-next-app.yml`

Trigger: push/PR ke `examples/next-js-app/**` atau `packages/next/**`

Steps: install → build packages → tsc → next build → lint
