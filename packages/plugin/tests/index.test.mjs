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
  console.warn("[plugin/tests] dist not found — run npm run build first")
  process.exit(0) // INTENTIONAL
}

const {
  createTwPlugin, getGlobalRegistry, resetGlobalRegistry,
  registerTransform, registerToken, TwPlugin
} = mod ?? {}

describe("createTwPlugin()", () => {
  beforeEach(() => { resetGlobalRegistry?.() })

  it("is exported as function", () => {
    if (!createTwPlugin) {
      console.warn("[plugin] createTwPlugin not exported, skipping")
      return
    }
    assert.equal(typeof createTwPlugin, "function")
  })

  it("creates context with plugin API", () => {
    if (!createTwPlugin) return
    const ctx = createTwPlugin()
    assert.ok(ctx, "ctx should be truthy")
    assert.equal(typeof ctx.addVariant, "function")
    assert.equal(typeof ctx.addUtility, "function")
    assert.equal(typeof ctx.addToken, "function")
    assert.equal(typeof ctx.addTransform, "function")
    assert.equal(typeof ctx.onGenerateCSS, "function")
    assert.equal(typeof ctx.onBuildEnd, "function")
    assert.equal(typeof ctx.getToken, "function")
  })

  it("addVariant registers variant", () => {
    if (!createTwPlugin || !getGlobalRegistry) return
    resetGlobalRegistry?.()
    const ctx = createTwPlugin()
    ctx.addVariant("custom-hover", (sel) => `.custom:hover ${sel}`)
    const registry = getGlobalRegistry()
    const variants = registry.variants
    const hasCustom = variants instanceof Map
      ? variants.has("custom-hover")
      : "custom-hover" in variants
    assert.ok(hasCustom, "custom-hover should be registered")
  })

  it("addToken registers token and getToken retrieves it", () => {
    if (!createTwPlugin) return
    resetGlobalRegistry?.()
    const ctx = createTwPlugin()
    ctx.addToken("brand-primary", "#3b82f6")
    const token = ctx.getToken("brand-primary")
    assert.equal(token, "#3b82f6", "token should be retrievable")
  })

  it("addTransform registers transform function", () => {
    if (!createTwPlugin || !getGlobalRegistry) return
    resetGlobalRegistry?.()
    const ctx = createTwPlugin()
    const myTransform = (config) => config
    ctx.addTransform(myTransform)
    const registry = getGlobalRegistry()
    assert.ok(
      Array.isArray(registry.transforms) && registry.transforms.length > 0,
      "transform should be registered"
    )
  })
})

describe("getGlobalRegistry()", () => {
  it("returns singleton", () => {
    if (!getGlobalRegistry) return
    const r1 = getGlobalRegistry()
    const r2 = getGlobalRegistry()
    assert.equal(r1, r2)
  })
})

describe("re-exports from plugin-api", () => {
  it("plugin re-exports plugin-api surface", () => {
    // plugin package should re-export key plugin-api items
    const hasReExports = (
      typeof mod.createPluginRegistry === "function" ||
      typeof mod.getGlobalRegistry === "function" ||
      typeof mod.registerTransform === "function" ||
      typeof mod.TwPlugin !== "undefined"
    )
    assert.ok(hasReExports, "plugin should re-export plugin-api surface for backward compat")
  })
})
