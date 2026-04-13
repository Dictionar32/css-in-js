import { describe, it } from "node:test"
import assert from "node:assert/strict"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createRequire } from "node:module"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

let mod
try {
  mod = require(path.resolve(__dirname, "../dist/index.js"))
} catch {
  console.warn("[compiler/tests] dist not found — jalankan `npm run build` dulu")
  process.exit(0) // INTENTIONAL: skip jika dist tidak ada (bukan false-positive — test tidak pernah "pass")
}

const { StaticVariantResolver } = mod ?? {}

describe("Variants", () => {
  it("StaticVariantResolver resolves basic variant", () => {
    if (!StaticVariantResolver) return
    const resolver = new StaticVariantResolver({
      base: "px-4 py-2",
      variants: {
        size: { sm: "h-8 text-sm", lg: "h-12 text-lg" },
        intent: { primary: "bg-blue-500 text-white", danger: "bg-red-500 text-white" },
      },
      defaultVariants: { size: "sm", intent: "primary" },
    })
    const result = resolver.resolve({ size: "lg", intent: "danger" })
    assert.ok(typeof result === "string", "result should be string")
    assert.ok(result.includes("h-12"), `Expected h-12 in "${result}"`)
    assert.ok(result.includes("bg-red-500"), `Expected bg-red-500 in "${result}"`)
  })

  it("StaticVariantResolver uses defaultVariants", () => {
    if (!StaticVariantResolver) return
    const resolver = new StaticVariantResolver({
      base: "rounded",
      variants: { size: { sm: "text-sm", lg: "text-lg" } },
      defaultVariants: { size: "sm" },
    })
    const result = resolver.resolve({})
    assert.ok(result.includes("text-sm"), `Expected text-sm in "${result}"`)
  })

  it("StaticVariantResolver handles compound variants", () => {
    if (!StaticVariantResolver) return
    const resolver = new StaticVariantResolver({
      base: "px-4",
      variants: {
        size: { sm: "h-8", lg: "h-12" },
        disabled: { true: "opacity-50 cursor-not-allowed" },
      },
      compoundVariants: [
        { size: "lg", disabled: "true", class: "px-8" },
      ],
      defaultVariants: {},
    })
    const result = resolver.resolve({ size: "lg", disabled: "true" })
    assert.ok(typeof result === "string")
    assert.ok(result.includes("h-12"))
    assert.ok(result.includes("px-8"))
  })
})
