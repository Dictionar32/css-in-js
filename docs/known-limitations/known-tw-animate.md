# animate -- Known Limitations

## 1. Native binding wajib -- tidak ada JS fallback
- **Status**: By design (v5.0)
- **Impact**: Semua fungsi throw jika `tailwind_styled_parser.node` tidak tersedia
- **Workaround**: Build native: `cd native && cargo build --release`

## 2. Animation CSS tidak di-inject otomatis
- **Status**: By design
- **Impact**: Harus panggil `injectAnimationCss(result.css)` secara manual
- **Workaround**: Tambahkan inject call ke layout atau app entry point

## 3. Preset terbatas pada kelas yang dikenali native engine
- **Status**: Partial
- **Impact**: Arbitrary class di animasi preset mungkin tidak generate CSS yang benar
- **Workaround**: Gunakan kelas standard Tailwind untuk animasi

## 4. Duration tidak divalidasi
- **Status**: Known
- **Impact**: `duration: "2000"` (tanpa unit) menghasilkan CSS tidak valid
- **Workaround**: Selalu sertakan unit: `"200ms"` atau `"0.5s"`