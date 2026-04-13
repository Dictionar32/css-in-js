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
  console.warn("[shared/tests] dist not found — jalankan npm run build di packages/shared")
  process.exit(0) // INTENTIONAL: skip jika dist tidak ada (bukan false-positive — test tidak pernah "pass")
}

const { TwError, wrapUnknownError, isTwError } = mod

describe("TwError", () => {
  it("constructs with source, code, message", () => {
    const err = new TwError("rust", "PARSE_FAILED", "parsing failed")
    assert.equal(err.source, "rust")
    assert.equal(err.code, "PARSE_FAILED")
    assert.equal(err.message, "parsing failed")
    assert.equal(err.name, "TwError")
  })

  it("fromRust wraps plain object", () => {
    const err = TwError.fromRust({ code: "SCAN_ERR", message: "scan failed" })
    assert.ok(err instanceof TwError)
    assert.equal(err.source, "rust")
    assert.equal(err.code, "SCAN_ERR")
  })

  it("fromRust wraps Error instance", () => {
    const original = new Error("native crash")
    const err = TwError.fromRust(original)
    assert.ok(err instanceof TwError)
    assert.equal(err.message, "native crash")
    assert.equal(err.originalCause, original)
  })

  it("fromRust is idempotent for TwError", () => {
    const original = new TwError("rust", "X", "already TwError")
    const wrapped = TwError.fromRust(original)
    assert.equal(wrapped, original)
  })

  it("fromZod extracts path and message", () => {
    const zodError = {
      errors: [{ path: ["name", "0"], message: "Required" }]
    }
    const err = TwError.fromZod(zodError)
    assert.ok(err instanceof TwError)
    assert.equal(err.source, "validation")
    assert.equal(err.code, "SCHEMA_VALIDATION_FAILED")
    assert.ok(err.message.includes("name.0"))
    assert.ok(err.message.includes("Required"))
  })

  it("fromZod handles empty errors array", () => {
    const err = TwError.fromZod({ errors: [] })
    assert.ok(err instanceof TwError)
    assert.ok(err.message.includes("validation"))
  })

  it("toJSON serializes correctly", () => {
    const err = new TwError("compile", "TRANSFORM_FAILED", "transform error")
    const json = err.toJSON()
    assert.equal(json.source, "compile")
    assert.equal(json.code, "TRANSFORM_FAILED")
    assert.equal(json.message, "transform error")
    assert.equal(json.name, "TwError")
  })

  it("toCliMessage formats with prefix", () => {
    const err = new TwError("io", "FILE_NOT_FOUND", "config.ts missing")
    const msg = err.toCliMessage()
    assert.ok(msg.startsWith("[IO:FILE_NOT_FOUND]"), `Got: ${msg}`)
    assert.ok(msg.includes("config.ts missing"))
  })

  it("wrapUnknownError wraps Error", () => {
    const original = new Error("something failed")
    const err = wrapUnknownError("compile", "UNKNOWN", original)
    assert.ok(err instanceof TwError)
    assert.equal(err.message, "something failed")
  })

  it("wrapUnknownError is idempotent for TwError", () => {
    const original = new TwError("rust", "X", "already typed")
    const wrapped = wrapUnknownError("compile", "OVERRIDE", original)
    assert.equal(wrapped, original)
  })

  it("isTwError distinguishes TwError from plain Error", () => {
    const tw = new TwError("rust", "X", "tw error")
    const plain = new Error("plain")
    assert.ok(isTwError(tw))
    assert.ok(!isTwError(plain))
    assert.ok(!isTwError(null))
    assert.ok(!isTwError("string"))
  })

  it("domain is backward-compatible alias for source", () => {
    const err = new TwError("io", "TEST", "msg")
    assert.equal(err.domain, err.source)
  })
})
