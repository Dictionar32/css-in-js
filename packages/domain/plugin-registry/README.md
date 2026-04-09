# Plugin Registry

`@tailwind-styled/plugin-registry` menyediakan CLI untuk menemukan dan menginstall plugin tailwind-styled.

## Instalasi

Plugin registry sudah termasuk dalam `tailwind-styled-v4`. Gunakan via CLI `tw` atau `tw-plugin` langsung.

## Commands

### `tw plugin search <query>`
```bash
tw plugin search animation
# @tailwind-styled/plugin-animation@4.2.0 [official]
#   Animation presets and keyframes
#   tags: animation, motion, transition

tw plugin search animation --json
# [{ "name": "...", "version": "...", ... }]
```

### `tw plugin list`
```bash
tw plugin list
tw plugin list --json
```

### `tw plugin info <package>`
```bash
tw plugin info @tailwind-styled/plugin-animation
tw plugin info @tailwind-styled/plugin-animation --json
```

### `tw plugin install <package>`
```bash
# Install plugin resmi
tw plugin install @tailwind-styled/plugin-animation

# Dry run (tidak install nyata)
tw plugin install @tailwind-styled/plugin-animation --dry-run

# Plugin eksternal (di luar registry) — perlu konfirmasi eksplisit
tw plugin install my-custom-plugin --allow-external --yes

# Debug mode — lihat timing dan path eksekusi
tw plugin install @tailwind-styled/plugin-animation --debug
```

## Options

| Option | Deskripsi |
|--------|-----------|
| `--json` | Output JSON (untuk scripting / CI) |
| `--debug` | Tampilkan timing dan detail eksekusi ke stderr |
| `--dry-run` | Simulasi install tanpa eksekusi nyata |
| `--allow-external` | Izinkan install plugin di luar registry |
| `--yes` | Konfirmasi otomatis untuk plugin eksternal |

## Error codes

| Code | Arti |
|------|------|
| `INVALID_PLUGIN_NAME` | Nama plugin tidak sesuai format `(@scope/)?name` |
| `PLUGIN_NOT_FOUND` | Plugin tidak ada di registry — gunakan `search` |
| `EXTERNAL_CONFIRMATION_REQUIRED` | Plugin eksternal butuh `--allow-external --yes` |
| `INSTALL_COMMAND_FAILED` | Gagal menjalankan `npm install` |
| `INSTALL_FAILED` | `npm install` exit non-zero |

## Registry resmi

| Plugin | Deskripsi |
|--------|-----------|
| `@tailwind-styled/plugin-animation` | Animation presets, keyframes, spring physics |
| `@tailwind-styled/plugin-typography` | Prose dan typography utilities |
| `@tailwind-styled/plugin-forms` | Form input styling helpers |
| `@tailwind-styled/plugin-container-queries` | @container query utilities |

## Known limitations

- ✅ Marketplace publishing Sprint 9 done — `tw plugin marketplace publish/search/featured/info/unpublish`
- ✅ Sprint 10+ done: `tw plugin verify <n>` — sha256 integrity check via `verifyIntegrity()`
- ✅ Sprint 10+ done: `tw plugin update-check` — version diff via `checkForUpdate()` + `checkAllUpdates()`

Lihat juga: [docs/ops/plugin-registry-track-b-issues.md](ops/plugin-registry-track-b-issues.md)

## Publish Plugin ke Registry

Untuk mempublish plugin ke registry resmi:

1. **Buat package** dengan keyword `tailwind-styled-plugin` di `package.json`:
   ```json
   {
     "name": "@your-scope/plugin-name",
     "keywords": ["tailwind-styled-plugin"],
     "tailwindStyled": {
       "manifest": {
         "name": "@your-scope/plugin-name",
         "version": "1.0.0",
         "description": "Deskripsi plugin",
         "entrypoint": "./dist/index.js"
       }
     }
   }
   ```

2. **Implementasikan** kontrak `TwPlugin` dari `@tailwind-styled/plugin-api`

3. **Publish ke npm** (`npm publish`)

4. **Request review** — buka issue di repo `tailwind-styled-v4` dengan label `plugin-submission`

## Status Track B

Fitur berikut masih pending (belum dikerjakan):

| Fitur | Status |
|---|---|
| Integration tests | ❌ Belum |
| SLO benchmark workflow | ❌ Belum |
| Security hardening | ❌ Belum |
| `--allowlist` flag | ❌ Belum |
| Docs finalisasi | 🔄 Ini file ini |

Lihat `docs/ops/plugin-registry-track-b-issues.md` untuk template issue yang siap dikerjakan.