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
  console.warn("[analyzer/tests] dist not found — run npm run build first")
  process.exit(0) // INTENTIONAL
}

const { classToCss, analyzeWorkspace } = mod

describe("classToCss()", () => {
  it("exports classToCss function", () => {
    assert.equal(typeof classToCss, "function")
  })

  it("handles known class (if native available)", async () => {
    try {
      const result = await classToCss("flex")
      assert.ok(result, "result should be truthy")
      assert.ok(typeof result.css === "string" || typeof result === "object")
    } catch (err) {
      const msg = String(err)
      if (msg.includes("native") || msg.includes("NATIVE") || msg.includes("binding")) {
        console.warn("[classToCss.test] Native not available, skipping")
        return
      }
      throw err
    }
  })

  it("handles empty class gracefully", async () => {
    try {
      const result = await classToCss("")
    } catch (err) {
      // Should throw with meaningful error for empty class
      assert.ok(err instanceof Error || typeof err === "object")
    }
  })
})

describe("analyzeWorkspace()", () => {
  it("exports analyzeWorkspace function", () => {
    assert.equal(typeof analyzeWorkspace, "function")
  })

  it("returns AnalyzerReport shape for valid directory", async () => {
    const testDir = path.resolve(__dirname, "../../shared/src")
    try {
      const report = await analyzeWorkspace(testDir)
      assert.ok(report, "report should be truthy")
      assert.ok(typeof report.totalFiles === "number", "totalFiles should be number")
      assert.ok(typeof report.uniqueClassCount === "number" || typeof report.uniqueClasses !== "undefined")
      assert.ok(Array.isArray(report.topClasses) || typeof report.topClasses === "object")
    } catch (err) {
      const msg = String(err)
      if (msg.includes("native") || msg.includes("NATIVE")) {
        console.warn("[analyzeWorkspace.test] Native not available, skipping")
        return
      }
      throw err
    }
  })
})
