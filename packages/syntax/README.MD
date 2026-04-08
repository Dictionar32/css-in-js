# `@tailwind-styled/syntax`

Internal syntax extraction helpers untuk `tailwind-styled-v4` — thin wrapper di atas native binding untuk operasi parsing class string yang ringan.

---

## Penggunaan

Package ini adalah **package internal** — dipakai oleh `compiler` dan `scanner`, bukan untuk diimport langsung oleh end-user.

```ts
import {
  extractClassesFromSource,
  parseClassesFromString,
  isValidClassName,
} from "@tailwind-styled/syntax"

// Ekstraksi kelas dari source code
const classes = extractClassesFromSource(`
  const Button = tw.button\`px-4 py-2 bg-blue-600 text-white\`
`)
// → ["px-4", "py-2", "bg-blue-600", "text-white"]

// Parse string kelas yang sudah diketahui
const parsed = parseClassesFromString("flex items-center gap-4 hover:gap-6")
// → ["flex", "items-center", "gap-4", "hover:gap-6"]

// Validasi satu class name
isValidClassName("hover:bg-blue-600") // → true
isValidClassName("invalid class!!")   // → false
```

---

## Cara Kerja

Package mencoba load `@tailwind-styled/native` untuk operasi parsing yang diakselerasi Rust. Jika binary tidak tersedia, fallback ke implementasi JS dengan regex.

```
extractClassesFromSource(source)
           │
           ├─ native tersedia? ──► extractClassesFromSourceNative() [Rust]
           │
           └─ fallback ──────────► regex JS (/tw`...`/, className="...", dll.)
```

Pattern yang dikenali:
- `` tw`class1 class2` ``
- `` tw.div`class1 class2` ``
- `className="class1 class2"`
- `class="class1 class2"`
- `cx("class1", "class2")`
- `cn("class1", isActive && "class2")`

---

## Valid Class Pattern

Regex validasi: `/^[-a-z0-9:/[\]!.()+%]+$/`

Class dianggap valid jika hanya mengandung karakter: huruf kecil, angka, `-`, `:`, `/`, `[`, `]`, `!`, `.`, `(`, `)`, `+`, `%`.

---

## File Utama

| File | Keterangan |
|---|---|
| `src/index.ts` | Entry point — load native bridge, export semua fungsi |

---

## Dependensi

- `@tailwind-styled/native` (opsional, di-load dinamis via kandidat path)