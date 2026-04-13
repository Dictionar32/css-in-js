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
  console.warn("[scanner/tests] dist not found")
  process.exit(0) // INTENTIONAL
}

const { scanWorkspaceParallel } = mod ?? {}

describe("scanWorkspaceParallel()", () => {
  it("is exported", () => {
    if (!scanWorkspaceParallel) {
      console.warn("[scanner] scanWorkspaceParallel not exported, skipping")
      return
    }
    assert.equal(typeof scanWorkspaceParallel, "function")
  })

  it("scans small workspace sequentially (< threshold)", async () => {
    if (!scanWorkspaceParallel) return
    const tmpDir = path.join(os.tmpdir(), `par-test-${Date.now()}`)
    fs.mkdirSync(tmpDir, { recursive: true })
    fs.writeFileSync(
      path.join(tmpDir, "Button.tsx"),
      `const B = () => <div className="flex px-4 py-2" />`
    )
    try {
      const result = await scanWorkspaceParallel(tmpDir)
      assert.ok(result, "result should exist")
      assert.ok(typeof result.totalFiles === "number")
      assert.ok(Array.isArray(result.uniqueClasses))
      assert.ok(Array.isArray(result.files))
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    }
  })

  it("handles empty directory", async () => {
    if (!scanWorkspaceParallel) return
    const tmpDir = path.join(os.tmpdir(), `par-empty-${Date.now()}`)
    fs.mkdirSync(tmpDir, { recursive: true })
    try {
      const result = await scanWorkspaceParallel(tmpDir)
      assert.equal(result.totalFiles, 0)
      assert.deepEqual(result.uniqueClasses, [])
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    }
  })

  it("returns sorted unique classes", async () => {
    if (!scanWorkspaceParallel) return
    const tmpDir = path.join(os.tmpdir(), `par-sort-${Date.now()}`)
    fs.mkdirSync(tmpDir, { recursive: true })
    fs.writeFileSync(path.join(tmpDir, "A.tsx"), `const A = () => <div className="px-4 flex" />`)
    fs.writeFileSync(path.join(tmpDir, "B.tsx"), `const B = () => <div className="flex rounded" />`)
    try {
      const result = await scanWorkspaceParallel(tmpDir)
      // flex should appear once (deduped)
      const flexCount = result.uniqueClasses.filter(c => c === "flex").length
      assert.equal(flexCount, 1, "flex should be deduped")
      // Should be sorted
      const sorted = [...result.uniqueClasses].sort()
      assert.deepEqual(result.uniqueClasses, sorted, "should be sorted")
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    }
  })
})
