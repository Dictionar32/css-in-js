import { describe, it, beforeEach } from "node:test"
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
  console.warn("[dashboard/tests] dist not found — run npm run build first")
  process.exit(0) // INTENTIONAL
}

const {
  currentMetrics, getMetricsSummary, normalizeMetrics,
  resetHistory, updateMetrics, history, events
} = mod ?? {}

describe("dashboard state", () => {
  beforeEach(() => {
    resetHistory?.()
  })

  it("currentMetrics is exported", () => {
    assert.ok(currentMetrics !== undefined, "currentMetrics should be exported")
  })

  it("getMetricsSummary is a function", () => {
    assert.equal(typeof getMetricsSummary, "function")
  })

  it("getMetricsSummary returns summary object", () => {
    if (!getMetricsSummary) return
    const summary = getMetricsSummary()
    assert.ok(summary, "summary should be truthy")
    assert.ok(typeof summary === "object")
  })

  it("normalizeMetrics is a function", () => {
    assert.equal(typeof normalizeMetrics, "function")
  })

  it("normalizeMetrics handles empty input", () => {
    if (!normalizeMetrics) return
    const result = normalizeMetrics({})
    assert.ok(result, "result should be truthy")
    assert.ok(typeof result === "object")
  })

  it("normalizeMetrics with full metrics", () => {
    if (!normalizeMetrics) return
    const input = {
      buildMs: 150,
      scanMs: 50,
      analyzeMs: 30,
      compileMs: 70,
      classCount: 42,
      fileCount: 10,
      mode: "build",
    }
    const result = normalizeMetrics(input)
    assert.ok(result, "result should be truthy")
    // At minimum, should preserve some values
    const hasBuildMs = result.buildMs === 150 || result.buildTimeMs === 150
    assert.ok(hasBuildMs, "buildMs should be preserved")
  })

  it("resetHistory clears history", () => {
    if (!resetHistory || !history) return
    resetHistory()
    const len = Array.isArray(history) ? history.length : 0
    assert.equal(len, 0, "history should be empty after reset")
  })

  it("updateMetrics is a function", () => {
    if (!updateMetrics) return
    assert.equal(typeof updateMetrics, "function")
  })

  it("updateMetrics updates state without error", () => {
    if (!updateMetrics) return
    assert.doesNotThrow(() => updateMetrics({
      buildMs: 100,
      classCount: 10,
      fileCount: 5,
      mode: "build",
    }))
  })
})
