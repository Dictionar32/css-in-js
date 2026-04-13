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
  console.warn("[engine/tests] dist not found — run npm run build first")
  process.exit(0) // INTENTIONAL: skip jika dist tidak ada
}

const { scanWorkspace, analyzeWorkspace, generateSafelist, createEngine } = mod

describe("engine facade — scanWorkspace()", () => {
  it("exports scanWorkspace function", () => {
    assert.equal(typeof scanWorkspace, "function")
  })

  it("accepts options object", async () => {
    // Test bahwa fungsi menerima options tanpa crash
    // Scan di direktori kecil agar cepat
    const testDir = path.resolve(__dirname, "../../shared/src")
    try {
      const result = await scanWorkspace({ root: testDir })
      assert.ok(result, "result should be truthy")
      assert.ok(typeof result.totalFiles === "number")
      assert.ok(Array.isArray(result.uniqueClasses))
      assert.ok(Array.isArray(result.files))
    } catch (err) {
      // Native binding mungkin tidak tersedia di test environment
      if (String(err).includes("native") || String(err).includes("NATIVE")) {
        console.warn("[facade.test] Native not available, skipping scan test")
        return
      }
      throw err
    }
  })
})

describe("engine facade — generateSafelist()", () => {
  it("exports generateSafelist function", () => {
    assert.equal(typeof generateSafelist, "function")
  })

  it("returns array", async () => {
    const testDir = path.resolve(__dirname, "../../shared/src")
    try {
      const safelist = await generateSafelist({ root: testDir })
      assert.ok(Array.isArray(safelist))
    } catch (err) {
      if (String(err).includes("native") || String(err).includes("NATIVE")) {
        console.warn("[facade.test] Native not available, skipping safelist test")
        return
      }
      throw err
    }
  })
})

describe("engine facade — createEngine()", () => {
  it("exports createEngine function", () => {
    assert.equal(typeof createEngine, "function")
  })

  it("createEngine returns engine with expected interface", async () => {
    try {
      const engine = await createEngine({ root: "." })
      assert.ok(engine, "engine should be truthy")
      assert.equal(typeof engine.build, "function")
      assert.equal(typeof engine.scan, "function")
      assert.equal(typeof engine.watch, "function")
    } catch (err) {
      if (String(err).includes("native") || String(err).includes("NATIVE")) {
        console.warn("[facade.test] Native not available, skipping createEngine test")
        return
      }
      throw err
    }
  })
})
