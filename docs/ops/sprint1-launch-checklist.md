> **Status 2026-04-07**: Semua item Sprint 1 sudah selesai (Production-ready). Checklist ini di-archive.

# Sprint 1 Launch Checklist (Eksekusi)

Dokumen ini dipakai untuk **menjalankan pembuatan Sprint 1** secara operasional, bukan sekadar perencanaan.

## 1) Setup manajemen sprint
- [x] Buat milestone: **Sprint 1: Upgrade Status Q2 2025** (durasi 2 minggu).
- [x] Tetapkan PIC per track:
  - [x] Track A (Prototipe → Buildable)
  - [x] Track B (Buildable → Production-ready)
  - [x] Track C (Production-ready → Released)
- [x] Buat label GitHub:
  - [x] `status/prototipe`
  - [x] `status/buildable`
  - [x] `status/production`
  - [x] `track/A`
  - [x] `track/B`
  - [x] `track/C`

## 2) Seed issue Sprint 1 (Track A prioritas)
Gunakan file issue siap tempel berikut:
- [x] `docs/ops/issues/track-a-tw-parse.md`
- [x] `docs/ops/issues/track-a-tw-transform.md`
- [x] `docs/ops/issues/track-a-tw-lint.md`

Issue tambahan bisa dibuat dari template umum:
- [x] `docs/ops/sprint1-issue-template.md`

## 3) Baseline verifikasi teknis
- [x] Jalankan: `npm run build`
- [x] Jalankan: `npm run test:smoke`
- [x] Jalankan: `npm run test:smoke:fallback`
- [x] Pastikan workflow CI matrix aktif: `.github/workflows/build-matrix.yml`

## 4) Ritme eksekusi harian
- [x] Standup harian pakai: `docs/ops/daily-standup-template.md`
- [x] Update dashboard harian: `docs/status-dashboard.md`
- [x] Mid-week checkpoint: review blocker lintas track
- [x] End-of-week review: promote status hanya jika semua gate ✅

## 5) Definisi DONE Sprint 1
Sprint 1 dianggap selesai jika:
- [x] Tiga fitur prioritas Track A punya issue aktif + owner.
- [x] Dashboard terupdate harian minimal 5 hari kerja.
- [x] Minimal 1 fitur Track A memenuhi semua gate termasuk Docs.
- [x] Track B punya minimal 1 pilot integration-test issue aktif.