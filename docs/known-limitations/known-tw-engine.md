# engine -- Known Limitations

## 1. Config Tailwind di-cache sekali per process
- **Status**: By design (performance)
- **Impact**: Perubahan `tailwind.config.ts` saat watch mode tidak ter-reload otomatis
- **Workaround**: Restart watch mode setelah ubah config

## 2. Watch mode flush debounce 100ms
- **Status**: Known edge case
- **Impact**: File yang disimpan sangat cepat (<100ms) mungkin hanya trigger satu rebuild
- **Workaround**: Naikkan `flushDebounceMs` via engine options

## 3. Large file threshold default 10MB
- **Status**: By design
- **Impact**: File > 10MB tidak di-scan (class tidak diekstrak)
- **Workaround**: Turunkan threshold di engine options atau tambahkan ke exclude list

## 4. Plugin `beforeScan` harus synchronous
- **Status**: Known
- **Impact**: Async operation di `beforeScan` diabaikan
- **Workaround**: Gunakan `afterScan` atau `beforeBuild` untuk async operations
