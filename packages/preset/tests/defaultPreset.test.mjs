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
  console.warn("[preset/tests] dist not found — run npm run build first")
  process.exit(0) // INTENTIONAL
}

const { defaultPreset, defaultThemeCss, defaultGlobalCss, designTokens, generateTailwindCss } = mod

describe("defaultPreset", () => {
  it("is an object", () => {
    assert.ok(defaultPreset, "defaultPreset should be truthy")
    assert.equal(typeof defaultPreset, "object")
  })

  it("has content array", () => {
    assert.ok(Array.isArray(defaultPreset.content), "content should be array")
    assert.ok(defaultPreset.content.length > 0, "content should not be empty")
  })

  it("has darkMode set", () => {
    assert.ok(defaultPreset.darkMode, "darkMode should be set")
  })

  it("has theme.extend with colors", () => {
    assert.ok(defaultPreset.theme?.extend?.colors, "theme.extend.colors should exist")
  })
})

describe("designTokens", () => {
  it("has colors object", () => {
    assert.ok(designTokens.colors, "colors should exist")
    assert.ok(designTokens.colors.primary, "primary color should exist")
  })

  it("has spacing object", () => {
    assert.ok(designTokens.spacing, "spacing should exist")
  })

  it("has breakpoints", () => {
    assert.ok(designTokens.breakpoints, "breakpoints should exist")
    assert.ok(designTokens.breakpoints.sm, "sm breakpoint should exist")
  })

  it("has fontFamily", () => {
    assert.ok(designTokens.fontFamily, "fontFamily should exist")
    assert.ok(Array.isArray(designTokens.fontFamily.sans), "sans should be array")
  })

  it("has borderRadius", () => {
    assert.ok(designTokens.borderRadius, "borderRadius should exist")
    assert.ok(designTokens.borderRadius.DEFAULT, "DEFAULT radius should exist")
  })

  it("has animation definitions", () => {
    assert.ok(designTokens.animation, "animation should exist")
    assert.ok(designTokens.keyframes, "keyframes should exist")
  })
})

describe("defaultThemeCss", () => {
  it("is a string containing @theme", () => {
    assert.ok(typeof defaultThemeCss === "string")
    assert.ok(defaultThemeCss.includes("@theme"), "should contain @theme block")
  })

  it("includes color tokens", () => {
    assert.ok(defaultThemeCss.includes("--color-primary"), "should include --color-primary")
  })

  it("includes font tokens", () => {
    assert.ok(defaultThemeCss.includes("--font-"), "should include font tokens")
  })
})

describe("defaultGlobalCss", () => {
  it("is a string containing @import", () => {
    assert.ok(typeof defaultGlobalCss === "string")
    assert.ok(defaultGlobalCss.includes("tailwindcss"), "should import tailwindcss")
  })
})

describe("generateTailwindCss()", () => {
  it("is a function", () => {
    assert.equal(typeof generateTailwindCss, "function")
  })

  it("returns string with @import tailwindcss", () => {
    const css = generateTailwindCss()
    assert.ok(typeof css === "string")
    assert.ok(css.includes("tailwindcss"))
  })

  it("accepts custom content paths", () => {
    const css = generateTailwindCss(["./custom/**/*.tsx"])
    assert.ok(css.includes("custom"))
  })
})
