# API Reference — `@tailwind-styled/plugin-registry`

Plugin discovery, search, dan install helper untuk ekosistem `tailwind-styled-v5`.

## CLI

```bash
# Search plugin
tw-plugin search animation

# List semua plugin tersedia
tw-plugin list
tw-plugin list --json

# Info detail satu plugin
tw-plugin info @tailwind-styled/plugin-animation

# Install plugin
tw-plugin install @tailwind-styled/plugin-animation
tw-plugin install @tailwind-styled/plugin-animation --dry-run
tw-plugin install my-external-plugin --allow-external
```

---

## Programmatic API

```ts
import {
  searchPlugins,
  listPlugins,
  getPluginInfo,
  installPlugin,
} from "@tailwind-styled/plugin-registry"

// Search
const results = await searchPlugins("animation")
// → [{ name, version, description, downloads, verified }]

// List semua
const all = await listPlugins()

// Info detail
const info = await getPluginInfo("@tailwind-styled/plugin-animation")
// → { name, version, description, author, peerDependencies, readme, ... }

// Install (jalankan npm install + update config)
await installPlugin("@tailwind-styled/plugin-animation", {
  dryRun: false,
  allowExternal: false,
  yes: false,  // skip konfirmasi
})
```

---

## Registry Format

Plugin yang dipublish ke registry harus memiliki:

1. `package.json` dengan keyword `tailwind-styled-plugin`
2. Export default implementasi `TwPlugin` (dari `@tailwind-styled/plugin-api`)
3. Field `tailwindStyled.manifest` di `package.json`:

```json
{
  "keywords": ["tailwind-styled-plugin"],
  "tailwindStyled": {
    "manifest": {
      "name": "@my-scope/my-plugin",
      "version": "1.0.0",
      "description": "My plugin",
      "entrypoint": "./dist/index.js"
    }
  }
}
```

---

## Verified vs External

Plugin dengan badge **verified** (✓) sudah diaudit oleh maintainer `tailwind-styled-v4`. Plugin external dapat diinstall dengan flag `--allow-external` namun tidak dijamin kompatibilitasnya.

---

## Known Limitations

Track B issues (belum dikerjakan — lihat `docs/ops/plugin-registry-track-b-issues.md`):
- Integration tests belum ada
- SLO benchmark workflow belum
- Security hardening pending
- Flag `--allowlist` belum diimplementasi
- Dokumentasi `plugin-registry.md` masih draft