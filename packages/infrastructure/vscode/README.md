# `tailwind-styled-vscode`

VS Code extension untuk `tailwind-styled-v4` — trace, doctor, why commands, autocomplete, hover, dan LSP providers.

---

## Instalasi

Build dari source (belum dipublish ke VS Code Marketplace):

```bash
cd packages/vscode
npm run build
# Install .vsix via VS Code: Extensions → ... → Install from VSIX
```

---

## Fitur

### Commands (Command Palette)

| Command | Keterangan |
|---|---|
| `Tailwind Styled: Trace Class` | Trace satu class — lihat di file mana class ini dipakai |
| `Tailwind Styled: Why` | Jelaskan mengapa class tertentu ada di output CSS |
| `Tailwind Styled: Doctor` | Diagnosa masalah setup workspace |

### Language Providers

| Provider | Keterangan |
|---|---|
| **Hover** | Hover di atas class name → lihat CSS properties yang dihasilkan |
| **Autocomplete** | Ketik di `className="..."` → suggest class Tailwind yang valid |
| **Inline Decoration** | Warna swatch inline di samping class warna (`bg-blue-500`) |
| **Go to Definition** | Klik class → lompat ke semua file yang mendefinisikan class yang sama |
| **Rename Symbol** | Rename class di satu tempat → update semua referensi |
| **Code Actions** | Quick-fix suggestions untuk class yang konflik atau deprecated |

### Bahasa yang Didukung

`javascript`, `javascriptreact`, `typescript`, `typescriptreact`, `vue`, `svelte`

---

## Konfigurasi

```json
// .vscode/settings.json
{
  "tailwindStyled.enableTraceHover": true,
  "tailwindStyled.enableAutocomplete": true
}
```

| Setting | Default | Keterangan |
|---|---|---|
| `tailwindStyled.enableTraceHover` | `true` | Aktifkan hover provider |
| `tailwindStyled.enableAutocomplete` | `true` | Aktifkan autocomplete provider |

---

## Struktur Kode

```
src/
├── extension.ts              # Entry point — activate(), register semua providers
├── constants.ts              # Konstanta (glob patterns, language selectors)
├── commands/
│   ├── doctorCommand.ts      # tw doctor via EngineService
│   ├── traceCommand.ts       # tw trace via EngineService
│   └── whyCommand.ts         # tw why via EngineService
├── providers/
│   ├── classToken.ts         # Parse class token di posisi cursor
│   ├── classTokenCore.ts     # Core token extraction logic
│   ├── completionProvider.ts # Autocomplete class names
│   ├── hoverProvider.ts      # Hover → CSS properties
│   ├── inlineDecorationProvider.ts  # Warna swatch inline
│   ├── definitionProvider.ts # Go to Definition
│   ├── renameProvider.ts     # Rename Symbol
│   └── codeActionProvider.ts # Code Actions (quick-fix)
├── services/
│   └── engineService.ts      # Bridge ke @tailwind-styled/engine via CLI
├── types/                    # TypeScript types
└── utils/                    # Helpers
```

---

## Known Limitations

- gRPC cluster protocol belum ada (Sprint 9+)
- `settings.json` config VS Code belum penuh — hanya `enableTraceHover` dan `enableAutocomplete`
- Extension belum dipublish ke VS Code Marketplace
- VS Code versi minimum: 1.85+
- Lihat: `docs/known-limitations/tw-vscode.md`

---

## Development

```bash
# Install
cd packages/vscode && npm install

# Build
npm run build

# Test
npm test

# Watch mode
npm run dev
```

Extension menggunakan `postbuild` script untuk menyalin `scripts/v48/lsp.mjs` ke `dist/lsp.mjs` — LSP server dibutuhkan untuk provider yang bergantung pada analisis workspace.