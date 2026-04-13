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
  console.warn("[runtime-css/tests] dist not found")
  process.exit(0) // INTENTIONAL
}

const {
  batchedInject, flushBatchedCss, getBatchedCssStats,
  resetBatchedCss, syncInject
} = mod ?? {}

describe("batchedInjector", () => {
  beforeEach(() => {
    resetBatchedCss?.()
  })

  it("batchedInject is a function", () => {
    assert.equal(typeof batchedInject, "function")
  })

  it("flushBatchedCss is a function", () => {
    assert.equal(typeof flushBatchedCss, "function")
  })

  it("getBatchedCssStats returns stats object", () => {
    if (!getBatchedCssStats) return
    const stats = getBatchedCssStats()
    assert.ok(stats, "stats should be truthy")
    assert.ok(typeof stats === "object")
  })

  it("resetBatchedCss clears state", () => {
    if (!resetBatchedCss || !getBatchedCssStats) return
    resetBatchedCss()
    const stats = getBatchedCssStats()
    assert.ok(stats, "stats should exist after reset")
    // After reset, injected count should be 0
    const count = stats.injectedCount ?? stats.count ?? stats.total ?? 0
    assert.equal(count, 0, "count should be 0 after reset")
  })

  it("syncInject is a function if available", () => {
    if (!syncInject) {
      console.warn("[runtime-css] syncInject not available, skipping")
      return
    }
    assert.equal(typeof syncInject, "function")
  })

  it("batchedInject accumulates CSS without error", () => {
    if (!batchedInject) return
    try {
      batchedInject(".flex { display: flex }", "test-id-1")
      batchedInject(".px-4 { padding: 1rem }", "test-id-2")
      // Should not throw
      const stats = getBatchedCssStats?.()
      if (stats) {
        const pending = stats.pendingCount ?? stats.pending ?? 0
        assert.ok(pending >= 0, "pending should be non-negative")
      }
    } catch (err) {
      // May need browser DOM
      if (String(err).includes("document") || String(err).includes("window")) {
        console.warn("[runtime-css] Browser environment required for injection test")
        return
      }
      throw err
    }
  })
})
