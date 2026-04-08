# API Reference — `@tailwind-styled/animate`

Native-backed animation compiler — generate `@keyframes` dan `animation` CSS dari Tailwind class.

## Import

```ts
import {
  animate,
  keyframes,
  animations,
  extractAnimationCss,
  injectAnimationCss,
  createAnimationRegistry,
} from "@tailwind-styled/animate"
```

## Fungsi

### `animate(name, from, to, options?)`

Compile animasi from/to dari Tailwind classes.

```ts
const result = await animate("fadeIn", "opacity-0 scale-95", "opacity-100 scale-100", {
  duration: "200ms",
  easing: "ease-out",
  fill: "both",
})
// result.css → "@keyframes fadeIn { from { opacity: 0; ... } to { opacity: 1; ... } }"
// result.animationClass → "animation-[fadeIn_200ms_ease-out_both]"
```

**Options:**

| Option | Tipe | Keterangan |
|---|---|---|
| `duration` | `string` | Durasi animasi, contoh `"200ms"`, `"0.5s"` |
| `easing` | `string` | Timing function, contoh `"ease-out"`, `"cubic-bezier(0,0,.2,1)"` |
| `delay` | `string` | Delay sebelum animasi mulai |
| `fill` | `"none" \| "forwards" \| "backwards" \| "both"` | Fill mode |
| `iterations` | `number \| "infinite"` | Jumlah iterasi |

---

### `keyframes(name, stops)`

Compile multi-stop `@keyframes` dari Tailwind classes.

```ts
const result = await keyframes("pulse", [
  { stop: "0%",   classes: "opacity-100 scale-100" },
  { stop: "50%",  classes: "opacity-50 scale-95" },
  { stop: "100%", classes: "opacity-100 scale-100" },
])
// result.css → "@keyframes pulse { 0% {...} 50% {...} 100% {...} }"
```

---

### `animations` — Preset Library

Koleksi animasi siap pakai:

```ts
import { animations } from "@tailwind-styled/animate"

animations.fadeIn()        // → { css, animationClass }
animations.slideUp()
animations.scaleIn()
animations.spinOnce()
animations.bounceSoft()
```

---

### `extractAnimationCss(source)`

Ekstrak semua animasi yang didefinisikan dalam source file — untuk SSR/build-time extraction.

```ts
const css = await extractAnimationCss(sourceCode)
// → CSS string semua @keyframes yang dipakai
```

---

### `injectAnimationCss(css)`

Inject CSS animasi ke `<head>` secara runtime (client only).

```ts
injectAnimationCss(result.css)
```

---

### `createAnimationRegistry()`

Buat instance registry terpisah — untuk isolasi library atau sub-application.

```ts
const registry = createAnimationRegistry()
registry.register("myAnim", { from: "opacity-0", to: "opacity-100" })
registry.getCss("myAnim") // → string CSS
```

---

## Catatan

- v5: Async API — semua fungsi compile return `Promise`
- Tidak ada JS fallback — native binding (`@tailwind-styled/native`) wajib tersedia
- Tidak ada style injection otomatis — panggil `injectAnimationCss` secara eksplisit