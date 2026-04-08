# dashboard -- Known Limitations

## 1. History in-memory -- hilang saat restart
- **Status**: Known
- **Impact**: Riwayat metrics reset saat server di-restart
- **Workaround**: Gunakan `POST /reset` dan simpan snapshot sebelum shutdown, atau baca dari `metrics-history.jsonl`

## 2. Tidak ada autentikasi
- **Status**: By design untuk local dev
- **Impact**: Siapapun di jaringan bisa akses endpoint
- **Workaround**: Bind ke localhost saja -- jangan expose ke network publik

## 3. UI tidak real-time -- perlu refresh manual
- **Status**: By design (no WebSocket)
- **Impact**: Halaman HTML harus di-refresh untuk lihat update terbaru
- **Workaround**: Gunakan `GET /metrics` dengan polling interval kustom dari client

## 4. `fs.watch` tidak reliable di Docker/WSL
- **Status**: Known Node.js limitation
- **Impact**: File watcher mungkin tidak trigger di beberapa environment
- **Behavior**: Fallback polling 2 detik sudah aktif -- berfungsi di semua environment