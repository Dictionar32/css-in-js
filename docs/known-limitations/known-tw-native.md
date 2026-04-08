# native — Known Limitations

## 1. Pre-built binary hanya Linux x64
- **Status**: Known
- **Impact**: macOS dan Windows harus build dari source (`cargo build --release` di folder `native/`)
- **Roadmap**: macOS + Windows pre-built binary ada di priority list — lihat `README.md#build`

## 2. `oxc_parser` masih versi 0.1
- **Status**: Known — upgrade ke ~0.49 di backlog (master list item J)
- **Impact**: Visitor API baru di oxc 0.49+ tidak dipakai. Beberapa optimasi Phase 3 Rust bergantung pada `oxc_semantic` yang belum tersedia
- **Workaround**: Gunakan `oxc_extract_classes` untuk ekstraksi — akurasi cukup untuk most cases

## 3. Adaptive thread pool belum diimplementasi (QA #22)
- **Status**: Backlog
- **Impact**: Rayon selalu pakai `num_cpus` core penuh — bisa menyebabkan overhead pada workspace kecil (<10 file)
- **Workaround**: Tidak ada saat ini. Pada proyek kecil overhead biasanya tidak terasa

## 4. `schemars` dependency — perlu evaluasi (QA #21)
- **Status**: Open — `opt-level = "z"` sudah diterapkan untuk size
- **Impact**: Dependency `schemars` mungkin tidak diperlukan jangka panjang jika schema generation dipindah ke pipeline terpisah
- **Keputusan pending**: Evaluasi apakah perlu dipertahankan atau diganti pendekatan lain

## 5. File watcher menggunakan polling model
- **Status**: By design
- **Impact**: Watch events tidak instant — ada latency ~200ms (interval poll default)
- **Alasan**: Threading model N-API yang kompleks mendorong pilihan polling yang lebih simpel dan stabil
- **Workaround**: Turunkan poll interval via custom `startWatch` config jika latency terlalu tinggi

## 6. napi-rs v2 → v3 migration overhead
- **Status**: Sudah selesai (v3 digunakan), tapi `.d.ts` auto-generate masih bergantung pada pipeline Wave 1/4
- **Impact**: Type declarations tidak 100% auto-sync dari Rust struct — masih ada potensi drift
- **Workaround**: Jalankan `npm run wave1:gate` sebelum release untuk verifikasi drift

- **Roadmap**: Auto-generate `.d.ts` dari Rust struct (QA #23)
