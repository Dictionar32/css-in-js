# Auto-Generated Schemas

File-file di direktori ini di-generate otomatis dari Rust JSON Schema.

**JANGAN edit manual.**

## Cara regenerate

1. Build native Rust dengan schemars:
   ```bash
   cargo run --bin export-schemas
   ```

2. Generate Zod schemas dari JSON Schema output:
   ```bash
   npx tsx scripts/generate-json-schemas.ts
   ```

3. Atau jalankan keduanya sekaligus:
   ```bash
   npm run generate:schemas
   ```

## Status

Direktori ini masih kosong karena `export-schemas` binary belum diimplementasi
di `native/src/`. Saat binary sudah ada dan `native/json-schemas/` terisi,
script akan mengisi direktori ini secara otomatis.

Lihat: `plans/PLAN.md` Wave 1 untuk rencana implementasi lengkap.
