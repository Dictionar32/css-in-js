# `@tailwind-styled/testing`

Testing utilities dan custom matchers untuk komponen `tailwind-styled-v4` — integrasi dengan Vitest dan Jest.

---

## Setup

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    setupFiles: ["@tailwind-styled/testing/setup"],
  },
})
```

Atau extend matchers secara manual:

```ts
// test/setup.ts
import { expect } from "vitest"
import { tailwindMatchers, tailwindMatchersWithMetrics } from "@tailwind-styled/testing"

expect.extend(tailwindMatchers)
expect.extend(tailwindMatchersWithMetrics)
```

---

## Custom Matchers

### `toHaveClass(className)`

Cek satu class ada di element:

```ts
const { container } = render(<Button intent="primary" />)
expect(container.firstChild).toHaveClass("bg-blue-600")
expect(container.firstChild).not.toHaveClass("bg-red-600")
```

### `toHaveClasses(classNames[])`

Cek beberapa class sekaligus:

```ts
expect(button).toHaveClasses(["px-4", "py-2", "rounded-lg", "font-medium"])
```

### `toNotHaveClass(className)`

Assert class tidak ada:

```ts
expect(disabledButton).toNotHaveClass("cursor-pointer")
```

---

## Helper Functions

### `expectClasses(element, classes[])`

Shorthand assertion tanpa extend matcher:

```ts
import { expectClasses } from "@tailwind-styled/testing"

const { container } = render(<Button size="lg" />)
expectClasses(container.firstChild, ["text-lg", "px-6", "py-3"])
```

### `getVariantClass(component, variant, value)`

Ambil class yang diassign untuk variant tertentu — berguna untuk snapshot test:

```ts
import { getVariantClass } from "@tailwind-styled/testing"

const cls = getVariantClass(Button, "intent", "danger")
// → "bg-red-600 text-white hover:bg-red-700"
```

### Engine Metrics Matchers

```ts
import {
  expectEngineMetrics,
  tailwindMatchersWithMetrics,
} from "@tailwind-styled/testing"

// Assertion langsung
expectEngineMetrics(metrics, {
  minFiles: 10,
  maxBuildTimeMs: 500,
  cacheHitRateMin: 0.9,
})

// Via expect.extend
expect.extend(tailwindMatchersWithMetrics)
expect(metrics).toHaveEngineMetrics({ minFiles: 5 })
```

---

## TypeScript

Untuk type support matcher, tambahkan declaration di `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["@tailwind-styled/testing/matchers"]
  }
}
```

Atau import di file setup:

```ts
import type {} from "@tailwind-styled/testing/matchers"
```

---

## File Utama

| File | Keterangan |
|---|---|
| `src/index.ts` | Semua matchers, helpers, dan `expectEngineMetrics` |

---

## Contoh Lengkap

```ts
import { describe, test, expect } from "vitest"
import { render } from "@testing-library/react"
import { tailwindMatchers, expectClasses } from "@tailwind-styled/testing"

expect.extend(tailwindMatchers)

const Button = tw.button({
  base: "inline-flex items-center rounded-lg font-medium",
  variants: {
    intent: {
      primary: "bg-blue-600 text-white hover:bg-blue-700",
      danger:  "bg-red-600 text-white hover:bg-red-700",
    },
    size: {
      sm: "text-sm px-3 py-1.5",
      lg: "text-lg px-6 py-3",
    },
  },
})

describe("Button", () => {
  test("primary variant memiliki class yang benar", () => {
    const { container } = render(<Button intent="primary" />)
    expect(container.firstChild).toHaveClasses(["bg-blue-600", "text-white"])
    expect(container.firstChild).toNotHaveClass("bg-red-600")
  })

  test("size lg memiliki padding besar", () => {
    const { container } = render(<Button size="lg" />)
    expectClasses(container.firstChild, ["text-lg", "px-6", "py-3"])
  })
})
```