# Testing Status Note

## Recommended wording

```text
Testing

⚠️ npm -w packages/compiler run check (warning: command ini masih gagal karena isu type-resolution lama di workspace/compiler; ini known issue yang sudah ada sebelumnya dan tidak dipicu oleh perubahan ini)
✅ npm -w packages/compiler test
✅ npm run stability:cross-package
```

## Why this is better

- Menjelaskan konteks warning secara eksplisit: known issue lama, bukan regresi baru.
- Menggunakan kalimat yang lebih natural dan konsisten untuk laporan testing.
- Tetap ringkas, tapi cukup jelas untuk reviewer/CI reader.
