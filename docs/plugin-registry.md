# Plugin Registry

`@tailwind-styled/plugin-registry` menyediakan discovery, install, dan management plugin untuk ekosistem tailwind-styled.

## Instalasi

```bash
npm install @tailwind-styled/plugin-registry
```

## CLI Usage

```bash
# Search plugin
tw plugin search <keyword>
tw plugin search typography --json

# List semua plugin
tw plugin list
tw plugin list --json

# Info detail plugin
tw plugin info <plugin-name>
tw plugin info @tailwind-styled/typography

# Install plugin
tw plugin install <plugin-name>
tw plugin install @tailwind-styled/typography
tw plugin install @tailwind-styled/forms --dry-run

# Uninstall plugin
tw plugin uninstall <plugin-name>

# Cek update
tw plugin update-check
tw plugin update-check --json

# Verifikasi integrity
tw plugin verify <plugin-name>
```

## Programmatic API

```typescript
import { PluginRegistry, getRegistry } from "@tailwind-styled/plugin-registry"

// Pakai default registry (dari registry.json bawaan)
const registry = getRegistry()

// Search
const results = registry.search("typography")
console.log(results) // PluginInfo[]

// Get all
const all = registry.getAll()

// Get by name
const plugin = registry.getByName("@tailwind-styled/typography")

// Install (dry run)
const result = registry.install("@tailwind-styled/typography", { dryRun: true })

// Install external plugin (butuh konfirmasi)
const ext = registry.install("my-custom-plugin", {
  allowExternal: true,
  confirmExternal: true,
})

// Verify integrity
const check = registry.verifyIntegrity("@tailwind-styled/typography")
console.log(check.ok) // true/false

// Cek update
const update = registry.checkForUpdate("@tailwind-styled/typography")
if (update.hasUpdate) {
  console.log(`Update tersedia: ${update.current} → ${update.latest}`)
}

// Load dari URL custom
const customRegistry = await PluginRegistry.loadFromUrl("https://my-registry.com/plugins.json")
```

## Error Handling

```typescript
import { PluginRegistry, PluginRegistryError } from "@tailwind-styled/plugin-registry"

try {
  registry.install("unknown-plugin")
} catch (err) {
  if (err instanceof PluginRegistryError) {
    console.error(err.code)    // "PLUGIN_NOT_FOUND"
    console.error(err.message) // Pesan yang actionable
    console.error(err.context) // { pluginName: "unknown-plugin", ... }
  }
}
```

### Error codes

| Code | Penyebab |
|---|---|
| `PLUGIN_NOT_FOUND` | Plugin tidak ada di registry, dan `--allow-external` tidak diset |
| `EXTERNAL_CONFIRMATION_REQUIRED` | Plugin eksternal membutuhkan `--allow-external --yes` |
| `INVALID_PLUGIN_NAME` | Nama plugin tidak sesuai format (`^(@[a-z0-9-]+/)?[a-z0-9-]+$`) |
| `INSTALL_COMMAND_FAILED` | npm install gagal dijalankan |
| `INSTALL_FAILED` | npm install exit dengan kode non-zero |
| `NETWORK_ERROR` | Gagal fetch registry dari URL |
| `REGISTRY_LOAD_FAILED` | Registry data tidak valid |

## Options `install()`

| Option | Type | Default | Deskripsi |
|---|---|---|---|
| `dryRun` | boolean | false | Simulasi install tanpa benar-benar menginstall |
| `allowExternal` | boolean | false | Izinkan install plugin di luar registry |
| `confirmExternal` | boolean | false | Konfirmasi untuk plugin eksternal |
| `npmBin` | string | `"npm"` | Path ke npm binary (override via `TW_PLUGIN_NPM_BIN`) |

## Menambah Plugin ke Registry

Edit `packages/plugin-registry/registry.json`:

```json
{
  "version": "5.0.0",
  "official": [
    {
      "name": "@tailwind-styled/your-plugin",
      "description": "Deskripsi singkat plugin",
      "version": "1.0.0",
      "tags": ["kategori", "keyword"],
      "official": true,
      "docs": "https://docs.example.com",
      "install": "npm install @tailwind-styled/your-plugin"
    }
  ],
  "community": []
}
```

## Security

- Plugin yang tidak ada di registry **diblokir by default**
- Install plugin eksternal membutuhkan `--allow-external --yes` secara eksplisit
- Nama plugin divalidasi dengan regex ketat: `^(@[a-z0-9-]+/)?[a-z0-9-]+(@[0-9]+\.[0-9]+\.[0-9]+)?$`
- Integrity check via SHA-256: `tw plugin verify <name>`

## Known Limitations

- `tw plugin install` memanggil `npm install` di background — pastikan sudah ada `package.json`
- Update check membandingkan versi di registry.json, bukan versi di npmjs.com
- Load dari URL (`PluginRegistry.loadFromUrl`) membutuhkan koneksi internet
- Tidak ada caching untuk remote registry — setiap call ke `loadFromUrl` melakukan fetch baru

## Changelog

- v5.0.2: `verifyIntegrity()`, `checkForUpdate()`, `checkAllUpdates()` ditambahkan
- v5.0.0: Rilis awal dengan search, list, install, uninstall
