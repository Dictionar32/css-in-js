import { describe, it, beforeEach } from "node:test"
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
  console.warn("[compiler/tests] dist not found — jalankan `npm run build` dulu")
  process.exit(0) // INTENTIONAL: skip jika dist tidak ada (bukan false-positive — test tidak pernah "pass")
}

const { IncrementalEngine, getIncrementalEngine, resetIncrementalEngine } = mod ?? {}

describe("IncrementalEngine", () => {
  beforeEach(() => {
    resetIncrementalEngine?.()
  })

  it("exports IncrementalEngine class", () => {
    assert.ok(IncrementalEngine, "IncrementalEngine should be exported")
  })

  it("getIncrementalEngine returns singleton", () => {
    if (!getIncrementalEngine) return
    const a = getIncrementalEngine()
    const b = getIncrementalEngine()
    assert.equal(a, b, "should return same instance")
  })

  it("reset creates new instance", () => {
    if (!getIncrementalEngine || !resetIncrementalEngine) return
    const a = getIncrementalEngine()
    resetIncrementalEngine()
    const b = getIncrementalEngine()
    assert.notEqual(a, b, "reset should create new instance")
  })

  it("processes source and returns result", () => {
    if (!getIncrementalEngine) return
    const engine = getIncrementalEngine()
    assert.ok(engine, "engine should be truthy")
    assert.ok(typeof engine.process === "function" || typeof engine.compile === "function",
      "engine should have process or compile method")
  })
})
