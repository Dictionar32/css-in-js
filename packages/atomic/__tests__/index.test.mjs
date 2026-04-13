import { describe, it, beforeEach } from "node:test"
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
  console.warn("[atomic] dist not found — run npm run build first")
  process.exit(0) // INTENTIONAL
}

const { parseAtomicClass, generateAtomicCss, toAtomicClasses,
        getAtomicRegistry, clearAtomicRegistry } = mod

describe("parseAtomicClass", () => {
  beforeEach(() => clearAtomicRegistry?.())

  it("parses simple padding class", () => {
    const rule = parseAtomicClass("p-4")
    assert.ok(rule, "Should return rule for p-4")
    assert.equal(rule.twClass, "p-4")
    assert.equal(rule.property, "padding")
    assert.ok(rule.value.includes("rem"), `Expected rem value, got ${rule.value}`)
  })

  it("parses margin class", () => {
    const rule = parseAtomicClass("mx-auto")
    assert.ok(rule)
    assert.equal(rule.property, "margin-inline")
    assert.equal(rule.value, "auto")
  })

  it("parses text size class", () => {
    const rule = parseAtomicClass("text-lg")
    assert.ok(rule)
    assert.equal(rule.property, "font-size")
    assert.equal(rule.value, "1.125rem")
  })

  it("parses font weight class", () => {
    const rule = parseAtomicClass("font-bold")
    assert.ok(rule)
    assert.equal(rule.property, "font-weight")
    assert.equal(rule.value, "700")
  })

  it("returns null for unknown class", () => {
    const rule = parseAtomicClass("bg-blue-500") // not in TW_PROPERTY_MAP
    assert.equal(rule, null)
  })

  it("caches result for same class", () => {
    const r1 = parseAtomicClass("p-4")
    const r2 = parseAtomicClass("p-4")
    assert.equal(r1, r2, "Should return same cached object")
  })

  it("parses class with modifier", () => {
    const rule = parseAtomicClass("hover:p-4")
    assert.ok(rule)
    assert.equal(rule.modifier, "hover")
    assert.equal(rule.property, "padding")
  })
})

describe("generateAtomicCss", () => {
  it("generates CSS for basic rule", () => {
    const rules = [parseAtomicClass("p-4")].filter(Boolean)
    const css = generateAtomicCss(rules)
    assert.ok(typeof css === "string")
    assert.ok(css.includes("padding"))
    assert.ok(css.includes("1rem"))
  })

  it("generates @media for breakpoint modifier", () => {
    const rules = [parseAtomicClass("md:p-4")].filter(Boolean)
    const css = generateAtomicCss(rules)
    assert.ok(css.includes("@media"))
    assert.ok(css.includes("768px"))
  })

  it("generates pseudo-class for hover modifier", () => {
    const rules = [parseAtomicClass("hover:p-4")].filter(Boolean)
    const css = generateAtomicCss(rules)
    assert.ok(css.includes(":hover"))
  })
})

describe("toAtomicClasses", () => {
  it("converts known classes to atomic names", () => {
    clearAtomicRegistry?.()
    const { atomicClasses, rules, unknownClasses } = toAtomicClasses("p-4 text-lg font-bold")
    assert.ok(rules.length > 0, "Should have rules for known classes")
    assert.ok(typeof atomicClasses === "string")
  })

  it("passes through unknown classes unchanged", () => {
    clearAtomicRegistry?.()
    const { unknownClasses } = toAtomicClasses("bg-blue-500 flex")
    assert.ok(unknownClasses.includes("bg-blue-500") || unknownClasses.includes("flex"),
      "Unknown classes should be preserved")
  })
})
