# atomic -- Known Limitations

## 1. Atomic CSS map terbatas
- **Status**: Known -- subset kelas Tailwind yang paling umum
- **Impact**: Beberapa kelas (grid-*, place-*, dll.) tidak menghasilkan AtomicRule
- **Workaround**: Gunakan Tailwind CLI + `tw shake` untuk coverage penuh

## 2. Nama atomic dari arbitrary values bisa panjang
- **Status**: By design
- **Impact**: `w-[340px]` menghasilkan `_tw_w__340px_` -- tidak manusiawi
- **Workaround**: Ekstrak arbitrary values ke CSS variable

## 3. Tidak support `@apply`
- **Status**: By design
- **Impact**: `@apply p-4` tidak bisa di-parse jadi AtomicRule
- **Workaround**: Gunakan class string langsung

## 4. API internal -- bisa berubah tanpa notice
- **Status**: Internal package
- **Impact**: Tidak ada SemVer guarantee untuk API `@tailwind-styled/atomic`
- **Workaround**: Jangan import langsung di project user