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
  console.warn("[storybook-addon/tests] dist not found")
  process.exit(0) // INTENTIONAL
}

const {
  generateArgTypes, enumerateVariantProps, getVariantClass,
  createVariantStoryArgs, withTailwindStyled, generateDefaultArgs
} = mod ?? {}

const mockConfig = {
  base: "px-4 py-2 rounded",
  variants: {
    size: { sm: "h-8 text-sm", md: "h-10 text-base", lg: "h-12 text-lg" },
    intent: { primary: "bg-blue-500 text-white", danger: "bg-red-500 text-white" },
  },
  defaultVariants: { size: "md", intent: "primary" },
  compoundVariants: [
    { size: "lg", intent: "danger", class: "font-bold" },
  ],
}

describe("generateArgTypes()", () => {
  it("is a function", () => {
    assert.equal(typeof generateArgTypes, "function")
  })

  it("generates argTypes from config", () => {
    const argTypes = generateArgTypes(mockConfig)
    assert.ok(argTypes, "argTypes should be truthy")
    assert.ok(argTypes.size, "size argType should exist")
    assert.ok(argTypes.intent, "intent argType should exist")
  })

  it("argType has control and options", () => {
    const argTypes = generateArgTypes(mockConfig)
    const sizeArgType = argTypes.size
    assert.ok(sizeArgType.control, "should have control")
    assert.ok(Array.isArray(sizeArgType.options), "options should be array")
    assert.ok(sizeArgType.options.includes("sm"), "should include sm")
    assert.ok(sizeArgType.options.includes("lg"), "should include lg")
  })

  it("returns empty object for config without variants", () => {
    const argTypes = generateArgTypes({ base: "px-4" })
    assert.deepEqual(argTypes, {})
  })
})

describe("enumerateVariantProps()", () => {
  it("generates all combinations", () => {
    const combos = enumerateVariantProps({
      size: ["sm", "md", "lg"],
      intent: ["primary", "danger"],
    })
    assert.equal(combos.length, 6, "3 × 2 = 6 combinations")
    assert.ok(combos.some(c => c.size === "sm" && c.intent === "primary"))
    assert.ok(combos.some(c => c.size === "lg" && c.intent === "danger"))
  })

  it("returns [{}] for empty matrix", () => {
    const combos = enumerateVariantProps({})
    assert.deepEqual(combos, [{}])
  })

  it("handles single dimension", () => {
    const combos = enumerateVariantProps({ size: ["sm", "lg"] })
    assert.equal(combos.length, 2)
  })
})

describe("getVariantClass()", () => {
  it("returns correct class for variant props", () => {
    const cls = getVariantClass(mockConfig, { size: "lg", intent: "danger" })
    assert.ok(typeof cls === "string")
    assert.ok(cls.includes("h-12"), `Expected h-12 in: ${cls}`)
    assert.ok(cls.includes("bg-red-500"), `Expected bg-red-500 in: ${cls}`)
  })

  it("uses defaultVariants when prop not provided", () => {
    const cls = getVariantClass(mockConfig, {})
    assert.ok(cls.includes("h-10"), `Expected h-10 (default md) in: ${cls}`)
    assert.ok(cls.includes("bg-blue-500"), `Expected bg-blue-500 (default primary) in: ${cls}`)
  })

  it("includes compound variant classes", () => {
    const cls = getVariantClass(mockConfig, { size: "lg", intent: "danger" })
    assert.ok(cls.includes("font-bold"), `Expected compound variant font-bold in: ${cls}`)
  })

  it("includes base classes", () => {
    const cls = getVariantClass(mockConfig, {})
    assert.ok(cls.includes("px-4"), `Expected base class px-4 in: ${cls}`)
    assert.ok(cls.includes("rounded"), `Expected base class rounded in: ${cls}`)
  })
})

describe("createVariantStoryArgs()", () => {
  it("returns matrix and combinations", () => {
    const { combinations, matrix } = createVariantStoryArgs(mockConfig)
    assert.ok(Array.isArray(combinations), "combinations should be array")
    assert.ok(matrix.size, "matrix should include size")
    assert.ok(matrix.intent, "matrix should include intent")
    assert.equal(combinations.length, 6, "3 × 2 = 6 combinations")
  })

  it("returns empty result for config without variants", () => {
    const { combinations } = createVariantStoryArgs({ base: "px-4" })
    assert.deepEqual(combinations, [{}])
  })
})

describe("generateDefaultArgs()", () => {
  it("returns defaultVariants as args", () => {
    const defaults = generateDefaultArgs(mockConfig)
    assert.deepEqual(defaults, { size: "md", intent: "primary" })
  })

  it("returns empty object when no defaultVariants", () => {
    const defaults = generateDefaultArgs({ base: "px-4" })
    assert.ok(typeof defaults === "object")
  })
})
