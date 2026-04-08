# vscode — Known Limitations

## 2. gRPC cluster protocol belum ada
- **Status**: Backlog Sprint 9+ — lihat master list item F
- **Impact**: Remote cluster via gRPC tidak tersedia — hanya HTTP remote build yang berjalan
- **Roadmap**: Dijadwalkan setelah core LSP stabil

## 3. Go to Definition hanya untuk class token
- **Status**: Partial
- **Impact**: "Go to Definition" membawa ke definisi komponen `tw.*`, bukan ke rule CSS yang digenerate
- **Workaround**: Gunakan compiler output di `.next/static/css/` untuk inspect CSS final

## 4. Settings.json config belum didukung
- **Status**: Backlog — lihat master list item F
- **Impact**: Konfigurasi extension (mis. path native binding, scan dirs) harus via `tailwind-styled.config.json` — bukan VS Code settings
- **Roadmap**: Sprint 9+ target

## 5. Extension hanya support VS Code Insiders + Stable 1.85+
- **Status**: Known
- **Impact**: VS Code versi lama mungkin tidak bisa load extension