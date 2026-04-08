# vite — Known Limitations

## 1. HMR partial update kadang membutuhkan full reload
- **Status**: Known edge case
- **Impact**: Perubahan pada variant definition (`tw.button({ variants: ... })`) kadang tidak ter-hot-reload tanpa full page refresh
- **Workaround**: Simpan file untuk trigger full HMR, atau gunakan `import.meta.hot.invalidate()`

## 2. Vite build mode — CSS tidak di-split per route
- **Status**: By design (bukan Next.js App Router)
- **Impact**: Semua CSS dikumpulkan jadi satu file di `dist/assets/*.css`
- **Workaround**: Gunakan `routeCss: true` dengan custom manifest untuk splitting manual

## 3. Vite < 6.2 tidak didukung
- **Status**: Peer dependency requirement
- **Impact**: Versi Vite lama akan error saat install atau build
- **Workaround**: Upgrade Vite ke ≥ 6.2.0

## 4. Plugin `tailwindStyledPlugin()` konflik dengan Tailwind CSS Vite plugin
- **Status**: Known
- **Impact**: Jika `@tailwindcss/vite` dan `tailwindStyledPlugin()` dipasang bersamaan, CSS bisa di-process dua kali
- **Workaround**: Gunakan salah satu saja, atau konfigurasi `include`/`exclude` untuk menghindari overlap