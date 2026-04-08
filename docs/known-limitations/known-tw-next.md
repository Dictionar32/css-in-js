# next — Known Limitations

## 1. Route CSS splitting hanya App Router
- **Status**: By design
- **Impact**: Pages Router tidak mendukung per-route CSS splitting
- **Workaround**: Upgrade ke App Router, atau gunakan CSS global saja di Pages Router

## 2. RSC auto-inject route CSS butuh `layout.tsx` manual
- **Status**: Backlog Sprint 9+ — lihat master list item F
- **Impact**: Developer harus import `@tailwind-styled/next/route-css` di `layout.tsx` secara manual
- **Workaround**: Sudah ada workaround — tambahkan import ke layout

## 3. `'use client'` detection belum sempurna (QA #25)
- **Status**: Known
- **Impact**: Beberapa komponen yang seharusnya RSC mungkin salah terdeteksi sebagai client component
- **Workaround**: Tambahkan `'use server'` atau `'use client'` secara eksplisit

## 4. Turbopack loader: options tidak boleh ada `undefined`/`null`
- **Status**: Constraint implementasi
- **Impact**: Jika loader options mengandung `null` atau `undefined`, Turbopack throw serialization error
- **Behavior**: Semua options yang `undefined` harus distrip sebelum dikembalikan dari `loaderOptions()`

## 5. Next.js < 15 tidak didukung penuh
- **Status**: Known
- **Impact**: App Router stabil di Next.js 15+. Versi 14 mungkin berjalan tapi tidak diuji secara resmi
- **Workaround**: Upgrade ke Next.js 15+
- `npm install next@latest`
- `npm install react@latest react-dom@latest`

