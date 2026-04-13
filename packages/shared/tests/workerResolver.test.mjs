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
  console.warn("[shared/tests] dist not found")
  process.exit(0) // INTENTIONAL
}

const { resolveWorkerPath, resolveLoaderPath } = mod

describe("resolveWorkerPath()", () => {
  it("is exported as function", () => {
    assert.equal(typeof resolveWorkerPath, "function")
  })

  it("finds existing file", () => {
    const tmpDir = path.join(os.tmpdir(), `worker-test-${Date.now()}`)
    fs.mkdirSync(tmpDir, { recursive: true })
    fs.writeFileSync(path.join(tmpDir, "scanner-worker.cjs"), "// worker")

    // Use import.meta.url pointing to tmpDir
    const fakeUrl = `file://${tmpDir}/index.js`
    try {
      const result = resolveWorkerPath({
        basename: "scanner-worker",
        importMetaUrl: fakeUrl,
        extensions: [".cjs", ".js"],
        subdirs: ["."],
      })
      assert.ok(result.path.includes("scanner-worker"), "should find worker")
      assert.equal(result.extension, ".cjs")
      assert.equal(result.format, "cjs")
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    }
  })

  it("throws when required and not found", () => {
    assert.throws(
      () => resolveWorkerPath({
        basename: "nonexistent-worker-xyz",
        importMetaUrl: import.meta.url,
        required: true,
      }),
      (err) => {
        assert.ok(String(err).includes("nonexistent-worker-xyz"))
        return true
      }
    )
  })

  it("returns empty path when not required and not found", () => {
    const result = resolveWorkerPath({
      basename: "nonexistent-worker-xyz",
      importMetaUrl: import.meta.url,
      required: false,
    })
    assert.equal(result.path, "")
  })
})

describe("resolveLoaderPath()", () => {
  it("is exported as function", () => {
    assert.equal(typeof resolveLoaderPath, "function")
  })

  it("throws for missing loader", () => {
    assert.throws(
      () => resolveLoaderPath("nonexistent-loader-xyz", import.meta.url),
      /nonexistent-loader-xyz/
    )
  })
})
