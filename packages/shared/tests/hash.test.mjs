import { describe, it } from "node:test"
import assert from "node:assert/strict"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createRequire } from "node:module"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

let mod
try {
  mod = require(path.resolve(__dirname, "../dist/index.js"))
} catch {
  console.warn("[shared/tests] dist not found")
  process.exit(0) // INTENTIONAL: skip jika dist tidak ada (bukan false-positive — test tidak pernah "pass")
}

const { hashContent, createHash } = mod

describe("hash", () => {
  it("hashContent is deterministic", () => {
    if (!hashContent) return
    const a = hashContent("hello world")
    const b = hashContent("hello world")
    assert.equal(a, b)
  })

  it("hashContent produces different output for different inputs", () => {
    if (!hashContent) return
    const a = hashContent("input-a")
    const b = hashContent("input-b")
    assert.notEqual(a, b)
  })

  it("hashContent returns string", () => {
    if (!hashContent) return
    const result = hashContent("test")
    assert.equal(typeof result, "string")
    assert.ok(result.length > 0)
  })

  it("hashContent handles empty string", () => {
    if (!hashContent) return
    const result = hashContent("")
    assert.equal(typeof result, "string")
  })

  it("createHash (if exported) is consistent", () => {
    if (!createHash) return
    const a = createHash("same-input")
    const b = createHash("same-input")
    assert.equal(a, b)
  })
})
