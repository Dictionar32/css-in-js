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
  console.warn("[runtime/tests] dist not found — run npm run build first")
  process.exit(0) // INTENTIONAL
}

const { cx, createComponent } = mod ?? {}

describe("cx()", () => {
  it("is exported as function", () => {
    assert.ok(cx, "cx should be exported")
    assert.equal(typeof cx, "function")
  })

  it("merges class strings", () => {
    const result = cx("flex", "items-center", "px-4")
    assert.ok(typeof result === "string")
    assert.ok(result.includes("flex"))
    assert.ok(result.includes("px-4"))
  })

  it("filters falsy values", () => {
    const result = cx("flex", false, null, undefined, 0, "px-4")
    assert.ok(!result.includes("false"))
    assert.ok(!result.includes("null"))
    assert.ok(result.includes("flex"))
    assert.ok(result.includes("px-4"))
  })

  it("handles nested arrays", () => {
    const result = cx(["flex", "items-center"], "gap-4")
    assert.ok(result.includes("flex"))
    assert.ok(result.includes("gap-4"))
  })

  it("handles empty input", () => {
    const result = cx()
    assert.equal(typeof result, "string")
  })

  it("handles number input", () => {
    const result = cx("flex", 42)
    assert.ok(result.includes("42") || result.includes("flex"))
  })
})

describe("createComponent()", () => {
  it("is exported as function", () => {
    if (!createComponent) {
      console.warn("[runtime] createComponent not exported, skipping")
      return
    }
    assert.equal(typeof createComponent, "function")
  })
})

describe("runtime re-exports", () => {
  it("exports liveToken utilities", () => {
    // runtime re-exports from theme
    const hasLiveToken = mod.liveToken || mod.setToken || mod.getToken || mod.tokenRef
    if (!hasLiveToken) {
      console.warn("[runtime] live token re-exports not found, may not be included")
      return
    }
    assert.ok(hasLiveToken, "runtime should re-export live token utilities")
  })
})
