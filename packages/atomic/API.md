# API Reference — `@tailwind-styled/atomic`

Atomic CSS generator — konversi Tailwind class ke CSS rule individual dengan nama class yang di-scope.

## Import

```ts
import {
  parseAtomicClass,
  toAtomicClasses,
  generateAtomicCss,
} from "@tailwind-styled/atomic"
```

## Fungsi

### `parseAtomicClass(twClass)`

Parse satu Tailwind class menjadi `AtomicRule`:

```ts
const rule = parseAtomicClass("p-4")
// → {
//     twClass: "p-4",
//     atomicName: "_tw_p_4",
//     property: "padding",
//     value: "1rem",
//     selector: "._tw_p_4",
//     css: "._tw_p_4 { padding: 1rem }",
//   }

const rule = parseAtomicClass("hover:bg-blue-600")
// → {
//     twClass: "hover:bg-blue-600",
//     atomicName: "_tw_hover_bg_blue_600",
//     variant: "hover",
//     property: "background-color",
//     value: "#2563eb",
//     selector: "._tw_hover_bg_blue_600:hover",
//     css: "._tw_hover_bg_blue_600:hover { background-color: #2563eb }",
//   }
```

---

### `toAtomicClasses(twClasses)`

Konversi string class ke set atomic:

```ts
const { atomicClasses, rules, css } = toAtomicClasses("p-4 bg-blue-500 hover:bg-blue-600")
// atomicClasses → ["_tw_p_4", "_tw_bg_blue_500", "_tw_hover_bg_blue_600"]
// rules → AtomicRule[]
// css → string CSS gabungan
```

---

### `generateAtomicCss(classes[])`

Generate CSS lengkap dari array class:

```ts
const css = generateAtomicCss(["flex", "items-center", "gap-4"])
// → "._tw_flex { display: flex } ._tw_items_center { align-items: center } ..."
```

---

## Tipe

```ts
interface AtomicRule {
  twClass: string       // Class asal: "p-4"
  atomicName: string    // Nama atomic: "_tw_p_4"
  variant?: string      // Variant prefix: "hover", "md", dll.
  property: string      // CSS property: "padding"
  value: string         // CSS value: "1rem"
  selector: string      // Selector CSS lengkap
  css: string           // Rule CSS lengkap
}
```

---

## Kapan Dipakai

Package ini dipakai secara internal oleh `compiler` untuk menghasilkan atomic CSS di build time. Tidak perlu diimport langsung kecuali membangun tooling kustom.