# API Reference — `@tailwind-styled/plugin`

Plugin system untuk `tailwind-styled-v5` — register custom variants, utilities, tokens, dan transform hooks ke compiler pipeline.

## Import

```ts
// Plugin runtime
import { use, createTw, getRegistry } from "@tailwind-styled/plugin"

// Built-in plugins (subpath)
import { pluginAnimation, pluginTokens } from "@tailwind-styled/plugin/plugins"

// Built-in presets (subpath)
import { presetVariants, presetTypography } from "@tailwind-styled/plugin/presets"
```

---

## Fungsi Utama

### `use(plugin, config?)`

Register plugin ke global registry:

```ts
import { use } from "@tailwind-styled/plugin"
import myPlugin from "./my-plugin"

use(myPlugin)
use(myPlugin, { debug: true })  // dengan options
```

---

### `createTw(options)`

Buat isolated instance dengan registry terpisah — berguna untuk library yang tidak ingin mempengaruhi registry global:

```ts
const { use, getRegistry } = createTw({
  plugins: [pluginAnimation(), pluginTokens()],
  debug: false,
})

use(myLibraryPlugin)
```

---

### `getRegistry()`

Baca state registry saat ini:

```ts
const registry = getRegistry()
// registry.variants   → Map<string, VariantResolver>
// registry.utilities  → Map<string, Record<string, string>>
// registry.tokens     → Map<string, string>
// registry.transforms → TransformFn[]
// registry.cssHooks   → CssHook[]
```

---

## Built-in Plugins

### `pluginAnimation(options?)`

Integrasikan `@tailwind-styled/animate` ke compiler pipeline:

```ts
use(pluginAnimation({
  defaultDuration: "200ms",
  defaultEasing: "ease-out",
}))
```

### `pluginTokens(tokens)`

Register design tokens sebagai CSS variables:

```ts
use(pluginTokens({
  brand: "#ff6b6b",
  "brand-hover": "#ee5a5a",
}))
// → --tw-brand: #ff6b6b tersedia di semua komponen
```

---

## Built-in Presets

### `presetVariants()`

Tambahkan variant populer yang tidak ada di Tailwind default:

```ts
use(presetVariants())
// Menambahkan: hocus, group-hocus, peer-hocus,
//              children, not-first, not-last, ...
```

### `presetTypography()`

Variant dan utility untuk tipografi lanjutan:

```ts
use(presetTypography())
```

---

## Subpath Exports

| Import | Keterangan |
|---|---|
| `@tailwind-styled/plugin` | Core: `use`, `createTw`, `getRegistry` |
| `@tailwind-styled/plugin/plugins` | Built-in plugins: `pluginAnimation`, `pluginTokens` |
| `@tailwind-styled/plugin/presets` | Built-in presets: `presetVariants`, `presetTypography` |
