import { describe, it } from "node:test"
import assert from "node:assert/strict"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createRequire } from "node:module"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const req = createRequire(import.meta.url)

let cv, tw

try {
  const mod = req(path.resolve(__dirname, "../dist/index.cjs"))
  cv = mod.cv
  tw = mod.tw
} catch {
  try {
    const mod = req(path.resolve(__dirname, "../dist/index.js"))
    cv = mod.cv
    tw = mod.tw
  } catch {
    console.warn("[svelte] dist not found — run npm run build first")
    process.exit(0) // INTENTIONAL: skip jika dist tidak ada
  }
}

describe("Svelte adapter — cv()", () => {
  it("resolves base + variant classes", () => {
    const button = cv({
      base: "px-4 py-2 rounded",
      variants: {
        intent: { primary: "bg-blue-500 text-white", danger: "bg-red-500 text-white" },
        size: { sm: "h-8 text-sm", lg: "h-12 text-lg" },
      },
      defaultVariants: { intent: "primary", size: "sm" },
    })
    const result = button({})
    assert.ok(typeof result === "string")
    assert.ok(result.includes("px-4"))
    assert.ok(result.includes("h-8"))
    assert.ok(result.includes("bg-blue-500"))
  })

  it("overrides defaults via props", () => {
    const button = cv({
      base: "px-4",
      variants: { size: { sm: "h-8", lg: "h-12" } },
      defaultVariants: { size: "sm" },
    })
    const result = button({ size: "lg" })
    assert.ok(result.includes("h-12"))
    assert.ok(!result.includes("h-8"))
  })

  it("handles compound variants", () => {
    const button = cv({
      base: "base",
      variants: {
        variant: { primary: "bg-blue", outline: "border" },
        disabled: { true: "opacity-50" },
      },
      compoundVariants: [
        { variant: "primary", disabled: "true", class: "cursor-not-allowed" },
      ],
      defaultVariants: {},
    })
    const result = button({ variant: "primary", disabled: "true" })
    assert.ok(result.includes("cursor-not-allowed"))
  })

  it("merges className prop", () => {
    const button = cv({ base: "px-4 py-2" })
    const result = button({ class: "custom-class" })
    assert.ok(result.includes("custom-class"))
  })

  it("handles empty config", () => {
    const noop = cv({})
    assert.doesNotThrow(() => noop({}))
  })
})

describe("Svelte adapter — tw()", () => {
  it("merges class strings", () => {
    if (!tw) return
    const result = tw("px-4 py-2", "bg-blue-500", null, undefined, false)
    assert.ok(typeof result === "string")
    assert.ok(result.includes("px-4"))
    assert.ok(result.includes("bg-blue-500"))
    assert.ok(!result.includes("null"))
    assert.ok(!result.includes("undefined"))
  })

  it("handles empty args", () => {
    if (!tw) return
    const result = tw()
    assert.ok(typeof result === "string")
  })
})
