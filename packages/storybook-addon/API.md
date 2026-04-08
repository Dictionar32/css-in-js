# API Reference — `@tailwind-styled/storybook-addon`

Storybook helpers untuk preview variant komponen `tailwind-styled-v4` — auto-generate argTypes, decorator, dan variant story template.

## Setup

```ts
// .storybook/preview.ts
import { withTailwindStyled } from "@tailwind-styled/storybook-addon"

export const decorators = [withTailwindStyled]
```

---

## Decorator

### `withTailwindStyled`

Decorator yang membungkus setiap story dengan wrapper `div` berisi:
- Padding default (configurable)
- CSS dari `@tailwind-styled/runtime-css` sudah ter-inject

```ts
// .storybook/preview.ts
export const decorators = [withTailwindStyled]

// Dengan options
export const decorators = [
  withTailwindStyled.withOptions({ padding: "2rem", background: "#f8fafc" })
]
```

---

## ArgTypes Generator

### `generateArgTypes(component)`

Generate Storybook `argTypes` secara otomatis dari variant definition komponen:

```ts
// Button.stories.ts
import { generateArgTypes } from "@tailwind-styled/storybook-addon"
import { Button } from "./Button"

export default {
  title: "Components/Button",
  component: Button,
  argTypes: generateArgTypes(Button),
  // → {
  //     intent: { control: "select", options: ["primary", "secondary", "danger"] },
  //     size:   { control: "select", options: ["sm", "md", "lg"] },
  //   }
}
```

---

## Variant Story Template

### `createVariantStory(component, variant)`

Generate story yang menampilkan semua nilai satu variant sekaligus:

```ts
import { createVariantStory } from "@tailwind-styled/storybook-addon"

// Tampilkan semua intent variant Button
export const AllIntents = createVariantStory(Button, "intent")
// Render: primary, secondary, danger, ghost side-by-side
```

### `createVariantMatrix(component)`

Render matrix semua kombinasi variant:

```ts
export const FullMatrix = createVariantMatrix(Button)
// Render tabel: intent × size — semua kombinasi
```

---

## Contoh Story Lengkap

```ts
// Button.stories.ts
import type { Meta, StoryObj } from "@storybook/react"
import { generateArgTypes, createVariantStory, withTailwindStyled } from "@tailwind-styled/storybook-addon"
import { Button } from "./Button"

const meta: Meta<typeof Button> = {
  title: "Components/Button",
  component: Button,
  decorators: [withTailwindStyled],
  argTypes: generateArgTypes(Button),
}

export default meta

export const Primary: StoryObj = { args: { intent: "primary", size: "md" } }
export const AllIntents = createVariantStory(Button, "intent")
```