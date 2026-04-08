# Migration Guide (v3 -> v4)

## Quick steps

1. Jalankan dry-run terlebih dulu:

```bash
npx tailwind-styled migrate ./src --dry-run
```

2. Jalankan migrasi nyata:

```bash
npx tailwind-styled migrate ./src
```

3. Untuk mode interaktif:

```bash
npx tailwind-styled migrate ./src --wizard
```

## Transform otomatis saat ini

- `tailwind-styled-components` -> `tailwind-styled-v4`
- `flex-grow` -> `grow`
- `flex-shrink` -> `shrink`
- Bootstrap `src/tailwind.css` (CSS-first) jika belum ada

## Catatan

Setelah migrasi, review manual tetap dibutuhkan untuk kelas/utility lain yang berubah di Tailwind v4.

## Tailwind v4 class renames yang di-handle `tw migrate`

| Lama (v3) | Baru (v4) |
|-----------|-----------|
| `flex-grow` | `grow` |
| `flex-shrink` | `shrink` |
| `overflow-ellipsis` | `text-ellipsis` |
| `decoration-slice` | `box-decoration-slice` |
| `decoration-clone` | `box-decoration-clone` |

## Migrasi dari Vue/Svelte ke Vue/Svelte adapter

Jika sebelumnya menggunakan class string manual:

```vue
<!-- Sebelum -->
<button :class="['px-4 py-2', intent === 'primary' ? 'bg-blue-500' : 'bg-red-500']">

<!-- Sesudah -->
<script setup>
import { cv } from "@tailwind-styled/vue"
const btn = cv({ base: "px-4 py-2", variants: { intent: { primary: "bg-blue-500", danger: "bg-red-500" } } })
const props = defineProps({ intent: { default: "primary" } })
</script>
<button :class="btn({ intent: props.intent })">
```

## Rollback

Jika perlu rollback setelah migrasi:
```bash
git diff src/          # review semua perubahan
git checkout src/      # rollback seluruh folder src
# atau per file:
git checkout src/components/Button.tsx
```

---

## Migrasi v4.x → v5.0

### Breaking Changes

| Perubahan | v4.x | v5.0 |
|---|---|---|
| Native binding | Opsional (JS fallback) | **Wajib** |
| Import path | `tailwind-styled-v4/next` | `@tailwind-styled/next` |
| `TWS_NO_NATIVE` | Disable native | Deprecated (segera dihapus) |
| `validate:final` script | Ada | Diganti `validate` |
| Tipe `CvFn` | `any` | `CvFn<C>` (generic) |

### Langkah Migrasi v4 → v5

1. **Build native binary:**
   ```bash
   cd native && cargo build --release
   cp target/release/tailwind_styled_parser.node .
   ```

2. **Update import paths** (jika pakai subpath imports):
   ```ts
   // Sebelum
   import { withTailwindStyled } from "tailwind-styled-v4/next"
   
   // Sesudah
   import { withTailwindStyled } from "@tailwind-styled/next"
   ```

3. **Update npm scripts** jika ada di CI:
   ```bash
   # Sebelum
   npm run validate:final
   
   # Sesudah
   npm run validate
   ```

4. **Hapus `TWS_NO_NATIVE=1`** dari environment jika ada — tidak lagi berpengaruh

5. **Update TypeScript types** jika ada penggunaan `CvFn` atau `TwComponentFactory`:
   ```ts
   // Sebelum (tipe lebar)
   const fn: CvFn = ...
   
   // Sesudah (generic typed)
   const fn: CvFn<typeof myConfig> = ...
   ```

### Verifikasi Migrasi

```bash
npm run validate
npm run stability:cross-package
```

Jika semua hijau, migrasi berhasil.