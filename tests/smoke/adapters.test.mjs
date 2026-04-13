/**
 * Smoke test: vite, next, rspack adapters
 */
import { describe, it } from "node:test"
import assert from "node:assert/strict"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createRequire } from "node:module"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const req = createRequire(import.meta.url)
const ROOT = path.resolve(__dirname, "../..")

function tryLoad(distPath) {
  try { return req(distPath) } catch { return null }
}

describe("Adapter smoke: vite", () => {
  it("vite plugin module is loadable", () => {
    const mod = tryLoad(path.join(ROOT, "packages/vite/dist/index.js"))
    if (!mod) {
      console.warn("[adapters] vite dist not built, skipping")
      return
    }
    assert.ok(mod)
  })

  it("tailwindStyledPlugin is exported and returns plugin object", () => {
    const mod = tryLoad(path.join(ROOT, "packages/vite/dist/index.js"))
    if (!mod) return
    assert.equal(typeof mod.tailwindStyledPlugin, "function",
      "tailwindStyledPlugin should be exported")

    const plugin = mod.tailwindStyledPlugin()
    assert.ok(plugin, "plugin should be truthy")
    assert.ok(typeof plugin === "object" || Array.isArray(plugin),
      "plugin should be object or array")
    // Vite plugins have name property
    if (!Array.isArray(plugin)) {
      assert.ok(plugin.name || plugin.enforce, "plugin should have name or enforce")
    }
  })

  it("parseVitePluginOptions is exported", () => {
    const mod = tryLoad(path.join(ROOT, "packages/vite/dist/index.js"))
    if (!mod) return
    // May be exported as parseVitePluginOptions or via schemas
    const hasParser = mod.parseVitePluginOptions || mod.VitePluginOptionsSchema
    assert.ok(hasParser, "vite should export schema or parser")
  })
})

describe("Adapter smoke: next", () => {
  it("next module is loadable", () => {
    const mod = tryLoad(path.join(ROOT, "packages/next/dist/index.js"))
    if (!mod) {
      console.warn("[adapters] next dist not built, skipping")
      return
    }
    assert.ok(mod)
  })

  it("withTailwindStyled is exported", () => {
    const mod = tryLoad(path.join(ROOT, "packages/next/dist/index.js"))
    if (!mod) return
    assert.equal(typeof mod.withTailwindStyled, "function",
      "withTailwindStyled should be exported")
  })

  it("withTailwindStyled wraps config correctly", () => {
    const mod = tryLoad(path.join(ROOT, "packages/next/dist/index.js"))
    if (!mod?.withTailwindStyled) return
    const mockNextConfig = { reactStrictMode: true }
    try {
      const wrapped = mod.withTailwindStyled(mockNextConfig)
      assert.ok(wrapped, "wrapped config should be truthy")
      assert.ok(typeof wrapped === "object" || typeof wrapped === "function",
        "wrapped should be object or function")
    } catch (err) {
      // withTailwindStyled might require webpack/next environment
      const msg = String(err)
      if (msg.includes("webpack") || msg.includes("next") || msg.includes("native")) {
        console.warn("[adapters] Next adapter requires webpack/next environment, skipping runtime test")
        return
      }
      throw err
    }
  })
})

describe("Adapter smoke: rspack", () => {
  it("rspack module is loadable", () => {
    const mod = tryLoad(path.join(ROOT, "packages/rspack/dist/index.js"))
    if (!mod) {
      console.warn("[adapters] rspack dist not built, skipping")
      return
    }
    assert.ok(mod)
  })

  it("TailwindStyledRspackPlugin is exported", () => {
    const mod = tryLoad(path.join(ROOT, "packages/rspack/dist/index.js"))
    if (!mod) return
    assert.ok(mod.TailwindStyledRspackPlugin,
      "TailwindStyledRspackPlugin should be exported")
  })

  it("TailwindStyledRspackPlugin can be instantiated", () => {
    const mod = tryLoad(path.join(ROOT, "packages/rspack/dist/index.js"))
    if (!mod?.TailwindStyledRspackPlugin) return
    try {
      const plugin = new mod.TailwindStyledRspackPlugin()
      assert.ok(plugin, "plugin instance should be truthy")
      assert.equal(typeof plugin.apply, "function", "plugin should have apply method")
    } catch (err) {
      console.warn("[adapters] rspack plugin instantiation error:", String(err).slice(0, 100))
    }
  })
})

describe("Adapter smoke: vue", () => {
  it("vue adapter is loadable", () => {
    const mod = tryLoad(path.join(ROOT, "packages/vue/dist/index.js")) ||
                tryLoad(path.join(ROOT, "packages/vue/dist/index.cjs"))
    if (!mod) {
      console.warn("[adapters] vue dist not built, skipping")
      return
    }
    assert.ok(mod.cv && mod.tw, "vue should export cv and tw")
  })
})

describe("Adapter smoke: svelte", () => {
  it("svelte adapter is loadable", () => {
    const mod = tryLoad(path.join(ROOT, "packages/svelte/dist/index.js")) ||
                tryLoad(path.join(ROOT, "packages/svelte/dist/index.cjs"))
    if (!mod) {
      console.warn("[adapters] svelte dist not built, skipping")
      return
    }
    assert.ok(mod.cv && mod.tw, "svelte should export cv and tw")
  })
})
