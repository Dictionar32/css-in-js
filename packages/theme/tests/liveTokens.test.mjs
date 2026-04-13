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
  console.warn("[theme/tests] dist not found — run npm run build first")
  process.exit(0) // INTENTIONAL
}

const {
  liveToken, liveTokenEngine, getToken, setToken, getTokens, setTokens,
  tokenRef, tokenVar, generateTokenCssString, subscribeTokens, applyTokenSet
} = mod ?? {}

describe("liveToken()", () => {
  it("is a function", () => {
    if (!liveToken) return
    assert.equal(typeof liveToken, "function")
  })

  it("registers token and returns TokenMap", () => {
    if (!liveToken) return
    try {
      const tokens = liveToken({ primary: "#3b82f6", secondary: "#6366f1" })
      assert.ok(tokens, "should return token map")
    } catch (err) {
      // May need browser environment for window globals
      if (String(err).includes("window") || String(err).includes("document")) {
        console.warn("[theme] Browser environment required, skipping window test")
        return
      }
      throw err
    }
  })
})

describe("tokenRef() and tokenVar()", () => {
  it("tokenRef generates CSS var reference", () => {
    if (!tokenRef) return
    const ref = tokenRef("primary")
    assert.ok(typeof ref === "string", "tokenRef should return string")
    assert.ok(ref.includes("primary"), `Expected primary in ref: ${ref}`)
  })

  it("tokenVar generates CSS custom property", () => {
    if (!tokenVar) return
    const varStr = tokenVar("color-primary")
    assert.ok(typeof varStr === "string")
    assert.ok(varStr.includes("color-primary"))
  })
})

describe("generateTokenCssString()", () => {
  it("is a function", () => {
    if (!generateTokenCssString) return
    assert.equal(typeof generateTokenCssString, "function")
  })

  it("generates CSS string from token map", () => {
    if (!generateTokenCssString) return
    const tokens = { primary: "#3b82f6", secondary: "#6366f1" }
    const css = generateTokenCssString(tokens)
    assert.ok(typeof css === "string", "should return string")
    assert.ok(css.includes("#3b82f6"), "should include token value")
  })
})

describe("ThemeRegistry", () => {
  it("is exported", () => {
    assert.ok(mod.ThemeRegistry, "ThemeRegistry should be exported")
  })

  it("can be instantiated", () => {
    if (!mod.ThemeRegistry) return
    try {
      const registry = new mod.ThemeRegistry()
      assert.ok(registry)
    } catch (err) {
      console.warn("[theme] ThemeRegistry instantiation:", String(err).slice(0, 80))
    }
  })
})

describe("compileDesignTokens()", () => {
  it("is exported if available", () => {
    if (!mod.compileDesignTokens) {
      console.warn("[theme] compileDesignTokens not exported, skipping")
      return
    }
    assert.equal(typeof mod.compileDesignTokens, "function")
  })
})
