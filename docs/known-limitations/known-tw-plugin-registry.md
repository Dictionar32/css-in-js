# plugin-registry -- Known Limitations

## 1. Track B issues belum dikerjakan
- **Status**: Backlog -- lihat `docs/ops/plugin-registry-track-b-issues.md`
- **Impact**: Integration tests, SLO benchmark, security hardening, `--allowlist` flag belum ada

## 2. Registry hanya npm -- tidak support private registry
- **Status**: Known
- **Impact**: Plugin dari private npm registry atau GitHub Packages tidak bisa di-search
- **Workaround**: Gunakan `--allow-external` untuk install langsung dari nama package

## 3. `tw plugin verify` hash check bergantung pada koneksi npm
- **Status**: Known
- **Impact**: Verifikasi integrity gagal jika npm registry tidak bisa diakses (offline mode)
- **Workaround**: Gunakan `--offline` flag npm atau skip verifikasi di environment terisolasi

## 4. Plugin eksternal tidak diaudit
- **Status**: By design -- tanggung jawab user
- **Impact**: Plugin dengan `--allow-external` tidak melewati security review
- **Workaround**: Review source plugin sebelum install, atau gunakan hanya plugin official (verified)