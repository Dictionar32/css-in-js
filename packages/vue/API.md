# API Reference — `@tailwind-styled/vue`

Vue 3 adapter untuk `tailwind-styled` — styled components dengan variants yang type-safe.

## Instalasi

```bash
npm install @tailwind-styled/vue vue tailwind-merge
```

---

## API

### `tw(tag, config)` — Create Styled Component

```vue
<script setup lang="ts">
import { tw } from "@tailwind-styled/vue"

const Button = tw("button", {
  base: "px-4 py-2 rounded font-medium transition-colors",
  variants: {
    intent: {
      primary: "bg-blue-500 text-white hover:bg-blue-600",
      danger:  "bg-red-500 text-white hover:bg-red-600",
      ghost:   "bg-transparent border border-gray-300",
    },
    size: {
      sm: "text-sm px-3 py-1.5",
      md: "text-base px-4 py-2",
      lg: "text-lg px-6 py-3",
    },
  },
  defaultVariants: { intent: "primary", size: "md" },
})
</script>

<template>
  <Button intent="primary" size="lg" @click="handleClick">
    Submit
  </Button>
</template>
```

---

### `cv(config)` — Class Variant (headless)

Tanpa element HTML — untuk komponen dengan template kustom:

```ts
import { cv } from "@tailwind-styled/vue"

const alertStyles = cv({
  base: "rounded-lg border p-4 text-sm",
  variants: {
    type: {
      info:    "border-blue-200 bg-blue-50 text-blue-800",
      success: "border-green-200 bg-green-50 text-green-800",
      error:   "border-red-200 bg-red-50 text-red-800",
    },
  },
})
```

```vue
<template>
  <div :class="alertStyles({ type })">
    <slot />
  </div>
</template>
```

---

### `cx(...classes)` — Conditional Merge

```ts
import { cx } from "@tailwind-styled/vue"

const className = cx(
  "px-4 py-2 rounded",
  props.active && "bg-blue-600 text-white",
  props.disabled && "opacity-50 cursor-not-allowed"
)
```

---

### `useVariants(component)` — Composable

Ambil variant definition dari komponen untuk dipakai di composable:

```ts
import { useVariants } from "@tailwind-styled/vue"

const { intent, size } = useVariants(Button)
// intent.options → ["primary", "danger", "ghost"]
// size.default   → "md"
```

---

## TypeScript

Semua variant diinfer dari config — typo pada nama variant langsung error:

```ts
// TS error: Type '"xlarge"' is not assignable to type '"sm" | "md" | "lg"'
<Button size="xlarge" />
```

---

## Kompatibilitas

- Vue 3.x (Composition API)
- Tidak mendukung Vue 2

## Peer Dependencies

- `vue` ≥ 3.0
- `tailwind-merge` 2.x atau 3.x

---

## Lisensi

MIT