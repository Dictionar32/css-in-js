# scanner — Known Limitations

## 1. Worker thread tidak bisa di-cancel
- **Status**: Known
- **Impact**: Jika scan timeout (default 120 detik), proses tidak bisa di-cancel — worker thread akan terus jalan di background
- **Workaround**: Restart process atau gunakan `TWS_DISABLE_SCANNER_WORKER=1` untuk sync mode

## 2. Symlinks tidak di-follow
- **Status**: By design (via `native/scan_workspace`)
- **Impact**: File yang diakses via symlink tidak ter-scan
- **Workaround**: Tambahkan path target symlink ke `scanDirs` secara eksplisit

## 3. Binary file besar bisa memperlambat scan
- **Status**: Known
- **Impact**: File besar yang lolos filter ekstensi (mis. `.js` minified 2MB) akan di-read penuh ke memory
- **Workaround**: Tambahkan ke `ignoreDirectories` atau gunakan filter size via custom native config

## 4. Cache tidak otomatis diinvalidasi saat `node_modules` berubah
- **Status**: Known
- **Impact**: Jika ada package yang inject file `.tsx` ke `node_modules`, scan cache lama bisa stale
- **Workaround**: Tambahkan `node_modules` ke `ignoreDirectories` (default sudah diset)

## 5. `smartInvalidation` berdasarkan content hash, bukan mtime
- **Status**: By design
- **Impact**: File yang timestamp-nya berubah tapi kontennya sama tetap masuk cache hit (perilaku yang benar)
- **Efek samping**: Jika hash collision terjadi (sangat jarang), file bisa salah skip