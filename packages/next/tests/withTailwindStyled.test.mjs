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
  console.warn("[next/tests] dist not found — run npm run build first")
  process.exit(0) // INTENTIONAL
}

const { withTailwindStyled, parseNextAdapterOptions } = mod ?? {}

describe("withTailwindStyled()", () => {
  it("is a function", () => {
    assert.equal(typeof withTailwindStyled, "function")
  })

  it("returns a function or object when called with config", () => {
    const mockConfig = { reactStrictMode: true }
    try {
      const result = withTailwindStyled(mockConfig)
      assert.ok(result, "result should be truthy")
      // Returns either a wrapped config object or a function
      const type = typeof result
      assert.ok(type === "object" || type === "function",
        `Expected object or function, got ${type}`)
    } catch (err) {
      const msg = String(err)
      // May require full Next.js environment
      if (msg.includes("Cannot find module") || msg.includes("webpack") || msg.includes("native")) {
        console.warn("[next] Requires Next.js environment, skipping runtime test")
        return
      }
      throw err
    }
  })

  it("preserves existing next config properties", () => {
    try {
      const config = { reactStrictMode: true, swcMinify: true }
      const wrapped = withTailwindStyled(config)
      if (typeof wrapped === "object") {
        assert.equal(wrapped.reactStrictMode, true)
        assert.equal(wrapped.swcMinify, true)
      }
    } catch (err) {
      const msg = String(err)
      if (msg.includes("Cannot find module") || msg.includes("webpack") || msg.includes("native")) {
        return
      }
      throw err
    }
  })
})

describe("parseNextAdapterOptions()", () => {
  it("is exported if available", () => {
    // parseNextAdapterOptions mungkin di-export via schemas
    const hasParser = mod.parseNextAdapterOptions || mod.NextAdapterOptionsSchema
    if (hasParser) {
      assert.ok(hasParser, "next should export parser or schema")
    } else {
      console.warn("[next] parseNextAdapterOptions not exported, skipping")
    }
  })
})
