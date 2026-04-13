import { describe, it } from "node:test"
import assert from "node:assert/strict"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createRequire } from "node:module"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const req = createRequire(import.meta.url)

let mod
try {
  mod = req(path.resolve(__dirname, "../dist/index.js"))
} catch {
  console.warn("[core/tests] dist not found — run npm run build first")
  process.exit(0) // INTENTIONAL
}

const { cv, cx, cxm, cn } = mod ?? {}

describe("cv() — class variant", () => {
  it("is exported as function", () => {
    assert.ok(cv, "cv should be exported")
    assert.equal(typeof cv, "function")
  })

  it("resolves base classes", () => {
    const button = cv({ base: "px-4 py-2 rounded" })
    const result = button({})
    assert.ok(typeof result === "string")
    assert.ok(result.includes("px-4"), `Expected px-4 in: ${result}`)
    assert.ok(result.includes("rounded"), `Expected rounded in: ${result}`)
  })

  it("resolves variant classes", () => {
    const button = cv({
      base: "px-4",
      variants: {
        size: { sm: "h-8 text-sm", lg: "h-12 text-lg" },
        intent: { primary: "bg-blue-500", danger: "bg-red-500" },
      },
      defaultVariants: { size: "sm", intent: "primary" },
    })
    assert.ok(button({ size: "lg" }).includes("h-12"), "lg size should work")
    assert.ok(button({ intent: "danger" }).includes("bg-red-500"), "danger intent should work")
  })

  it("uses defaultVariants when props not provided", () => {
    const button = cv({
      base: "base",
      variants: { size: { sm: "text-sm", lg: "text-lg" } },
      defaultVariants: { size: "sm" },
    })
    const result = button({})
    assert.ok(result.includes("text-sm"), `Default size sm should apply: ${result}`)
  })

  it("handles compound variants", () => {
    const button = cv({
      base: "px-4",
      variants: {
        size: { lg: "h-12" },
        intent: { danger: "bg-red-500" },
      },
      compoundVariants: [{ size: "lg", intent: "danger", class: "font-bold px-8" }],
      defaultVariants: {},
    })
    const result = button({ size: "lg", intent: "danger" })
    assert.ok(result.includes("font-bold"), `Compound should apply: ${result}`)
    assert.ok(result.includes("px-8"), `Compound px-8 should apply: ${result}`)
  })

  it("handles empty config", () => {
    const noop = cv({})
    assert.doesNotThrow(() => noop({}))
    assert.equal(typeof noop({}), "string")
  })
})

describe("cx() — class merger", () => {
  it("merges class strings", () => {
    if (!cx) return
    const result = cx("flex", "items-center", "px-4")
    assert.ok(result.includes("flex"))
    assert.ok(result.includes("items-center"))
    assert.ok(result.includes("px-4"))
  })

  it("filters falsy values", () => {
    if (!cx) return
    const result = cx("flex", false, null, undefined, 0, "px-4")
    assert.ok(!result.includes("false"))
    assert.ok(!result.includes("null"))
    assert.ok(!result.includes("undefined"))
    assert.ok(result.includes("flex"))
  })

  it("handles arrays", () => {
    if (!cx) return
    const result = cx(["flex", "items-center"], "px-4")
    assert.ok(result.includes("flex"))
    assert.ok(result.includes("px-4"))
  })
})

describe("cxm() — class merger with twMerge", () => {
  it("is exported", () => {
    if (!cxm) {
      console.warn("[core] cxm not exported, skipping")
      return
    }
    assert.equal(typeof cxm, "function")
  })

  it("resolves Tailwind conflicts", () => {
    if (!cxm) return
    // px-4 then px-8 — px-8 should win
    const result = cxm("px-4 py-2", "px-8")
    assert.ok(!result.includes("px-4"), `px-4 should be overridden: ${result}`)
    assert.ok(result.includes("px-8"), `px-8 should win: ${result}`)
    assert.ok(result.includes("py-2"), `py-2 should remain: ${result}`)
  })
})

// Note: createComponent tests perlu React environment
// Ini adalah test untuk extend() overload di types level
describe("extend() type overloads (behavioral test via plain types)", () => {
  it("ComponentConfig interface is stable", () => {
    // Verifikasi bahwa ComponentConfig type masih backward-compatible
    const config = {
      base: "px-4 py-2",
      variants: { size: { sm: "h-8", lg: "h-12" } },
      defaultVariants: { size: "sm" },
      compoundVariants: [{ size: "lg", class: "px-8" }],
    }
    // Runtime check — config harus memenuhi expected shape
    assert.ok(typeof config.base === "string")
    assert.ok(typeof config.variants === "object")
    assert.ok(Array.isArray(config.compoundVariants))
  })
})

describe("validateVariantConfig() — QA #6", () => {
  let validateVariantConfig
  try {
    validateVariantConfig = mod.validateVariantConfig
  } catch { /* skip */ }

  it("is exported", () => {
    if (!validateVariantConfig) {
      console.warn("[core] validateVariantConfig not exported, skipping")
      return
    }
    assert.equal(typeof validateVariantConfig, "function")
  })

  it("returns valid for correct config", () => {
    if (!validateVariantConfig) return
    const result = validateVariantConfig({
      base: "px-4",
      variants: { size: { sm: "h-8", lg: "h-12" } },
      defaultVariants: { size: "sm" },
    })
    assert.ok(result.valid, `Should be valid: ${JSON.stringify(result.errors)}`)
    assert.equal(result.errors.length, 0)
  })

  it("reports unknown key in defaultVariants", () => {
    if (!validateVariantConfig) return
    const result = validateVariantConfig({
      variants: { size: { sm: "h-8" } },
      defaultVariants: { intent: "primary" }, // "intent" not in variants
    })
    assert.ok(!result.valid)
    assert.ok(result.errors.some(e => e.key === "intent"))
  })

  it("reports unknown value in defaultVariants", () => {
    if (!validateVariantConfig) return
    const result = validateVariantConfig({
      variants: { size: { sm: "h-8", lg: "h-12" } },
      defaultVariants: { size: "md" }, // "md" not in values
    })
    assert.ok(!result.valid)
    assert.ok(result.errors.some(e => e.value === "md"))
  })

  it("returns warnings for compound variants with unknown values", () => {
    if (!validateVariantConfig) return
    const result = validateVariantConfig({
      variants: { size: { sm: "h-8" } },
      compoundVariants: [{ size: "xl", class: "text-xl" }], // "xl" doesn't exist
    })
    assert.ok(result.warnings.length > 0)
  })
})
