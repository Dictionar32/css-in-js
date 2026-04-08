# `@tailwind-styled/theme`

Multi-theme engine dan Live Token Engine untuk `tailwind-styled-v5` — theme CSS variables yang type-safe, switching tema instan, dan token runtime yang reaktif.

---

## Quick Start

```ts
import {
  defineThemeContract,
  createTheme,
  liveToken,
  setToken,
  tokenVar,
} from "@tailwind-styled/theme"

// 1. Definisi kontrak (shape token yang wajib ada di semua tema)
const contract = defineThemeContract({
  colors: { bg: "", fg: "", primary: "", muted: "" },
  font:   { sans: "", mono: "" },
})

// 2. Buat tema — TypeScript error jika ada token yang kurang
const lightTheme = createTheme(contract, "light", {
  colors: { bg: "#ffffff", fg: "#09090b", primary: "#3b82f6", muted: "#71717a" },
  font:   { sans: "InterVariable, sans-serif", mono: "JetBrains Mono, monospace" },
})

const darkTheme = createTheme(contract, "dark", {
  colors: { bg: "#09090b", fg: "#fafafa", primary: "#60a5fa", muted: "#a1a1aa" },
  font:   { sans: "InterVariable, sans-serif", mono: "JetBrains Mono, monospace" },
})

// 3. Inject CSS variables ke layout
// lightTheme.css → ":root { --colors-bg: #ffffff; --colors-fg: #09090b; ... }"
// darkTheme.css  → "[data-theme='dark'] { --colors-bg: #09090b; ... }"

// 4. Pakai di komponen — CSS variables, bukan hardcode
const Card = tw.div`bg-[var(--colors-bg)] text-[var(--colors-fg)] p-6`

// 5. Switch tema di runtime
document.documentElement.setAttribute("data-theme", "dark")
```

---

## Live Token Engine

Token yang bisa diubah saat runtime — cocok untuk white-label atau user preference:

```ts
import { liveToken, setToken, getToken, subscribeTokens, tokenVar } from "@tailwind-styled/theme"

// Buat token set
const tokens = liveToken({
  primary: "#3b82f6",
  secondary: "#64748b",
  radius: "0.5rem",
})
// Auto-generate CSS variables: --tw-primary, --tw-secondary, --tw-radius

// Ubah token runtime — langsung update CSS variable di document root
setToken("primary", "#ef4444")

// Baca nilai token
getToken("primary") // → "#ef4444"

// Subscribe perubahan
subscribeTokens((changed) => {
  console.log("Token berubah:", changed)
})

// Referensi token sebagai CSS var string
tokenVar("primary") // → "var(--tw-primary)"

// Pakai di komponen
const Button = tw.button`bg-[${tokenVar("primary")}] text-white px-4 py-2`
```

---

## API Multi-Theme

### `defineThemeContract(shape)`

Definisi shape token — semua tema harus mengimplementasi semua field:

```ts
const contract = defineThemeContract({
  colors: { bg: "", fg: "", primary: "" },
  spacing: { base: "" },
})
```

### `createTheme(contract, name, tokens)`

Buat satu tema dari kontrak. TypeScript error jika token tidak lengkap:

```ts
const brandTheme = createTheme(contract, "brand", {
  colors: { bg: "#fff7ed", fg: "#1c1917", primary: "#f97316" },
  spacing: { base: "4px" },
})

brandTheme.name  // → "brand"
brandTheme.css   // → "string CSS variables"
brandTheme.vars  // → Record<string, string> semua CSS var
```

### `applyTokenSet(tokenSet, target?)`

Apply satu token set ke element (default: `document.documentElement`):

```ts
applyTokenSet(lightTheme.vars)
applyTokenSet(darkTheme.vars, document.querySelector("#sidebar"))
```

### `createUseTokens(tokens)`

React hook untuk subscribe token changes:

```ts
const useTokens = createUseTokens(tokens)

function ThemePreview() {
  const { primary, secondary } = useTokens()
  return <div style={{ background: primary }}>{secondary}</div>
}
```

---

## Integrasi dengan Rust Engine

`@tailwind-styled/native` menyediakan fungsi `compileTheme` untuk pre-compile token map menjadi CSS di build time:

```ts
// Di compiler/build time — bukan di runtime
import { native } from "@tailwind-styled/native"

const compiled = native.compileTheme(
  JSON.stringify({ colors: { primary: "#3b82f6" } }),
  "light",
  "tw"  // prefix CSS var → --tw-colors-primary
)
// compiled.css → ":root { --tw-colors-primary: #3b82f6; }"
```

---

## File Utama

| File | Keterangan |
|---|---|
| `src/index.ts` | Entry point — re-export semua API theme + live token |
| `src/liveTokenEngine.ts` | Core Live Token Engine — state, subscribe, CSS sync |
| `src/liveTokens.ts` | Re-export liveToken API (subpath `theme/live-tokens`) |
| `src/native-bridge.ts` | Bridge ke Rust `compile_theme` + `extract_css_vars` |
| `src/schema.ts` | Zod schema theme contract |
| `src/schemas.ts` | Schema tambahan |
| `src/types/` | Type declarations |

---

## Subpath Exports

```ts
// Full API
import { ... } from "@tailwind-styled/theme"

// Hanya Live Token Engine (tree-shakeable)
import { liveToken, setToken } from "@tailwind-styled/theme/live-tokens"
```

---

## Dependensi

- `@tailwind-styled/native` (opsional) — `compileTheme` dan `extractCssVars` Rust
- `@tailwind-styled/runtime-css` — inject CSS variable changes ke DOM