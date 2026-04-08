# `@tailwind-styled/runtime`

Runtime helpers ringan untuk komponen `tailwind-styled-v5` yang di-compile — sub-components, compound components, dan conditional props. Live token engine ada di `@tailwind-styled/theme`.

---

## Instalasi

Package ini biasanya sudah terinstall otomatis sebagai dependency `tailwind-styled-v4`. Tidak perlu install manual kecuali pakai sub-components API secara eksplisit.

---

## API

### Sub-components

```tsx
import { createStyledComponent } from "@tailwind-styled/runtime"

// Output dari compiler — tidak perlu ditulis manual
const Card = createStyledComponent(
  "div",
  "flex flex-col p-4 rounded-xl bg-white shadow",
  {
    Header: { tag: "div", class: "Card_Header_abc123" },
    Body:   { tag: "div", class: "Card_Body_def456" },
    Footer: { tag: "div", class: "Card_Footer_ghi789" },
  }
)

// Usage
<Card>
  <Card.Header>Title</Card.Header>
  <Card.Body>Content</Card.Body>
</Card>
```

### Conditional Props

```tsx
const Button = createStyledComponent(
  "button",
  "px-4 py-2 rounded font-medium",
  {},
  {
    fullWidth: "w-full",
    large: "text-lg px-6 py-3",
    disabled: "opacity-50 cursor-not-allowed",
  }
)

<Button fullWidth large>Click me</Button>
// → class="px-4 py-2 rounded font-medium w-full text-lg px-6 py-3"
```

### Live Tokens (re-export dari `@tailwind-styled/theme`)

```tsx
// Semua token API tersedia via runtime
import { liveToken, setToken, tokenVar } from "@tailwind-styled/runtime"

const tokens = liveToken({ primary: "#3b82f6", radius: "0.5rem" })
setToken("primary", "#ef4444")
```

---

## Tipe Utama

```ts
// Definisi satu sub-component
interface SubComponentDef {
  tag?: string   // HTML tag, default "span"
  class: string  // CSS class yang di-scope oleh compiler
}

// Map semua sub-components
type SubComponentMap = Record<string, SubComponentDef>

// Compound component result type
type StyledComponent<S extends SubComponentMap> =
  React.ForwardRefExoticComponent<...> & { [K in keyof S]: React.ForwardRefExoticComponent<...> }

// Props kondisional: prop name → class yang ditambahkan saat prop truthy
type ConditionalProps = Record<string, string>
```

---

## File Utama

| File | Keterangan |
|---|---|
| `src/index.ts` | Entry point — `createStyledComponent`, re-export token API |
| `src/schema.ts` | Zod schema untuk validasi config runtime |
| `src/schemas.ts` | Schema tambahan — `SubComponentDefSchema`, `ConditionalPropsSchema` |
| `src/types/` | Type declarations |

---

## Catatan

- Package ini hanya berisi runtime yang diperlukan oleh **output compiler** — bukan untuk ditulis langsung oleh developer
- Live token engine (`liveToken`, `setToken`, dll.) adalah re-export dari `@tailwind-styled/theme`
- Untuk styling komponen, gunakan API `tw` dari `tailwind-styled-v4` langsung