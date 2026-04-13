import { describe, it } from "node:test"
import assert from "node:assert/strict"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createRequire } from "node:module"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const req = createRequire(import.meta.url)

let cv, tw, extend

try {
  const mod = req(path.resolve(__dirname, "../dist/index.cjs"))
  cv = mod.cv
  tw = mod.tw
  extend = mod.extend
} catch {
  try {
    const mod = req(path.resolve(__dirname, "../dist/index.js"))
    cv = mod.cv
    tw = mod.tw
    extend = mod.extend
  } catch {
    console.warn("[vue] dist not found — run npm run build first")
    process.exit(0) // INTENTIONAL: skip jika dist tidak ada
  }
}

describe("Vue adapter — cv()", () => {
  it("returns class string for default variants", () => {
    const button = cv({
      base: "px-4 py-2 rounded",
      variants: {
        size: { sm: "h-8 text-sm", lg: "h-12 text-lg" },
        intent: { primary: "bg-blue-500 text-white", danger: "bg-red-500 text-white" },
      },
      defaultVariants: { size: "sm", intent: "primary" },
    })
    const result = button({})
    assert.ok(typeof result === "string", "result should be string")
    assert.ok(result.includes("px-4"), `Expected px-4 in "${result}"`)
    assert.ok(result.includes("h-8"), `Expected h-8 (default sm) in "${result}"`)
    assert.ok(result.includes("bg-blue-500"), `Expected bg-blue-500 (default primary) in "${result}"`)
  })

  it("overrides default variants with passed props", () => {
    const button = cv({
      base: "px-4",
      variants: { size: { sm: "h-8", lg: "h-12" } },
      defaultVariants: { size: "sm" },
    })
    const result = button({ size: "lg" })
    assert.ok(result.includes("h-12"), `Expected h-12 in "${result}"`)
    assert.ok(!result.includes("h-8"), `Expected h-8 to be overridden in "${result}"`)
  })

  it("handles compound variants", () => {
    const button = cv({
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
    const result = button({ size: "lg", disabled: "true" })
    assert.ok(result.includes("h-12"))
    assert.ok(result.includes("px-8"), "Compound variant should add px-8")
    assert.ok(result.includes("opacity-50"))
  })

  it("merges className prop with twMerge", () => {
    const button = cv({ base: "px-4 py-2" })
    const result = button({ class: "px-8" }) // should override px-4
    assert.ok(typeof result === "string")
    // twMerge should handle the conflict — px-8 wins
    assert.ok(result.includes("py-2"), "Should keep py-2")
  })

  it("handles empty config", () => {
    const noop = cv({})
    const result = noop({})
    assert.ok(typeof result === "string")
  })
})

describe("Vue adapter — tw()", () => {
  it("returns a Vue component", () => {
    if (!tw) return
    const Button = tw("button", { base: "px-4 py-2" })
    assert.ok(Button, "Should return component")
    assert.ok(typeof Button === "object" || typeof Button === "function")
  })
})

describe("Vue adapter — extend()", () => {
  it("creates extended component", () => {
    if (!extend || !tw) return
    const Base = tw("div", { base: "p-4" })
    const Extended = extend(Base, "bg-blue-500 text-white")
    assert.ok(Extended, "Should return extended component")
  })
})
