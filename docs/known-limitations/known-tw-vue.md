# vue -- Known Limitations

## 1. Vue 2 tidak didukung
- **Status**: By design -- Vue 3 Composition API only
- **Impact**: Proyek Vue 2 tidak bisa pakai adapter ini
- **Workaround**: Upgrade ke Vue 3, atau gunakan class binding manual

## 2. `useVariants()` composable terbatas pada object config
- **Status**: Known
- **Impact**: Template literal components tidak bisa di-introspect via `useVariants()`
- **Workaround**: Gunakan object config format untuk komponen yang perlu di-introspect

## 3. `tailwind-merge` versi 1.x tidak kompatibel
- **Status**: Peer dependency constraint
- **Impact**: Versi 1.x punya API berbeda
- **Workaround**: Upgrade ke `tailwind-merge` 2.x atau 3.x

## 4. Nuxt.js perlu konfigurasi tambahan
- **Status**: Known
- **Impact**: Auto-import Nuxt tidak mendeteksi `tw`, `cv`, `cx` dari adapter ini
- **Workaround**: Tambahkan import manual ke `nuxt.config.ts` atau buat composable wrapper