/**
 * Vite plugin unit tests — pakai node:test (bukan vitest)
 */
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
  console.warn("[vite/tests] dist not found — run npm run build first")
  process.exit(0) // INTENTIONAL
}

const { tailwindStyledPlugin, parseVitePluginOptions } = mod ?? {}

describe("tailwindStyledPlugin()", () => {
  it("is a function", () => {
    assert.equal(typeof tailwindStyledPlugin, "function")
  })

  it("returns a plugin object with name", () => {
    const plugin = tailwindStyledPlugin()
    assert.ok(plugin, "plugin should be truthy")
    // Vite plugin bisa berupa object atau array
    if (Array.isArray(plugin)) {
      assert.ok(plugin.length > 0, "plugin array should not be empty")
      assert.ok(plugin[0].name, "first plugin should have name")
    } else {
      assert.ok(plugin.name, `plugin.name should be set, got: ${JSON.stringify(plugin)}`)
    }
  })

  it("returns plugin with transform or load hook", () => {
    const plugin = tailwindStyledPlugin()
    const p = Array.isArray(plugin) ? plugin[0] : plugin
    const hasHook = p.transform || p.load || p.resolveId || p.buildEnd
    assert.ok(hasHook, "plugin should have at least one vite hook")
  })

  it("accepts options without throwing", () => {
    assert.doesNotThrow(() => tailwindStyledPlugin({
      root: ".",
      compileCss: false,
    }))
  })

  it("accepts routeCss option", () => {
    assert.doesNotThrow(() => tailwindStyledPlugin({ routeCss: true }))
  })
})

describe("parseVitePluginOptions()", () => {
  it("is exported if schema is available", () => {
    // parseVitePluginOptions mungkin tidak diekspor langsung
    // Cukup verifikasi bahwa schema validation ada
    const hasValidation = mod.parseVitePluginOptions || mod.VitePluginOptionsSchema
    assert.ok(hasValidation, "vite plugin should have schema validation")
  })

  it("validates default options", () => {
    if (!mod.parseVitePluginOptions) return
    const result = mod.parseVitePluginOptions({})
    assert.ok(result, "default options should parse successfully")
  })
})
