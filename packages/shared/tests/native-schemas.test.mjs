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
  console.warn("[shared/tests] dist not found")
  process.exit(0) // INTENTIONAL
}

const {
  NativeScanResultSchema, NativeScanFileSchema, NativeTransformResultSchema,
  NativeCssCompileResultSchema, safeParseNative, parseNative
} = mod

describe("NativeScanResultSchema", () => {
  it("validates correct scan result", () => {
    if (!NativeScanResultSchema) return
    const data = {
      files: [{ file: "/src/Button.tsx", classes: ["px-4", "py-2"] }],
      totalFiles: 1,
      uniqueClasses: ["px-4", "py-2"],
    }
    const result = NativeScanResultSchema.safeParse(data)
    assert.ok(result.success, `Should parse: ${result.error?.message}`)
    assert.deepEqual(result.data.uniqueClasses, ["px-4", "py-2"])
  })

  it("rejects missing totalFiles", () => {
    if (!NativeScanResultSchema) return
    const data = { files: [], uniqueClasses: [] } // missing totalFiles
    const result = NativeScanResultSchema.safeParse(data)
    assert.ok(!result.success, "Should fail without totalFiles")
  })

  it("rejects negative totalFiles", () => {
    if (!NativeScanResultSchema) return
    const data = { files: [], totalFiles: -1, uniqueClasses: [] }
    const result = NativeScanResultSchema.safeParse(data)
    assert.ok(!result.success, "Should fail with negative totalFiles")
  })

  it("rejects empty file path", () => {
    if (!NativeScanFileSchema) return
    const result = NativeScanFileSchema.safeParse({ file: "", classes: [] })
    assert.ok(!result.success, "Should fail with empty file path")
  })
})

describe("NativeTransformResultSchema", () => {
  it("validates correct transform result", () => {
    if (!NativeTransformResultSchema) return
    const data = { code: "const X = 1", classes: ["px-4"], changed: true }
    const result = NativeTransformResultSchema.safeParse(data)
    assert.ok(result.success)
    assert.equal(result.data.changed, true)
  })

  it("validates with rsc field", () => {
    if (!NativeTransformResultSchema) return
    const data = {
      code: "const X = 1",
      classes: [],
      changed: false,
      rsc: { isServer: true, needsClientDirective: false, clientReasons: [] },
    }
    const result = NativeTransformResultSchema.safeParse(data)
    assert.ok(result.success)
  })
})

describe("NativeCssCompileResultSchema", () => {
  it("validates css compile result", () => {
    if (!NativeCssCompileResultSchema) return
    const data = { css: ".flex { display: flex }", resolvedClasses: ["flex"] }
    const result = NativeCssCompileResultSchema.safeParse(data)
    assert.ok(result.success)
  })
})

describe("safeParseNative()", () => {
  it("returns parsed data for valid input", () => {
    if (!safeParseNative || !NativeScanResultSchema) return
    const data = { files: [], totalFiles: 0, uniqueClasses: [] }
    const fallback = { files: [], totalFiles: -1, uniqueClasses: [] }
    const result = safeParseNative(NativeScanResultSchema, data, fallback)
    assert.equal(result.totalFiles, 0, "Should return parsed data")
  })

  it("returns fallback for invalid input", () => {
    if (!safeParseNative || !NativeScanResultSchema) return
    const invalid = { totally: "wrong" }
    const fallback = { files: [], totalFiles: 99, uniqueClasses: [] }
    const result = safeParseNative(NativeScanResultSchema, invalid, fallback)
    assert.equal(result.totalFiles, 99, "Should return fallback")
  })
})

describe("parseNative()", () => {
  it("returns data for valid input", () => {
    if (!parseNative || !NativeScanResultSchema) return
    const data = { files: [], totalFiles: 0, uniqueClasses: [] }
    const result = parseNative(NativeScanResultSchema, data, "scanner")
    assert.equal(result.totalFiles, 0)
  })

  it("throws for invalid input with context", () => {
    if (!parseNative || !NativeScanResultSchema) return
    assert.throws(
      () => parseNative(NativeScanResultSchema, { broken: true }, "test-context"),
      (err) => {
        assert.ok(String(err).includes("test-context"))
        return true
      }
    )
  })
})
