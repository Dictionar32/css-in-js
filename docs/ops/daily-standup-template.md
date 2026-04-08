# Daily Standup Template (Sprint 1)

Gunakan format ini untuk update harian per PIC (copy-paste):

```
Hari/Tanggal:
PIC:
Fitur yang dikerjakan:
Progress (gate yang sudah dicapai):
Blocker (jika ada):
Rencana selanjutnya:
```

## Contoh Isi

```
Hari/Tanggal: Senin, 17 Maret 2026
PIC: Andi
Fitur yang dikerjakan: tw parse
Progress (gate yang sudah dicapai): Build Matrix ✅, Smoke ✅, Fallback ✅, Docs ⏳
Blocker (jika ada): Tidak ada
Rencana selanjutnya: Menyelesaikan Known Limitations untuk docs parse
```
# Daily Standup Template

## Format

```
## Standup [YYYY-MM-DD]

**Kemarin:**
- [ item yang dikerjakan ]

**Hari ini:**
- [ item yang akan dikerjakan ]

**Blocker:**
- [ blocker atau tidak ada ]

**Gate status:**
- `npm run validate` → [hijau/merah]
- `npm run stability:cross-package` → [hijau/merah]
```

---

## Sprint A Target (stabilize interface)

Fokus hari ini bisa diambil dari backlog berikut:

### LSP (#12) -- Go to Definition, Rename Symbol, Code Actions
```bash
# Test LSP
npm -w packages/vscode test

# Check extension
npm run build -w packages/vscode
```

### Studio Desktop (#17) -- TS migration + smoke test
```bash
npm run dev -w @tailwind-styled/studio-desktop
npm run build:linux -w @tailwind-styled/studio-desktop
```

### TwError Unification
```bash
npm -w packages/shared test
npm run stability:cross-package
```

---

## Sprint B Target (type/source-of-truth)

### Rust Schema Export
```bash
npm run wave1:export-schemas
npm run wave4:schema-drift
```

### Wave 2B Schema Consolidation
- Migrate `packages/compiler/src/cssCompiler.ts` ke `@tailwind-styled/shared` binding helpers
- Target: 77 Zod schema dikonsolidasi ke `shared/src/schemas/`

---

## Gate Checks (jalankan sebelum PR)

```bash
# Gate lengkap
npm run stability:cross-package

# Per area
npm run wave1:gate          # schema drift
npm run wave2:gate          # export compat
npm run wave3:esm-cutover   # ESM only
npm run wave4:schema-drift  # Rust->TS sync
npm run validate            # final report
npm run validate:deps       # dep matrix
```

---

## Referensi

- Backlog: `docs/master-list-unimplemented-2026-04-07.md`
- Status: `docs/status-dashboard.md`
- Sprint plan: `plans/PLAN.md`