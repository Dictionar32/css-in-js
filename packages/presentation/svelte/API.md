# API Reference — `@tailwind-styled/svelte`

Svelte 4/5 adapter untuk `tailwind-styled` — class variants, utility merger, dan styled action.

## Instalasi

```bash
npm install @tailwind-styled/svelte tailwind-merge
```

> `tailwind-merge` adalah peer dependency — pastikan versi 2.x atau 3.x.

---

## API

### `cv(config)` — Class Variant Resolver

Definisikan komponen dengan base class dan variants berdasarkan props:

```svelte
<script lang="ts">
  import { cv } from "@tailwind-styled/svelte"

  const button = cv({
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

  export let intent: "primary" | "danger" | "ghost" = "primary"
  export let size: "sm" | "md" | "lg" = "md"
</script>

<button class={button({ intent, size })} on:click>
  <slot />
</button>
```

---

### `cx(...classes)` — Conditional Class Merge

```svelte
<script>
  import { cx } from "@tailwind-styled/svelte"

  export let active = false
  export let disabled = false

  $: className = cx(
    "px-4 py-2 rounded",
    active && "bg-blue-600 text-white",
    disabled && "opacity-50 cursor-not-allowed"
  )
</script>

<button class={className} {disabled}>
  <slot />
</button>
```

---

### `tw(config)` — Styled Component Factory

```svelte
<script>
  import { tw } from "@tailwind-styled/svelte"

  const Card = tw({
    base: "rounded-xl bg-white shadow p-6",
    variants: {
      elevated: { true: "shadow-lg", false: "shadow-sm" },
    },
  })

  export let elevated = false
</script>

<div class={Card({ elevated })}>
  <slot />
</div>
```

---

### `styled` action

Svelte action untuk apply class dinamis tanpa membuat wrapper component:

```svelte
<script>
  import { styled } from "@tailwind-styled/svelte"
</script>

<div use:styled={{ base: "flex flex-col gap-4", active: isActive }}>
  Content
</div>
```

---

## TypeScript

Package ini fully typed — `cv()` dan `tw()` menginfer variant types dari config:

```ts
const button = cv({
  variants: { intent: { primary: "...", danger: "..." } }
})

button({ intent: "invalid" })  // TS error: Type '"invalid"' is not assignable
```

---

## Kompatibilitas

| Svelte | Support |
|---|---|
| Svelte 4 | ✅ |
| Svelte 5 (runes) | ✅ |

---

## Peer Dependencies

- `svelte` ≥ 4.0
- `tailwind-merge` 2.x atau 3.x