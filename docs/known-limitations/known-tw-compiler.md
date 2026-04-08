# compiler — Known Limitations

## 1. Native binding wajib tersedia (v5.0+)
- **Status**: By design (breaking change dari v4.x)
- **Impact**: Compiler throw error fatal jika `tailwind_styled_parser.node` tidak ditemukan
- **Workaround**: Build native: `cd native && cargo build --release`
- **Lihat**: `docs/known-limitations/tw-native.md`

## 2. Dynamic class tidak bisa di-compile
- **Status**: By design (static analysis only)
- **Impact**: `` tw(`bg-${color}-500`) `` tidak terdeteksi — class tidak masuk ke CSS output
- **Workaround**: Pisahkan class statis dan dinamis:
  ```tsx
  // ❌
  tw(`bg-${color}-500 text-white`)
  
  // ✅
  twMerge("text-white", color === "red" ? "bg-red-500" : "bg-blue-500")
  ```

## 3. Dead Style Elimination (DSE) — baseline saja
- **Status**: Partial — Phase 4 tests ada, Phase 5 (full production DSE) masih planned
- **Impact**: DSE menghapus variant CSS berdasarkan static JSX analysis. Komponen yang di-render secara dinamis (lazy, portal, dll.) mungkin kehilangan CSS-nya
- **Workaround**: Tambahkan class ke safelist di `tailwind-styled.config.json`

## 4. Source maps hanya dengan Oxc
- **Status**: Partial
- **Impact**: Mode fallback (tanpa Oxc) tidak menghasilkan source map yang akurat
- **Workaround**: Pastikan `oxc-parser` tersedia — compiler akan auto-detect

## 5. `hoist: true` bisa mengubah semantik hot reload
- **Status**: Known edge case
- **Impact**: Class string dipindah ke luar render function — bisa mempengaruhi HMR di setup Vite tertentu
- **Workaround**: Set `hoist: false` di loader options jika ada masalah HMR

## 6. Compiler Phase 5 (full production) belum selesai
- **Status**: Backlog — lihat master list item #7
- **Impact**: Phase 5 yang seharusnya cover semua edge case DSE + incremental rebuild produksi belum diimplementasi