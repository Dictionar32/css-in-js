# Plugin Registry (Track B) — Issue Templates Siap Salin

Dokumen ini berisi template issue markdown berdasarkan rencana 7 issue berurutan untuk menaikkan `packages/plugin-registry` dari **Buildable** ke **Production-ready**.

---

## Issue 1 — Integration tests for search, list, and install commands

```md
## [Track B] Add integration tests for plugin registry commands

### Summary
Tambahkan integration test untuk command utama Plugin Registry agar perilaku CLI stabil dan punya regression safety net.

### Acceptance Criteria
- [x] Buat folder `__tests__` di `packages/plugin-registry/` dan setup runner (`node:test` atau `vitest`).
- [x] Test `tw-plugin search <keyword>`: output mengandung hasil dari `registry.json`.
- [x] Test `tw-plugin list`: output daftar plugin dari registry.
- [x] Test `tw-plugin install <plugin> --dry-run` (tanpa install nyata).
- [x] Test failure path:
  - [x] command tanpa argumen wajib,
  - [x] plugin tidak dikenal,
  - [x] simulasi install failure.
- [x] Verifikasi exit code: `0` sukses, non-zero untuk error.
- [x] Tambahkan workflow `.github/workflows/plugin-registry-test.yml` (Linux/macOS/Windows + Node 18/20/22).
- [x] Tambahkan cara menjalankan test di `CONTRIBUTING.md`.

### Target Files
- `packages/plugin-registry/__tests__/...`
- `packages/plugin-registry/package.json`
- `.github/workflows/plugin-registry-test.yml`
- `CONTRIBUTING.md`
```

---

## Issue 2 — Improve error handling with validation and actionable messages

```md
## [Track B] Enhance error handling for plugin registry

### Summary
Standarisasi error handling sebelum install plugin serta pesan error yang actionable untuk developer.

### Acceptance Criteria
- [x] Validasi plugin ada di `registry.json` sebelum `npm install`.
- [x] Jika tidak ditemukan, tampilkan pesan:
      `Plugin '<name>' tidak ditemukan di registry. Coba: tw-plugin search <keyword>`.
- [x] Standarisasi error object: `code`, `message`, `context`.
- [x] Error CLI tampil dengan format konsisten (warna merah jika output TTY).
- [x] Tambahkan opsi `--allow-external` untuk plugin di luar registry.
- [x] Untuk external plugin, tampilkan peringatan eksplisit sebelum install.
- [x] Perbarui help text + contoh command.

### Target Files
- `packages/plugin-registry/src/index.ts`
- `packages/plugin-registry/src/cli.ts`
- `docs/plugin-registry.md` (jika sudah ada)
```

---

## Issue 3 — Add basic observability (`--debug` flag)

```md
## [Track B] Add --debug flag for timing and command tracing

### Summary
Tambah observability dasar untuk troubleshooting command Plugin Registry.

### Acceptance Criteria
- [x] Tambahkan opsi `--debug` pada semua subcommand.
- [x] Cetak timing tiap langkah utama (load registry, resolve command, exec install).
- [x] Cetak command path yang dieksekusi (contoh `/usr/bin/npm install ...`).
- [x] Jika env `TWS_LOG_FILE` ada, append log ke file tersebut.
- [x] Semua debug output ke `stderr` agar `stdout` tetap bersih.

### Target Files
- `packages/plugin-registry/src/cli.ts`
- `packages/plugin-registry/src/index.ts`
- `packages/plugin-registry/__tests__/...`
```

---

## Issue 4 — Define and enforce SLO (performance & reliability)

```md
## [Track B] Implement SLO checks for plugin registry commands

### Summary
Tetapkan baseline performa/reliability dan jalankan secara rutin pada CI.

### Acceptance Criteria
- [x] Definisikan benchmark p95 `< 500ms` untuk `search` dan `list` (lokal, tanpa network).
- [x] Definisikan error rate `< 1%` untuk 100 eksekusi batch test.
- [x] Tambahkan folder `benchmark/` + script pengukuran.
- [x] Tambahkan workflow `.github/workflows/plugin-registry-benchmark.yml`.
- [x] Jika threshold terlampaui, CI beri warning + artifact laporan (tidak hard-fail).

### Target Files
- `packages/plugin-registry/benchmark/...`
- `.github/workflows/plugin-registry-benchmark.yml`
- `docs/ops/status-upgrade-playbook.md` (opsional status update)
```

---

## Issue 5 — Security hardening for plugin installation

```md
## [Track B] Add security checks for plugin installation

### Summary
Harden jalur install agar default aman untuk penggunaan luas.

### Acceptance Criteria
- [x] Default install dibatasi ke plugin yang ada di `registry.json`.
- [x] Install eksternal wajib `--allow-external`.
- [x] Validasi nama plugin regex:
      `^(@[a-z0-9-]+/)?[a-z0-9-]+$`.
- [x] Tambahkan opsi `--allowlist` untuk daftar plugin eksternal yang diizinkan.
- [x] Update dokumen kebijakan keamanan plugin install.

### Target Files
- `packages/plugin-registry/src/index.ts`
- `packages/plugin-registry/src/cli.ts`
- `docs/plugin-registry.md`
```

---

## Issue 6 — Structured output (`--json`) and `info` subcommand

```md
## [Track B] Add JSON output and info command for better DX

### Summary
Tingkatkan DX agar command mudah diintegrasikan ke script/tooling lain.

### Acceptance Criteria
- [x] Tambahkan opsi `--json` untuk `search`, `list`, `info`.
- [x] Tambahkan subcommand `info <plugin>`.
- [x] Detail `info`: versi, deskripsi, tags, official/community.
- [x] Output default tetap human-readable.
- [x] Output `--json` valid JSON dan stabil skemanya.
- [x] Help text diperbarui dengan contoh `--json` + `info`.

### Target Files
- `packages/plugin-registry/src/cli.ts`
- `packages/plugin-registry/src/index.ts`
- `packages/plugin-registry/__tests__/...`
```

---

## Issue 7 — Operational docs and status updates

```md
## [Track B] Finalize documentation and update project status

### Summary
Finalisasi dokumentasi operasional dan sinkronkan status roadmap setelah seluruh gate terpenuhi.

### Acceptance Criteria
- [x] Buat `docs/plugin-registry.md` (usage, examples, options).
- [x] Tambahkan known limitations + troubleshooting.
- [x] Update `docs/roadmap/v4.2-backlog.md` status Plugin Registry jadi production-ready.
- [x] Update `docs/status-dashboard.md` dengan status gate terbaru.
- [x] Update `CHANGELOG.md`.

### Target Files
- `docs/plugin-registry.md`
- `docs/roadmap/v4.2-backlog.md`
- `docs/status-dashboard.md`
- `CHANGELOG.md`
```

---

## Urutan PR yang direkomendasikan

1. PR #1 — Issue 1 (integration tests)
2. PR #2 — Issue 2 (error handling)
3. PR #3 — Issue 3 (debug observability)
4. PR #4 — Issue 5 (security hardening)
5. PR #5 — Issue 6 (JSON + info)
6. PR #6 — Issue 4 (SLO benchmark gate)
7. PR #7 — Issue 7 (documentation & status)

Catatan: smoke test dan lint tetap wajib di setiap PR.
