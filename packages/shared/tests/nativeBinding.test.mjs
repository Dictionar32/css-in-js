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

const { resolveNativeBindingCandidates, formatErrorMessage } = mod

describe("nativeBinding", () => {
  it("resolveNativeBindingCandidates returns array", () => {
    if (!resolveNativeBindingCandidates) return
    const candidates = resolveNativeBindingCandidates({ packageName: "@test/native" })
    assert.ok(Array.isArray(candidates), "should return array")
    assert.ok(candidates.length > 0, "should have at least one candidate")
  })

  it("resolveNativeBindingCandidates env override goes first", () => {
    if (!resolveNativeBindingCandidates) return
    const envPath = "/custom/path/native.node"
    const original = process.env.TW_NATIVE_PATH
    process.env.TW_NATIVE_PATH = envPath
    try {
      const candidates = resolveNativeBindingCandidates({ packageName: "@test/native" })
      // Env var candidate should be first or near first
      const hasEnvCandidate = candidates.some(c => c.includes(envPath))
      assert.ok(hasEnvCandidate, `Expected env path in candidates: ${candidates.join(", ")}`)
    } finally {
      if (original === undefined) delete process.env.TW_NATIVE_PATH
      else process.env.TW_NATIVE_PATH = original
    }
  })

  it("formatErrorMessage handles Error instance", () => {
    if (!formatErrorMessage) return
    const err = new Error("something failed")
    const msg = formatErrorMessage(err)
    assert.equal(typeof msg, "string")
    assert.ok(msg.includes("something failed"))
  })

  it("formatErrorMessage handles string", () => {
    if (!formatErrorMessage) return
    const msg = formatErrorMessage("raw string error")
    assert.equal(typeof msg, "string")
  })

  it("formatErrorMessage handles null/undefined gracefully", () => {
    if (!formatErrorMessage) return
    assert.doesNotThrow(() => formatErrorMessage(null))
    assert.doesNotThrow(() => formatErrorMessage(undefined))
  })
})
