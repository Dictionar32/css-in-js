# svelte -- Known Limitations

## 1. `styled` action tidak support reactive updates
- **Status**: Known
- **Impact**: Perubahan pada config object di `use:styled={...}` saat runtime tidak ter-update
- **Workaround**: Gunakan `cv()` dengan reaktif binding daripada `styled` action untuk dynamic classes

## 2. TypeScript support bergantung pada `svelte-check`
- **Status**: Known
- **Impact**: Type errors di `.svelte` files tidak selalu terdeteksi tanpa `svelte-check`
- **Workaround**: Tambahkan `svelte-check` ke dev workflow: `svelte-check --tsconfig ./tsconfig.json`

## 3. `tailwind-merge` versi 1.x tidak kompatibel
- **Status**: Peer dependency constraint
- **Impact**: Package menggunakan `tailwind-merge` v2/v3 API -- v1 tidak kompatibel
- **Workaround**: Upgrade `tailwind-merge` ke versi 2.x atau 3.x

## 4. Svelte 3 tidak didukung
- **Status**: Peer dependency
- **Impact**: Svelte 3 tidak kompatibel dengan adapter ini
- **Workaround**: Upgrade ke Svelte 4 atau 5