# Core API

The `tailwind-styled-v4` root package provides the primary styled component API.

## `tw` — Tagged Template & Object API

Create styled components with Tailwind classes.

```typescript
import { tw } from "tailwind-styled-v4"

// Tagged template literal — for simple static classes
const Button = tw.button`px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700`

// Object config — for variants, compound variants, state
const Card = tw.div({
  base: "rounded-lg shadow-md overflow-hidden",
  variants: {
    size: {
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
    },
    variant: {
      default: "bg-white",
      elevated: "bg-white shadow-xl",
    },
  },
  defaultVariants: { size: "md", variant: "default" },
})

// Usage
<Card size="lg" variant="elevated">Content</Card>
```

---

## `cv()` — Class Variant Function

Framework-agnostic class resolver. Returns a function that accepts props and returns a class string.

```typescript
import { cv } from "tailwind-styled-v4"

const buttonCv = cv({
  base: "px-4 py-2 rounded font-medium",
  variants: {
    intent: {
      primary: "bg-blue-500 text-white hover:bg-blue-600",
      danger: "bg-red-500 text-white hover:bg-red-600",
      ghost: "border border-gray-300 hover:bg-gray-50",
    },
    size: { sm: "h-8 text-sm", md: "h-10 text-base", lg: "h-12 text-lg" },
    disabled: { true: "opacity-50 cursor-not-allowed" },
  },
  compoundVariants: [
    { intent: "primary", size: "lg", class: "px-8 font-semibold" },
  ],
  defaultVariants: { intent: "primary", size: "md" },
})

// With TypeScript — props are fully typed based on variant keys
const cls = buttonCv({ intent: "danger", size: "lg" })
// → "px-4 py-2 rounded font-medium bg-red-500 text-white hover:bg-red-600 h-12 text-lg px-8 font-semibold"
```

---

## `cx()` — Class Merger

Simple class concatenation with falsy filtering.

```typescript
import { cx } from "tailwind-styled-v4"

const cls = cx(
  "flex items-center",
  isActive && "bg-blue-500",
  isDisabled && "opacity-50 cursor-not-allowed",
  extraClass
)
```

---

## `cxm()` — Class Merger with Conflict Resolution

Like `cx()` but uses `tailwind-merge` to resolve conflicting Tailwind classes.

```typescript
import { cxm } from "tailwind-styled-v4"

// px-4 is overridden by px-8
const cls = cxm("px-4 py-2 rounded", "px-8")
// → "py-2 rounded px-8"  (px-4 removed, px-8 wins)
```

---

## `tw.server.*` — Server Component API

For React Server Components, use `tw.server.*` to generate static classes that are safe for SSR.

```typescript
import { tw } from "tailwind-styled-v4"

// RSC-safe — no client-side JS
const ServerCard = tw.server.div`bg-white rounded-lg shadow p-6`
```

---

## `extend()` — Extend Components

Add classes to an existing component.

```typescript
// Template literal — add extra classes
const PrimaryButton = Button.extend`bg-blue-500 text-white`

// Object config — add classes AND extend variants in one call
const BigDangerButton = Button.extend({
  classes: "text-lg px-8",
  variants: {
    loading: { true: "opacity-50 animate-pulse", false: "" },
  },
  defaultVariants: { loading: "false" },
})
```

---

## `withVariants()` — Add Variant Layer

Add new variants to an existing component.

```typescript
const LoadingButton = Button.withVariants({
  variants: { loading: { true: "opacity-75 cursor-wait" } },
  defaultVariants: { loading: "false" },
})
```

---

## Live Token API

Dynamic design token system for runtime theme switching.

```typescript
import { liveToken, setToken, getToken, tokenRef, tokenVar } from "tailwind-styled-v4"

// Register tokens
const tokens = liveToken({
  primary: "#3b82f6",
  secondary: "#6366f1",
})

// Update at runtime (triggers re-render)
setToken("primary", "#ef4444")

// Reference in CSS
const cssVar = tokenRef("primary")  // → "var(--primary)"
```

---

## Container Query API

```typescript
import { tw } from "tailwind-styled-v4"

const ResponsiveCard = tw.div({
  base: "bg-white rounded-lg p-4",
  container: {
    "@sm": "grid grid-cols-2",
    "@md": "grid grid-cols-3",
  },
  containerName: "card",
})
```

---

## State Engine API

Reactive state classes that change based on data attributes.

> ⚠️ **Note**: State API injects styles at runtime, which may conflict with strict CSP policies.
> For production use, prefer static variants or container queries.

```typescript
const StatefulButton = tw.button({
  base: "px-4 py-2",
  state: {
    active: { true: "bg-blue-600 ring-2 ring-blue-300" },
    loading: { true: "opacity-75 cursor-wait" },
  },
})
```
