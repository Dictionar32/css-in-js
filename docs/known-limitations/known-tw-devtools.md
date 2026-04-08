# devtools — Known Limitations

## 1. Rust analyzer tidak tersedia di browser
- **Status**: By design — Rust hanya berjalan di Node.js/server
- **Impact**: Tombol "Run Rust Workspace Scan" sudah dihapus di v4.5 — panel Analyzer sekarang fetch dari `http://localhost:3000/metrics`
- **Workaround**: Jalankan `tw analyze .` di terminal untuk analisis Rust, lihat hasilnya via `tw dashboard`

## 2. Panel Analyzer butuh dashboard server aktif
- **Status**: Dependency runtime
- **Impact**: Jika `tw dashboard` tidak dijalankan, panel Analyzer menampilkan "Dashboard tidak aktif"
- **Workaround**: Jalankan `tw dashboard` di terminal terpisah sebelum membuka DevTools

## 3. `data-tw` attribute hanya tersedia di development build
- **Status**: By design
- **Impact**: DevTools tidak bisa inspect element di production build — `data-tw` tidak digenerate
- **Workaround**: Gunakan development mode atau staging environment

## 4. Inspector tidak support Shadow DOM
- **Status**: Known limitation
- **Impact**: Komponen di dalam Shadow DOM (Web Components) tidak ter-inspect
- **Roadmap**: Tidak ada timeline fix saat ini

## 5. Live Token editor — perubahan tidak persisten antar reload
- **Status**: By design (runtime state)
- **Impact**: Token yang diubah via DevTools hilang saat page reload
- **Workaround**: Gunakan `setToken()` programmatically dan simpan ke config untuk perubahan permanen