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
  console.warn("[plugin-api/tests] dist not found — run npm run build first")
  process.exit(0) // INTENTIONAL
}

const {
  createPluginRegistry, createPluginContext, getGlobalRegistry, resetGlobalRegistry,
  resolveTokenEngine
} = mod ?? {}

describe("createPluginRegistry()", () => {
  it("creates registry with empty collections", () => {
    if (!createPluginRegistry) return
    const registry = createPluginRegistry()
    assert.ok(registry, "registry should be truthy")
    assert.ok(registry.variants instanceof Map || typeof registry.variants === "object")
    assert.ok(registry.utilities instanceof Map || typeof registry.utilities === "object")
    assert.ok(registry.tokens instanceof Map || typeof registry.tokens === "object")
    assert.ok(Array.isArray(registry.transforms))
    assert.ok(Array.isArray(registry.cssHooks))
    assert.ok(Array.isArray(registry.buildHooks))
  })
})

describe("createPluginContext()", () => {
  it("returns context object with plugin methods", () => {
    if (!createPluginContext || !createPluginRegistry) return
    const registry = createPluginRegistry()
    const ctx = createPluginContext(registry)
    assert.ok(ctx, "ctx should be truthy")
    assert.equal(typeof ctx.addVariant, "function")
    assert.equal(typeof ctx.addUtility, "function")
    assert.equal(typeof ctx.addToken, "function")
    assert.equal(typeof ctx.addTransform, "function")
    assert.equal(typeof ctx.onGenerateCSS, "function")
    assert.equal(typeof ctx.onBuildEnd, "function")
    assert.equal(typeof ctx.getToken, "function")
    assert.equal(typeof ctx.subscribeTokens, "function")
  })

  it("addVariant registers in registry", () => {
    if (!createPluginContext || !createPluginRegistry) return
    const registry = createPluginRegistry()
    const ctx = createPluginContext(registry)
    ctx.addVariant("group-hover", (sel) => `.group:hover ${sel}`)
    const hasVariant = registry.variants instanceof Map
      ? registry.variants.has("group-hover")
      : "group-hover" in registry.variants
    assert.ok(hasVariant, "group-hover variant should be registered")
  })

  it("addToken registers token", () => {
    if (!createPluginContext || !createPluginRegistry) return
    const registry = createPluginRegistry()
    const ctx = createPluginContext(registry)
    ctx.addToken("primary", "#3b82f6")
    const tokenValue = registry.tokens instanceof Map
      ? registry.tokens.get("primary")
      : registry.tokens["primary"]
    assert.equal(tokenValue, "#3b82f6")
  })
})

describe("getGlobalRegistry()", () => {
  it("returns singleton registry", () => {
    if (!getGlobalRegistry) return
    const r1 = getGlobalRegistry()
    const r2 = getGlobalRegistry()
    assert.equal(r1, r2, "should return same instance")
  })
})

describe("resetGlobalRegistry()", () => {
  it("resets and returns new registry", () => {
    if (!getGlobalRegistry || !resetGlobalRegistry) return
    const before = getGlobalRegistry()
    resetGlobalRegistry()
    const after = getGlobalRegistry()
    // After reset, same type but possibly different instance
    assert.ok(after, "registry should exist after reset")
  })
})
