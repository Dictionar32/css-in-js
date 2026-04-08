# testing -- Known Limitations

## 1. Matchers harus di-extend secara manual
- **Status**: By design
- **Impact**: Tidak ada auto-setup -- harus memanggil `expect.extend(tailwindMatchers)` di setup file
- **Workaround**: Tambahkan ke `setupFiles` di vitest/jest config

## 2. `getVariantClass` hanya bekerja dengan object config
- **Status**: Known
- **Impact**: Komponen yang dibuat dengan template literal tidak bisa di-introspect via `getVariantClass`
- **Workaround**: Pastikan komponen yang di-test menggunakan object config format

## 3. `toHaveEngineMetrics` -- threshold values tidak divalidasi
- **Status**: Known
- **Impact**: `minFiles: -1` atau `cacheHitRateMin: 2.0` tidak akan error saat konfigurasi, hanya saat assertion
- **Workaround**: Pastikan threshold values masuk akal sebelum dipakai di test

## 4. Jest compatibility -- perlu transform config
- **Status**: Known
- **Impact**: Package menggunakan ESM -- Jest butuh transform config tambahan
- **Workaround**: Tambahkan `@tailwind-styled/testing` ke `transformIgnorePatterns` exceptions di Jest config