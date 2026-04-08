# API Reference — `@tailwind-styled/plugin-api`

> Dokumentasi lengkap ada di [`packages/plugin-api/README.md`](../../packages/plugin-api/README.md).

Kontrak internal plugin — tipe dan schema yang harus diimplementasi plugin pihak ketiga.

## Interface Utama

| Interface | Keterangan |
|---|---|
| `TwPlugin` | Shape plugin: `name`, `version`, `setup(ctx)` |
| `TwContext` | API yang tersedia di `setup()` — `addVariant`, `addUtility`, `addToken`, `onGenerateCSS`, `onBuildEnd` |
| `PluginManifest` | Metadata plugin untuk registry |
| `ComponentConfig` | Shape konfigurasi komponen yang dapat ditransform |
| `TransformFn` | `(config: ComponentConfig, meta: TransformMeta) => ComponentConfig` |
| `CssHook` | `(css: string) => string` |

## Validasi

```ts
import { validatePluginManifest, validateTwPluginOptions } from "@tailwind-styled/plugin-api"

const manifest = validatePluginManifest(rawManifest)    // throw jika invalid
const opts     = validateTwPluginOptions(rawOptions)
```

## Utilitas

```ts
import { createTwPlugin } from "@tailwind-styled/plugin-api"

const plugin = createTwPlugin({
  name: "my-plugin",
  version: "1.0.0",
  setup(ctx) {
    // ...
  }
}) 
 .addVariant("hover", "&:hover")
  .addUtility("bg-red-500", { backgroundColor: "red" })
  .addToken("colors", { red: "#ff0000" })
  .onGenerateCSS((css) => css.replace("red", "blue"))
  .onBuildEnd(() => console.log("Build selesai!"))
  .build()
  // => TwPlugin
  // => { name: "my-plugin", version: "1.0.0", setup: (ctx) => { ... } }
  // => { variants: { hover: "&:hover" }, utilities: { "bg-red-500": { backgroundColor: "red" } }, tokens: { colors: { red: "#ff0000" } }, cssHooks: [ (css) => css.replace("red", "blue") ], buildEndHooks: [ () => console.log("Build selesai!") ] }
  // => { ... }
