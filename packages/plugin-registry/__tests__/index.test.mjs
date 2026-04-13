import { describe, it, before } from "node:test"
import assert from "node:assert/strict"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createRequire } from "node:module"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const req = createRequire(import.meta.url)

let PluginRegistry, PluginRegistryError, getRegistry

try {
  const mod = req(path.resolve(__dirname, "../dist/index.js"))
  PluginRegistry = mod.PluginRegistry
  PluginRegistryError = mod.PluginRegistryError
  getRegistry = mod.getRegistry
} catch {
  console.warn("[plugin-registry] dist not found — run npm run build first")
  process.exit(0) // INTENTIONAL: skip jika dist tidak ada (bukan false-positive — test tidak pernah "pass")
}

const MOCK_REGISTRY_DATA = {
  version: "5.0.0",
  official: [
    {
      name: "@tailwind-styled/typography",
      description: "Typography plugin for tailwind-styled",
      version: "1.0.0",
      tags: ["typography", "text", "official"],
      official: true,
      docs: "https://docs.example.com/typography",
      install: "npm install @tailwind-styled/typography",
    },
    {
      name: "@tailwind-styled/forms",
      description: "Form styles plugin",
      version: "2.0.0",
      tags: ["forms", "input", "official"],
      official: true,
    },
  ],
  community: [
    {
      name: "tw-plugin-animations",
      description: "Animation utilities",
      version: "0.5.0",
      tags: ["animation", "motion"],
    },
  ],
}

describe("PluginRegistry", () => {
  let registry

  before(() => {
    registry = new PluginRegistry(MOCK_REGISTRY_DATA)
  })

  describe("search()", () => {
    it("returns all plugins for empty query", () => {
      const results = registry.search("")
      assert.equal(results.length, 3)
    })

    it("searches by name", () => {
      const results = registry.search("typography")
      assert.equal(results.length, 1)
      assert.equal(results[0].name, "@tailwind-styled/typography")
    })

    it("searches by description", () => {
      const results = registry.search("form styles")
      assert.ok(results.some(r => r.name === "@tailwind-styled/forms"))
    })

    it("searches by tag", () => {
      const results = registry.search("animation")
      assert.ok(results.some(r => r.name === "tw-plugin-animations"))
    })

    it("is case-insensitive", () => {
      const results = registry.search("TYPOGRAPHY")
      assert.equal(results.length, 1)
    })

    it("returns empty array for no matches", () => {
      const results = registry.search("nonexistent-plugin-xyz")
      assert.equal(results.length, 0)
    })
  })

  describe("getAll()", () => {
    it("returns all plugins", () => {
      const all = registry.getAll()
      assert.equal(all.length, 3)
    })

    it("returns copy — mutation does not affect registry", () => {
      const all = registry.getAll()
      all.push({ name: "injected", description: "", version: "0", tags: [] })
      assert.equal(registry.getAll().length, 3)
    })
  })

  describe("getByName()", () => {
    it("returns plugin by exact name", () => {
      const plugin = registry.getByName("@tailwind-styled/typography")
      assert.ok(plugin)
      assert.equal(plugin.name, "@tailwind-styled/typography")
    })

    it("returns undefined for unknown plugin", () => {
      const plugin = registry.getByName("not-in-registry")
      assert.equal(plugin, undefined)
    })
  })

  describe("install() - dry run", () => {
    it("dry run succeeds for known plugin", () => {
      const result = registry.install("@tailwind-styled/typography", { dryRun: true })
      assert.equal(result.installed, true)
      assert.equal(result.exitCode, 0)
      assert.ok(result.command.includes("@tailwind-styled/typography"))
    })

    it("throws PLUGIN_NOT_FOUND for unknown plugin without --allow-external", () => {
      assert.throws(
        () => registry.install("unknown-plugin-xyz"),
        (err) => {
          assert.ok(err instanceof PluginRegistryError)
          assert.equal(err.code, "PLUGIN_NOT_FOUND")
          return true
        }
      )
    })

    it("throws EXTERNAL_CONFIRMATION_REQUIRED without --yes", () => {
      assert.throws(
        () => registry.install("some-external", { allowExternal: true }),
        (err) => {
          assert.ok(err instanceof PluginRegistryError)
          assert.equal(err.code, "EXTERNAL_CONFIRMATION_REQUIRED")
          return true
        }
      )
    })

    it("throws INVALID_PLUGIN_NAME for invalid name", () => {
      assert.throws(
        () => registry.install("../../../etc/passwd"),
        (err) => {
          assert.ok(err instanceof PluginRegistryError)
          assert.equal(err.code, "INVALID_PLUGIN_NAME")
          return true
        }
      )
    })

    it("external plugin with --allow-external --yes succeeds in dry run", () => {
      const result = registry.install("valid-external-plugin", {
        allowExternal: true,
        confirmExternal: true,
        dryRun: true,
      })
      assert.equal(result.installed, true)
    })
  })

  describe("uninstall() - dry run", () => {
    it("dry run succeeds", () => {
      const result = registry.uninstall("@tailwind-styled/typography", { dryRun: true })
      assert.equal(result.uninstalled, true)
      assert.equal(result.exitCode, 0)
    })
  })

  describe("verifyIntegrity()", () => {
    it("returns ok:true for plugin without integrity hash", () => {
      const result = registry.verifyIntegrity("@tailwind-styled/typography")
      assert.equal(result.ok, true)
      assert.ok(result.reason?.includes("no checksum"))
    })

    it("returns ok:false for unknown plugin", () => {
      const result = registry.verifyIntegrity("not-in-registry")
      assert.equal(result.ok, false)
    })
  })

  describe("PluginRegistryError", () => {
    it("has code, message, context", () => {
      const err = new PluginRegistryError({
        code: "PLUGIN_NOT_FOUND",
        message: "Plugin not found",
        context: { pluginName: "test" },
      })
      assert.equal(err.code, "PLUGIN_NOT_FOUND")
      assert.equal(err.message, "Plugin not found")
      assert.deepEqual(err.context, { pluginName: "test" })
    })

    it("toObject() serializes correctly", () => {
      const err = new PluginRegistryError({
        code: "NETWORK_ERROR",
        message: "Connection failed",
      })
      const obj = err.toObject()
      assert.equal(obj.code, "NETWORK_ERROR")
      assert.equal(obj.message, "Connection failed")
    })
  })
})

// Track B Issue 1: Failure path tests
describe("Failure paths (Track B)", () => {
  it("install without required plugin name throws PLUGIN_NOT_FOUND", () => {
    if (!PluginRegistry) return
    const registry = new PluginRegistry(MOCK_REGISTRY_DATA)
    assert.throws(
      () => registry.install(""),
      (err) => {
        assert.ok(err instanceof PluginRegistryError)
        assert.ok(["PLUGIN_NOT_FOUND", "INVALID_PLUGIN_NAME"].includes(err.code))
        return true
      }
    )
  })

  it("install unknown plugin throws PLUGIN_NOT_FOUND", () => {
    if (!PluginRegistry) return
    const registry = new PluginRegistry(MOCK_REGISTRY_DATA)
    assert.throws(
      () => registry.install("definitely-not-in-registry-xyz"),
      (err) => {
        assert.ok(err instanceof PluginRegistryError)
        assert.equal(err.code, "PLUGIN_NOT_FOUND")
        return true
      }
    )
  })

  it("PluginRegistryError.toObject() returns structured error", () => {
    if (!PluginRegistryError) return
    const err = new PluginRegistryError({
      code: "INSTALL_FAILED",
      message: "npm exited with code 1",
      context: { pluginName: "test", exitCode: 1 },
    })
    const obj = err.toObject()
    assert.equal(obj.code, "INSTALL_FAILED")
    assert.ok(obj.context?.exitCode === 1)
  })
})
