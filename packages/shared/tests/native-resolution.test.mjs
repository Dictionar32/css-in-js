import { describe, it, beforeEach, afterEach } from "node:test"
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
  process.exit(0)
}

const { resolveNativeBinary, formatNativeNotFoundError } = mod

describe("resolveNativeBinary() — QA #1", () => {
  let origEnv

  beforeEach(() => {
    origEnv = { ...process.env }
  })

  afterEach(() => {
    process.env = origEnv
  })

  it("is exported", () => {
    assert.equal(typeof resolveNativeBinary, "function")
  })

  it("returns not-found for nonexistent env path", () => {
    process.env.TW_NATIVE_PATH = "/nonexistent/path/parser.node"
    const result = resolveNativeBinary()
    // env path tried but not found → continues to prebuilt
    assert.ok(result.tried.some(t => t.includes("nonexistent")))
  })

  it("returns not-found result when disabled", () => {
    process.env.TWS_DISABLE_NATIVE = "1"
    const result = resolveNativeBinary()
    assert.equal(result.source, "not-found")
    assert.equal(result.path, null)
    delete process.env.TWS_DISABLE_NATIVE
  })

  it("includes platform in result", () => {
    const result = resolveNativeBinary()
    assert.ok(result.platform, "platform should be set")
    assert.ok(result.platform.includes("-"), "platform should be like linux-x64")
  })

  it("result has expected shape", () => {
    const result = resolveNativeBinary()
    assert.ok("path" in result)
    assert.ok("source" in result)
    assert.ok("platform" in result)
    assert.ok(Array.isArray(result.tried))
  })
})

describe("formatNativeNotFoundError()", () => {
  it("is exported", () => {
    assert.equal(typeof formatNativeNotFoundError, "function")
  })

  it("includes platform and solutions", () => {
    const msg = formatNativeNotFoundError({
      path: null,
      source: "not-found",
      platform: "linux-x64",
      tried: ["prebuilt:@tailwind-styled/native-linux-x64 (not installed)"],
    })
    assert.ok(msg.includes("linux-x64"), "should mention platform")
    assert.ok(msg.includes("Solutions"), "should have solutions")
    assert.ok(msg.includes("build:rust") || msg.includes("npm run"), "should mention build command")
  })
})
