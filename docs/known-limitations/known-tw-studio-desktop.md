# studio-desktop — Known Limitations

## 1. TypeScript migration belum selesai
- **Status**: Partial — lihat master list item #17
- **Impact**: `src/main.js` dan `src/preload.js` masih JavaScript, bukan TypeScript
- **Roadmap**: Sprint A target — migrasi ke TS + strict mode

## 2. Pre-built distribusi belum tersedia
- **Status**: Build commands ada, tapi binary belum dipublish
- **Impact**: User harus build sendiri dari source
- **Workaround**: `npm run build:linux` / `build:mac` / `build:win` dari direktori package

## 3. Auto-updater butuh server distribusi
- **Status**: Kode ada (`electron-updater`), tapi server belum dikonfigurasi
- **Impact**: Auto-update tidak berfungsi tanpa endpoint update server

## 4. Engine lazy-load per project — startup bisa lambat
- **Status**: By design
- **Impact**: Saat pertama membuka project baru, engine harus scan workspace dari awal (~beberapa detik untuk project besar)
- **Workaround**: Biarkan scan selesai — cache akan membuat pembukaan berikutnya jauh lebih cepat

## 5. `electron` harus di `optionalDependencies`
- **Status**: Constraint implementasi — JANGAN dipindahkan
- **Impact**: Jika `electron` dipindah ke `dependencies`, install di environment non-desktop (CI, server) akan gagal