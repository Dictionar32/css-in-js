# preset -- Known Limitations

## 1. Override token di config tidak merge secara deep
- **Status**: Known
- **Impact**: `extend.colors` di `tailwind-styled.config.json` mengganti seluruh colors, bukan merge per-key
- **Workaround**: Sertakan semua warna yang diinginkan (termasuk yang ingin dipertahankan dari default)

## 2. Preset tidak compatible dengan Tailwind v3 config format
- **Status**: By design -- Tailwind v4 only
- **Impact**: `tailwind.config.js` format lama tidak bisa dipakai langsung
- **Workaround**: Jalankan `tw migrate` untuk konversi ke format CSS-first v4

## 3. Font stack menggunakan system fonts -- tidak include web fonts
- **Status**: By design
- **Impact**: `font-sans` menggunakan Inter/system-ui -- tidak auto-load Google Fonts
- **Workaround**: Import font di `globals.css` dan override `--font-sans` CSS variable