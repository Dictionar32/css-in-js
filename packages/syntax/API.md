# API Reference — `@tailwind-styled/syntax`

> Dokumentasi lengkap ada di [`packages/syntax/README.md`](../../packages/syntax/README.md).

Internal syntax extraction — thin native bridge untuk parsing class string.

## Fungsi

| Fungsi | Keterangan |
|---|---|
| `extractClassesFromSource(source)` | Ekstrak Tailwind class dari source code (native atau regex fallback) |
| `parseClassesFromString(raw)` | Split class string ke array |
| `isValidClassName(cls)` | Validasi satu class name via pattern `/^[-a-z0-9:/[\]!.()+%]+$/` |

> Package internal — tidak perlu diimport langsung. Dipakai oleh `compiler` dan `scanner`.

## Contoh Penggunaan

```ts
import { extractClassesFromSource } from '@tailwind-styled/syntax'

const source = `
  <div className="text-red-500 bg-blue-500">
    <span className="hover:text-green-500">Hello</span>
  </div>
`

const classes = extractClassesFromSource(source)
console.log(classes)
// Output: ['text-red-500', 'bg-blue-500', 'hover:text-green-500']
