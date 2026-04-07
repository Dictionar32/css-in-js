# Testing Status Note

## Recommended wording

```text
Testing

✅ npm -w packages/compiler run check
✅ npm -w packages/compiler test
✅ npm run stability:cross-package
```

## Why this is better

- Semua command utama sekarang hijau, jadi tidak perlu lagi menulis warning legacy.
- Format hasil test tetap ringkas, konsisten, dan mudah dipindai reviewer.
- Menurunkan noise di laporan CI karena fokus ke status aktual terbaru.
