# rspack -- Known Limitations

## 1. Route CSS splitting tidak tersedia
- **Status**: By design -- fitur Next.js App Router
- **Impact**: CSS tidak di-split per route di Rspack output
- **Workaround**: Gunakan `tw split` manual setelah build

## 2. HMR perlu konfigurasi manual untuk class update
- **Status**: Known
- **Impact**: Perubahan class di komponen tidak selalu trigger HMR tanpa full reload
- **Workaround**: Tambahkan `hot: true` di Rspack config dan gunakan `module.hot.accept`

## 3. Rspack < 1.0 tidak didukung
- **Status**: Peer dependency
- **Impact**: Error saat install atau build
- **Workaround**: Upgrade ke Rspack >= 1.0

## 4. Loader options harus serializable
- **Status**: Rspack constraint
- **Impact**: Options yang mengandung function tidak bisa dipass ke loader
- **Workaround**: Gunakan string identifier untuk function, resolve di dalam loader