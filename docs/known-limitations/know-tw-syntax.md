# syntax -- Known Limitations

## 1. Fallback regex tidak menangkap semua pattern
- **Status**: Known
- **Impact**: Jika native binding tidak tersedia, pola class yang kompleks (nested template literal, conditional spread) bisa terlewat
- **Workaround**: Pastikan native binding tersedia untuk coverage penuh

## 2. Package internal -- tidak untuk user langsung
- **Status**: Informasi
- **Impact**: API bisa berubah antar minor version tanpa deprecation notice
- **Workaround**: Import dari `tailwind-styled-v4` atau `@tailwind-styled/scanner`, bukan dari sini langsung

## 3. Validasi `isValidClassName` bisa terlalu ketat
- **Status**: Known
- **Impact**: Beberapa class custom atau plugin-generated mungkin dianggap tidak valid karena karakter yang tidak ada di whitelist
- **Workaround**: Gunakan `parseClassesFromString` saja tanpa validasi, atau extend regex jika perlu