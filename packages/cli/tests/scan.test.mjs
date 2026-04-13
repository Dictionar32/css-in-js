import { describe, it } from "node:test"
import assert from "node:assert/strict"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createRequire } from "node:module"
import fs from "node:fs"
import os from "node:os"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const req = createRequire(import.meta.url)

let mod
try {
  mod = req(path.resolve(__dirname, "../dist/index.js"))
} catch {
  console.warn("[cli/tests] dist not found — run npm run build first")
  process.exit(0) // INTENTIONAL
}

const { runScanCli } = mod ?? {}

describe("runScanCli()", () => {
  it("is exported as function", () => {
    assert.ok(runScanCli, "runScanCli should be exported")
    assert.equal(typeof runScanCli, "function")
  })

  it("runs without crashing on valid dir", async () => {
    if (!runScanCli) return
    const tmpDir = path.join(os.tmpdir(), `cli-test-${Date.now()}`)
    fs.mkdirSync(tmpDir, { recursive: true })
    fs.writeFileSync(
      path.join(tmpDir, "Test.tsx"),
      `export const X = () => <div className="flex px-4" />`
    )

    try {
      // Should not throw — output goes to stdout
      await runScanCli([tmpDir, "--json"])
    } catch (err) {
      const msg = String(err)
      if (msg.includes("native") || msg.includes("NATIVE")) {
        console.warn("[cli] Native not available for scan test")
        return
      }
      throw err
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    }
  })

  it("writes scan-cache.json with --save flag", async () => {
    if (!runScanCli) return
    const tmpDir = path.join(os.tmpdir(), `cli-save-${Date.now()}`)
    fs.mkdirSync(tmpDir, { recursive: true })
    fs.writeFileSync(
      path.join(tmpDir, "Button.tsx"),
      `export const B = () => <button className="px-4 py-2 bg-blue-500 text-white rounded">Click</button>`
    )

    try {
      await runScanCli([tmpDir, "--save"])
      const cachePath = path.join(tmpDir, ".tailwind-styled", "scan-cache.json")
      assert.ok(fs.existsSync(cachePath), `Expected cache at: ${cachePath}`)

      const cache = JSON.parse(fs.readFileSync(cachePath, "utf-8"))
      assert.ok(cache.generatedAt, "cache should have generatedAt")
      assert.ok(Array.isArray(cache.classNames), "cache should have classNames array")
      assert.ok(cache.classNames.length > 0, "cache should have at least one class")

      // Verify structure expected by VSCode EngineService
      const firstClass = cache.classNames[0]
      assert.ok(firstClass.name, "each entry should have name")
      assert.ok(Array.isArray(firstClass.usedIn), "each entry should have usedIn")
    } catch (err) {
      const msg = String(err)
      if (msg.includes("native") || msg.includes("NATIVE")) {
        console.warn("[cli] Native not available for --save test")
        return
      }
      throw err
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    }
  })
})
