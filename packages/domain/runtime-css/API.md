# API Reference — `@tailwind-styled/runtime-css`

> Dokumentasi lengkap ada di [`packages/runtime-css/README.md`](../../packages/runtime-css/README.md).

## API

```ts
import {
  batchedInject,
  flushBatchedCss,
  syncInject,
  isInjected,
  getBatchedCssStats,
  resetBatchedCss,
} from "@tailwind-styled/runtime-css"

// Queue satu CSS rule untuk diinjeksi di RAF berikutnya
batchedInject(".tw-s-abc123[data-active=\"true\"]{opacity:0.5}")

// Force flush sekarang (biasanya tidak perlu)
flushBatchedCss()

// Inject synchronous (untuk SSR atau urgent rules)
syncInject(".some-class{color:red}")

// Cek apakah rule sudah diinjeksi
isInjected(".tw-s-abc123[data-active=\"true\"]{opacity:0.5}") // → boolean

// Stats untuk debugging
getBatchedCssStats() // → { injected: 12, pending: 3, batchCount: 5 }

// Reset semua state (untuk testing)
resetBatchedCss()
```

### React Component

```tsx
import { TwCssInjector, useTwClasses } from "@tailwind-styled/runtime-css"

// Komponen wrapper untuk inject CSS dari Server Component
function MyPage() {
  return (
    <TwCssInjector css=".custom{display:flex}">
      {children}
    </TwCssInjector>
  )
}

// Hook untuk apply classes dari client component
function MyButton({ active }) {
  const className = useTwClasses("px-4 py-2", active && "bg-blue-600")
  return <button className={className}>Click</button>
}
```

---

## Behavior

| Situasi | Behavior |
|---|---|
| Browser (client) | RAF batching — satu DOM update per frame |
| SSR / server context | Fallback synchronous — inject ke string buffer |
| Duplikat rule | Diskip via `Set<string>` deduplication |
| Style element hilang dari DOM | Auto-recreate dengan id `__tw-runtime-css` |

---

## File Utama

| File | Keterangan |
|---|---|
| `src/batchedInjector.ts` | Core batching logic — RAF queue, dedup, flush |
| `src/CssInjector.tsx` | React component `TwCssInjector` + hook `useTwClasses` |
| `src/index.ts` | Re-export semua public API |

---

## Dipakai Oleh

- **State Engine** — inject `data-active`/`data-loading` CSS rules saat state berubah
- **Container Query Engine** — inject `@container` rules per breakpoint
- **Live Token Engine** — inject CSS variable updates ke `:root`