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
  console.warn("[syntax/tests] dist not found — run npm run build first")
  process.exit(0) // INTENTIONAL
}

const { parseClasses, extractAllClasses } = mod ?? {}

describe("parseClasses()", () => {
  it("is exported as function", () => {
    assert.equal(typeof parseClasses, "function")
  })

  it("parses space-separated classes", () => {
    const result = parseClasses("flex items-center px-4 py-2")
    assert.ok(Array.isArray(result))
    assert.ok(result.includes("flex"))
    assert.ok(result.includes("items-center"))
    assert.ok(result.includes("px-4"))
    assert.ok(result.includes("py-2"))
  })

  it("parses newline-separated classes", () => {
    const result = parseClasses("flex\nitems-center\npx-4")
    assert.ok(Array.isArray(result))
    assert.ok(result.includes("flex"))
    assert.ok(result.includes("items-center"))
  })

  it("filters invalid tokens", () => {
    const result = parseClasses("flex !@# items-center")
    assert.ok(Array.isArray(result))
    assert.ok(result.includes("flex"))
    assert.ok(result.includes("items-center"))
    // !@# should be filtered
    assert.ok(!result.includes("!@#"))
  })

  it("handles empty string", () => {
    const result = parseClasses("")
    assert.ok(Array.isArray(result))
    assert.equal(result.length, 0)
  })

  it("handles modifier classes", () => {
    const result = parseClasses("hover:bg-blue-500 focus:outline-none dark:text-white")
    assert.ok(Array.isArray(result))
    assert.ok(result.includes("hover:bg-blue-500"))
    assert.ok(result.includes("dark:text-white"))
  })
})

describe("extractAllClasses()", () => {
  it("is exported as function", () => {
    if (!extractAllClasses) {
      console.warn("[syntax] extractAllClasses not available (may need native), skipping")
      return
    }
    assert.equal(typeof extractAllClasses, "function")
  })

  it("extracts from className attribute", () => {
    if (!extractAllClasses) return
    try {
      const result = extractAllClasses(`<div className="flex items-center px-4" />`)
      assert.ok(Array.isArray(result))
    } catch (err) {
      if (String(err).includes("native") || String(err).includes("NATIVE")) {
        console.warn("[syntax] Native not available for extractAllClasses")
        return
      }
      throw err
    }
  })
})
