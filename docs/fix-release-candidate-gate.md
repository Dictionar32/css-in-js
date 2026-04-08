# Release Candidate Gate

## Purpose
Menjalankan gate akhir sebelum RC release agar keputusan rilis berbasis data.

## Local Commands

```bash
# Gate utama — generate validation-report.json + health-summary.json
npm run validate

# Output JSON (untuk pipe ke tools lain)
npm run validate:json

# Cross-package stability gate (semua package + wave gates)
npm run stability:cross-package
```

Output artifacts:
- `artifacts/validation-report.json`
- `artifacts/health-summary.json`

> **Catatan:** Script `validate:final` dan `health:summary` yang disebutkan di versi docs sebelumnya
> sudah digantikan oleh `validate` (shorthand) dan `validate:json`. Keduanya menjalankan
> `scripts/validate/final-report.ts` via `tsx`.

## Gate Pipeline Lengkap

```bash
# 1. Schema drift check (Rust → TS auto-sync)
npm run wave4:schema-drift

# 2. ESM compatibility
npm run wave3:esm-cutover

# 3. Export compat (dual-mode import/require)
npm run wave2:gate

# 4. Dependency matrix
npm run validate:deps

# 5. Semua sekaligus
npm run stability:cross-package
```

## GitHub Actions

Gunakan workflow **Release Candidate Gate** (`workflow_dispatch`) untuk menjalankan gate di CI.

Workflow menjalankan:
1. `npm run stability:cross-package`
2. `npm run validate:json`
3. Upload `artifacts/` sebagai workflow artifact

## Definition of Done untuk RC

- [ ] `npm run stability:cross-package` hijau
- [ ] `artifacts/validation-report.json` tidak ada `status: "fail"`
- [ ] `artifacts/health-summary.json` `healthScore >= 0.9`
- [ ] Pre-built binary Linux x64 tersedia di `native/`
- [ ] CHANGELOG.md sudah diupdate
- [ ] `npm run validate:deps` hijau
- [ ] `npm run wave4:schema-drift` hijau
- [ ] `npm run wave3:esm-cutover` hijau
- [ ] `npm run wave2:gate` hijau


## Release Candidate Gate
Menjalankan gate akhir sebelum RC release agar keputusan rilis berbasis data.

```bash
npm run stability:cross-package
npm run validate:json

 