# Implementation Gap Audit (Validated Only)

## Header
- Tanggal audit: `2026-04-06`
- Workspace: `c:\Users\User\Documents\demoPackageNpm\focus\tailwind-oxide-main (4)\tailwind-oxide-main`
- Scope: hanya gap yang terverifikasi langsung ke kode dan command output.
- Aturan verifikasi:
  - Bukti wajib berupa path + line atau output command yang dapat diulang.
  - Tidak memasukkan klaim yang belum bisa dibuktikan dari snapshot repo ini.
  - Fokus pada dampak operasional (build, CI, CLI, extension behavior).

## Bukti Eksekusi Command (Critical)

### Evidence 1 - `pack:check` gagal karena referensi `.mjs` yang tidak ada
Command:
```powershell
npm run pack:check -w packages/core
```

Ringkasan output:
```text
Error: Cannot find module '.../scripts/check-pack-artifacts.mjs'
code: 'MODULE_NOT_FOUND'
```

### Evidence 2 - Workflow RC mereferensikan script yang tidak ada
Command:
```powershell
$refs = Select-String -Path .github/workflows/release-candidate-gate.yml -Pattern 'scripts/[A-Za-z0-9_./-]+\.mjs' -AllMatches
foreach($r in $refs){ foreach($m in $r.Matches){ $p=$m.Value; "line {0}: {1} -> exists={2}" -f $r.LineNumber,$p,(Test-Path $p) } }
```

Ringkasan output:
```text
line 45: scripts/smoke/index.mjs -> exists=False
line 50: scripts/validate/final-report.mjs -> exists=False
line 53: scripts/validate/health-summary.mjs -> exists=False
line 56: scripts/benchmark/sprint2-bench.mjs -> exists=False
```

## P0 Critical Gaps

### P0-01 - Drift referensi script `.mjs` vs file aktual `.ts`
Temuan: banyak caller (workflow, CLI, package scripts) masih menunjuk ke `.mjs`, sementara file aktual di repo menggunakan `.ts`.

Dampak: command penting gagal di runtime (`MODULE_NOT_FOUND`), gate CI/RC berhenti sebelum validasi fungsional berjalan.

Bukti:
- `.github/workflows/release-candidate-gate.yml:50`
- `.github/workflows/release-candidate-gate.yml:53`
- `packages/cli/src/commands/misc.ts:31`
- `packages/cli/src/commands/plugin.ts:36`
- `packages/cli/src/commands/registry.ts:18`
- `packages/cli/src/commands/sync.ts:30`
- `packages/cli/src/commands/studio.ts:30`
- `packages/core/package.json:124`
- `scripts/check-pack-artifacts.ts` (file ada)
- `scripts/check-pack-artifacts.mjs` (file tidak ada; tervalidasi via command)

Prioritas: `P0`

### P0-02 - `scripts/smoke/index.mjs` tidak ada, tapi dipanggil RC gate
Temuan: workflow RC memanggil smoke script yang tidak tersedia di repo.

Dampak: RC workflow gagal pada step smoke test meskipun komponen lain mungkin sehat.

Bukti:
- `.github/workflows/release-candidate-gate.yml:45`
- `scripts/smoke/index.mjs` tidak ditemukan (tervalidasi via command)

Prioritas: `P0`

### P0-03 - Kontrak data `final-report` dan `health-summary` tidak sinkron
Temuan: `final-report` menulis `passed/failed` di level top-level, sementara `health-summary` membaca `report.summary.passed/failed`.

Dampak: health summary dapat menghasilkan nilai salah (`0`) atau status menyesatkan walau report valid tersedia.

Bukti:
- `scripts/validate/final-report.ts:88`
- `scripts/validate/final-report.ts:89`
- `scripts/validate/final-report.ts:90`
- `scripts/validate/health-summary.ts:14`
- `scripts/validate/health-summary.ts:15`

Prioritas: `P0`

## P1 Functional Gaps

### P1-01 - VSCode provider terpisah tidak terhubung, extension masih inline hardcoded
Temuan: `extension.ts` masih mendefinisikan `HoverProvider` dan `CompletionProvider` inline (termasuk `commonClasses` statis), sementara provider modular di folder `providers/` tidak diregistrasi.

Dampak: perilaku extension tidak mengikuti implementasi provider modular yang sudah disiapkan; maintainability dan fitur context-aware terhambat.

Bukti:
- `packages/vscode/src/extension.ts:23`
- `packages/vscode/src/extension.ts:33`
- `packages/vscode/src/extension.ts:46`
- `packages/vscode/src/extension.ts:71`
- `packages/vscode/src/extension.ts:86`
- `packages/vscode/src/providers/completionProvider.ts:92`
- `packages/vscode/src/providers/hoverProvider.ts:7`
- `packages/vscode/src/providers/inlineDecorationProvider.ts:133`

Prioritas: `P1`

### P1-02 - Pipeline `scan-cache` untuk VSCode belum punya writer
Temuan: `EngineService` membaca `.tailwind-styled/scan-cache.json`, tetapi command scan CLI hanya mencetak ringkasan dan tidak menulis cache file tersebut.

Dampak: fitur trace/hover/completion berbasis cache di extension berisiko kosong atau stale.

Bukti:
- `packages/vscode/src/services/engineService.ts:96`
- `packages/vscode/src/services/engineService.ts:99`
- `packages/vscode/src/services/engineService.ts:129`
- `packages/vscode/src/services/engineService.ts:187`
- `packages/vscode/src/services/engineService.ts:274`
- `packages/cli/src/scan.ts:41`
- `packages/cli/src/scan.ts:56`
- `packages/cli/src/scan.ts:59`

Prioritas: `P1`

### P1-03 - LSP advanced features masih ditandai next increment + mode stub
Temuan: file LSP secara eksplisit menandai Go to Definition, Rename, dan Code Actions sebagai next increment, serta punya jalur "stub mode".

Dampak: capability LSP belum lengkap sesuai ekspektasi fitur lanjutan.

Bukti:
- `scripts/v48/lsp.ts:13`
- `scripts/v48/lsp.ts:14`
- `scripts/v48/lsp.ts:15`
- `scripts/v48/lsp.ts:16`
- `scripts/v48/lsp.ts:47`
- `scripts/v48/lsp.ts:53`

Prioritas: `P1`

### P1-04 - Cluster remote args diteruskan CLI tetapi tidak dipakai client cluster
Temuan: `scriptCommands` meneruskan `--remote`/`--token`, tetapi parser di `scripts/v50/cluster.ts` hanya membaca `--workers`.

Dampak: command `tw cluster build ... --remote=...` tidak menjalankan mode remote sesuai kontrak CLI.

Bukti:
- `packages/cli/src/commands/scriptCommands.ts:190`
- `scripts/v50/cluster.ts:52`
- `scripts/v50/cluster.ts:53`
- `scripts/v50/cluster.ts:54`
- `scripts/v50/cluster.ts:58`

Prioritas: `P1`

### P1-05 - `ImpactTracker` menginisialisasi `BundleAnalyzer` tetapi belum digunakan
Temuan: field `bundleAnalyzer` dibuat dan diberi komentar reserved, tetapi tidak dipakai selain inisialisasi.

Dampak: analisis dampak bundle belum memanfaatkan komponen analyzer yang telah disiapkan.

Bukti:
- `packages/engine/src/impactTracker.ts:30`
- `packages/engine/src/impactTracker.ts:31`
- `packages/engine/src/impactTracker.ts:57`

Prioritas: `P1`

## P2 Quality and Consistency Gaps

### P2-01 - Dokumen API VSCode tidak sinkron dengan command/config aktual extension
Temuan: docs menyebut command `tailwindStyled.*` tertentu, sementara extension package mendaftarkan command berbeda (`tailwind-styled.*`) dan konfigurasi terbatas.

Dampak: user/operator dapat mengikuti instruksi docs yang tidak bisa dieksekusi pada extension saat ini.

Bukti:
- `docs/api/vscode.md:5`
- `docs/api/vscode.md:10`
- `docs/api/vscode.md:13`
- `docs/api/vscode.md:16`
- `docs/api/vscode.md:21`
- `docs/api/vscode.md:41`
- `packages/vscode/package.json:31`
- `packages/vscode/package.json:35`
- `packages/vscode/package.json:39`
- `packages/vscode/package.json:46`
- `packages/vscode/package.json:51`

Prioritas: `P2`

### P2-02 - FAQ menyatakan Rust optional, implementasi runtime mewajibkan native binding
Temuan: FAQ menyebut Rust parser opsional, sementara scanner/compiler mengeluarkan error fatal ketika native binding tidak tersedia.

Dampak: ekspektasi instalasi dan troubleshooting pengguna menjadi tidak konsisten.

Bukti:
- `docs/faq.md:9`
- `docs/faq.md:10`
- `packages/compiler/src/nativeBridge.ts:83`
- `packages/compiler/src/nativeBridge.ts:178`
- `packages/scanner/src/index.ts:121`
- `packages/scanner/src/index.ts:281`

Prioritas: `P2`

### P2-03 - Dokumen release gate memakai nama script npm yang tidak ada
Temuan: docs menginstruksikan `validate:final` dan `health:summary`, namun root `package.json` hanya memiliki `validate` dan `validate:json`.

Dampak: langkah operasional release dari docs tidak dapat dijalankan apa adanya.

Bukti:
- `docs/ops/release-candidate-gate.md:9`
- `docs/ops/release-candidate-gate.md:10`
- `package.json:209`
- `package.json:210`

Prioritas: `P2`

### P2-04 - Checklist `.md` utama masih menyisakan banyak item unchecked
Temuan: beberapa dokumen tracking utama masih memiliki backlog unchecked signifikan.

Dampak: status implementasi lintas tim sulit ditutup dengan cepat tanpa sinkronisasi checklist.

Bukti:
- `plans/PLAN.md` -> unchecked `50` (contoh pertama `plans/PLAN.md:54`)
- `plans/monorepo-restructure-v2-checklist.md` -> unchecked `41` (contoh pertama `plans/monorepo-restructure-v2-checklist.md:21`)
- `docs/ops/plugin-registry-track-b-issues.md` -> unchecked `41` (contoh pertama `docs/ops/plugin-registry-track-b-issues.md:16`)
- `docs/ops/sprint1-launch-checklist.md` -> unchecked `19` (contoh pertama `docs/ops/sprint1-launch-checklist.md:6`)
- `docs/ops/status-upgrade-playbook.md` -> unchecked `9` (contoh pertama `docs/ops/status-upgrade-playbook.md:92`)
- `README.md` -> unchecked `2` (contoh pertama `README.md:416`)

Prioritas: `P2`

## Prioritized Fix Queue
1. `P0` Normalisasi seluruh referensi script ke satu format eksekusi konsisten (pilih `.ts + tsx` atau generate `.mjs` build output), lalu perbaiki workflow + package scripts + CLI resolver sekaligus.
2. `P0` Pulihkan step smoke RC gate: tambah script smoke yang hilang atau ubah workflow ke target yang benar-benar ada.
3. `P0` Samakan kontrak `final-report` dan `health-summary` (field schema + nama npm script) sebelum dipakai sebagai release gate.
4. `P1` Rewire VSCode extension ke provider modular + aktifkan pipeline writer untuk `.tailwind-styled/scan-cache.json`.
5. `P1` Selesaikan gap partial pada LSP advanced features dan mode remote cluster agar kontrak CLI sesuai perilaku runtime.
6. `P2` Sinkronkan docs operasional/API dengan implementasi aktual, lalu tutup checklist utama secara terukur.

