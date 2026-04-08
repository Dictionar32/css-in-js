# storybook-addon -- Known Limitations

## 1. ArgTypes generation hanya dari object config
- **Status**: Known
- **Impact**: `generateArgTypes()` hanya bisa baca variants dari `tw.button({ variants: ... })` -- bukan template literal
- **Workaround**: Pastikan komponen yang di-story menggunakan object config format

## 2. Tidak support Storybook < 7
- **Status**: Peer dependency
- **Impact**: Storybook 6.x tidak kompatibel
- **Workaround**: Upgrade ke Storybook 7+

## 3. `withTailwindStyled` decorator tidak inject Tailwind CSS
- **Status**: By design
- **Impact**: Storybook harus dikonfigurasi dengan Tailwind CSS sendiri (`@storybook/addon-styling` atau config manual)
- **Workaround**: Ikuti panduan di Storybook docs untuk setup Tailwind CSS

## 4. Variant matrix bisa sangat besar
- **Status**: Known
- **Impact**: Komponen dengan banyak variants menghasilkan story matrix yang berat di browser
- **Workaround**: Batasi `createVariantMatrix` hanya untuk 2 variants, gunakan controls untuk variant lain