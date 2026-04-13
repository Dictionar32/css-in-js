# CLI Reference

The `tw` CLI is the primary interface for tailwind-styled tooling.

## Installation

```bash
npm install -g tailwind-styled-v4
# or use npx
npx tw <command>
```

---

## Core Commands

### `tw scan [dir] [--save] [--json]`

Scan a workspace for Tailwind class usage.

```bash
tw scan ./src
tw scan ./src --save   # also writes .tailwind-styled/scan-cache.json
tw scan ./src --json   # JSON output
```

`--save` generates `.tailwind-styled/scan-cache.json` which is required by the VS Code extension for hover, completion, and `why` commands.

---

### `tw build [dir] [--out=<path>] [--json]`

Build CSS from scanned classes.

```bash
tw build ./src
tw build ./src --out=dist/tailwind.css
```

---

### `tw watch [dir]`

Watch mode — rebuild on file changes.

```bash
tw watch ./src
```

---

### `tw trace <class> [--cwd=<path>] [--format=text|json|mermaid]`

Trace how a Tailwind class resolves — shows cascade, overrides, and final styles.

```bash
tw trace flex
tw trace hover:bg-blue-500 --format=json
tw trace --target ./src/Button.tsx
```

---

### `tw why <class> [--json]`

Explain why a class exists in the bundle — shows usage in files and bundle impact.

```bash
tw why flex
tw why text-xl --json
```

---

### `tw doctor [--include=workspace,tailwind,analysis] [--json]`

Run health checks on your project setup.

```bash
tw doctor
tw doctor --include workspace,tailwind
tw doctor --json
```

---

### `tw preflight [--fix] [--json]`

Check environment prerequisites before first use.

```bash
tw preflight
tw preflight --fix   # auto-fix where possible
```

Checks: Node version, native binary, tailwind config, globals.css, package.json.

---

## Setup Commands

### `tw init [--template=next|vite|vue|svelte|react] [--force]`

Initialize tailwind-styled in a new or existing project.

```bash
tw init
tw init --template next
tw init --force   # overwrite existing config
```

---

### `tw create <name> [--template=<type>]`

Scaffold a new project.

```bash
tw create my-app
tw create my-app --template next-app
tw create my-app --template vite-react
```

**Templates:** `next-app`, `vite-react`, `vite-vue`, `vite-svelte`, `simple`

---

### `tw migrate [--dry-run] [--json]`

Migrate from older versions or `tailwind-styled-components`.

```bash
tw migrate
tw migrate --dry-run   # preview changes without writing
```

---

## Analysis Commands

### `tw analyze [dir] [--top=N] [--json]`

Analyze class usage frequency and dead code.

```bash
tw analyze ./src
tw analyze ./src --top=30 --json
```

---

### `tw stats [dir] [--json]`

Show quick stats about class usage.

```bash
tw stats
tw stats --json
```

---

## Plugin Commands

### `tw plugin search <keyword> [--json]`

Search for plugins in the registry.

### `tw plugin list [--json]`

List all available plugins.

### `tw plugin install <name> [--dry-run]`

Install a plugin.

### `tw plugin info <name> [--json]`

Show plugin details.

### `tw plugin verify <name> [--json]`

Verify plugin integrity via SHA-256.

### `tw plugin update-check [--json]`

Check for plugin updates.

---

## DevOps Commands

### `tw split [root] [outDir]`

Split CSS per route for Next.js App Router.

```bash
tw split src/ artifacts/route-css
```

> **Note:** CSS generation covers only atomic classes in the built-in map.
> For full CSS, pipe output through `tw shake`. [prototype]

---

### `tw critical <html-file> <css-file> [--inline] [--out=file]`

Extract critical CSS for above-the-fold rendering. [prototype]

```bash
tw critical dist/index.html dist/tailwind.css --out=dist/critical.css
```

---

## Platform Commands (Prototype)

> These commands are functional prototypes. Scripts are in `scripts/v45–v50/`.

| Command | Description | Script |
|---|---|---|
| `tw studio` | Launch web studio UI | `scripts/v45/studio.ts` |
| `tw ai "prompt"` | Generate component with AI | `scripts/v45/ai.ts` |
| `tw sync <init\|pull\|push>` | Sync design tokens (DTCG format) | `scripts/v45/sync.ts` |
| `tw audit` | Security & a11y audit | `scripts/v45/audit.ts` |
| `tw deploy [name]` | Publish to tw registry | `scripts/v45/registry.ts` |
| `tw cache <status\|warm\|clear>` | Manage build cache | `scripts/v50/cache.ts` |
| `tw metrics [port]` | Start Prometheus metrics server | `scripts/v50/metrics.ts` |
| `tw cluster build` | Distributed build | `scripts/v50/cluster.ts` |
| `tw adopt <feature>` | Incremental feature adoption | `scripts/v50/adopt.ts` |

---

## Global Flags

| Flag | Description |
|---|---|
| `--json` | Machine-readable JSON output |
| `--debug` | Enable debug logging |
| `--cwd <path>` | Working directory override |
| `--version` | Show version |
| `--help` | Show help |

---

## Environment Variables

| Variable | Description |
|---|---|
| `TWS_DEBUG=1` | Enable verbose debug logging |
| `TWS_DISABLE_NATIVE=1` | Disable Rust native bindings (fallback mode) |
| `TWS_SCAN_SAVE=1` | Auto-save scan cache on every `tw scan` |
| `TW_NATIVE_PATH` | Override native binding path |
| `TW_PLUGIN_NPM_BIN` | Override npm binary for plugin install |
