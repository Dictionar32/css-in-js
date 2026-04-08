# API Reference — `@tailwind-styled/testing`

> Dokumentasi lengkap ada di [`packages/testing/README.md`](../../packages/testing/README.md).

Custom matchers dan helpers untuk Vitest/Jest.

## Matchers

```ts
import { tailwindMatchers, tailwindMatchersWithMetrics } from "@tailwind-styled/testing"
expect.extend(tailwindMatchers)
expect.extend(tailwindMatchersWithMetrics)
```

| Matcher | Keterangan |
|---|---|
| `toHaveClass(cls)` | Cek satu class ada di element |
| `toHaveClasses(cls[])` | Cek beberapa class sekaligus |
| `toNotHaveClass(cls)` | Assert class tidak ada |
| `toHaveEngineMetrics(opts)` | Validasi engine metrics (buildTimeMs, cacheHitRate, dll.) |

## Helpers

| Fungsi | Keterangan |
|---|---|
| `expectClasses(el, cls[])` | Shorthand assertion tanpa extend |
| `getVariantClass(component, variant, value)` | Ambil class untuk nilai variant tertentu |
| `expectEngineMetrics(metrics, opts)` | Assertion langsung pada engine metrics |

## Contoh Penggunaan

```ts
import { expectClasses } from "@tailwind-styled/testing"

expectClasses(
  <Button variant="primary">Click me</Button>,
  ["bg-blue-500", "text-white"]
)
