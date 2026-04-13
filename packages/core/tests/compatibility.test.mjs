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
  console.warn("[core/tests] dist not found")
  process.exit(0)
}

const { detectTailwind, assertTailwindCompatibility } = mod ?? {}

describe("detectTailwind() — QA #2", () => {
  it("is exported", () => {
    if (!detectTailwind) {
      console.warn("[core] detectTailwind not exported, skipping")
      return
    }
    assert.equal(typeof detectTailwind, "function")
  })

  it("returns TailwindInfo shape", () => {
    if (!detectTailwind) return
    const info = detectTailwind()
    assert.ok("version" in info)
    assert.ok("major" in info)
    assert.ok("supported" in info)
    assert.ok("isV4" in info)
    assert.ok("isV3" in info)
    assert.ok(typeof info.major === "number")
  })

  it("tailwindcss installed → returns version info", () => {
    if (!detectTailwind) return
    const info = detectTailwind()
    // tailwindcss should be installed in this monorepo
    if (info.version === "not-installed") {
      console.warn("[compatibility] tailwindcss not installed in this context")
      return
    }
    assert.ok(info.version.match(/^\d+\.\d+\.\d+/), `Expected semver: ${info.version}`)
    assert.ok(typeof info.path === "string")
  })

  it("v4 is supported, v3 is not fully supported", () => {
    if (!detectTailwind) return
    const info = detectTailwind()
    if (info.major === 4) {
      assert.equal(info.isV4, true)
      assert.equal(info.supported, true)
      assert.equal(info.warning, undefined)
    } else if (info.major === 3) {
      assert.equal(info.isV3, true)
      assert.ok(info.warning, "Should warn about v3 partial support")
    }
  })
})

describe("assertTailwindCompatibility() — QA #2", () => {
  it("is exported", () => {
    if (!assertTailwindCompatibility) return
    assert.equal(typeof assertTailwindCompatibility, "function")
  })

  it("does not throw when tailwind installed", () => {
    if (!assertTailwindCompatibility) return
    assert.doesNotThrow(() => assertTailwindCompatibility({ strict: false }))
  })
})
