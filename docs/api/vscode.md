# VS Code Extension API

The `tailwind-styled-vscode` extension provides IDE integration for tailwind-styled projects.

## Setup

1. Install the extension from VS Code Marketplace
2. Run `tw scan --save` to generate the scan cache:
   ```bash
   npx tw scan --save
   ```
3. The extension reads `.tailwind-styled/scan-cache.json` for hover and completion data.

> **Auto-scan**: The extension automatically runs `tw scan --save` in the background on first activation if no cache file is found.

---

## Commands

Access via Command Palette (`Ctrl+Shift+P`):

### `tailwindStyled.trace` — Trace Class
Show how a Tailwind class resolves — cascade, overrides, final styles.

```
tailwindStyled.trace
```

### `tailwindStyled.why` — Why Is Class Used?
Explain bundle impact and file usage for a class.

### `tailwindStyled.doctor` — Run Health Checks
Diagnose project configuration issues.

### `tailwindStyled.analyzeWorkspace`
Scan workspace and show class usage summary.

### `tailwindStyled.installPlugin`
Install a plugin from the registry interactively.

### `tailwindStyled.createComponent`
Create a new styled component:
- **AI-generated** — requires `ANTHROPIC_API_KEY` env var
- **Snippet** — interactive template with tabstops

### `tailwindStyled.splitRoutesCss`
Run route-based CSS splitting and show manifest.

---

## Settings

```json
{
  "tailwindStyled.enableTraceHover": true,
  "tailwindStyled.enableAutocomplete": true,
  "tailwindStyled.enableInlineDecorations": false,
  "tailwindStyled.lsp.enable": false,
  "tailwindStyled.lsp.port": 6009
}
```

| Setting | Default | Description |
|---|---|---|
| `enableTraceHover` | `true` | Show class info on hover |
| `enableAutocomplete` | `true` | Class name autocomplete |
| `enableInlineDecorations` | `false` | Show decorations for found classes |
| `lsp.enable` | `false` | Enable LSP server (experimental) |
| `lsp.port` | `6009` | LSP server port |

---

## Hover Provider

When `enableTraceHover` is enabled, hovering over a Tailwind class shows:

- Final resolved styles (`display: flex`)
- Variant information (`hover:`, `md:`, etc.)
- Conflicts with other classes
- File location where class is defined

**Requires**: `.tailwind-styled/scan-cache.json` (run `tw scan --save`)

---

## Completion Provider

When `enableAutocomplete` is enabled, typing in `className="..."` or `class="..."` shows:

- Classes discovered in your workspace (from scan cache)
- Fallback: common Tailwind prefixes (`flex`, `px-`, `bg-`, etc.)

**Requires**: `.tailwind-styled/scan-cache.json` for workspace-specific completions.

---

## LSP Integration

The LSP server (`tw lsp`) provides additional IDE features when enabled:

```json
{
  "tailwindStyled.lsp.enable": true
}
```

Or add as a VS Code task (`.vscode/tasks.json`):

```json
{
  "version": "2.0.0",
  "tasks": [{
    "label": "tw lsp",
    "type": "shell",
    "command": "npx tw lsp --stdio",
    "isBackground": true,
    "problemMatcher": []
  }]
}
```

**Available** (with `vscode-languageserver` installed):
- Completion — Tailwind class autocomplete
- Hover — class info on hover
- Diagnostics — unknown class warnings

**Planned** (Sprint 10+):
- Go to Definition for `tw()` components
- Rename Symbol (refactor class names)
- Code Actions (extract to component)

---

## Troubleshooting

**Hover/completion not working:**
```bash
# Generate scan cache
npx tw scan --save

# Verify cache exists
ls .tailwind-styled/scan-cache.json
```

**Extension not activating:**
```bash
# Check extension is installed
code --list-extensions | grep tailwind-styled

# Run doctor
npx tw doctor
```
