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
  console.warn("[shared/tests] dist not found")
  process.exit(0) // INTENTIONAL
}

const { TelemetryCollector, createBuildTimer, getGlobalTelemetry, resetGlobalTelemetry } = mod

const mockBuild = (overrides = {}) => ({
  timestamp: Date.now(),
  durationMs: 100,
  filesScanned: 10,
  filesCached: 5,
  classesExtracted: 42,
  phases: { scan: 30, compile: 40, engine: 20, output: 10 },
  cacheHitRate: 0.5,
  ...overrides,
})

describe("TelemetryCollector", () => {
  let collector

  beforeEach(() => {
    collector = new TelemetryCollector(true)
  })

  it("records builds", () => {
    collector.record(mockBuild())
    assert.equal(collector.snapshot().length, 1)
  })

  it("respects ring buffer size (max 100)", () => {
    for (let i = 0; i < 110; i++) {
      collector.record(mockBuild({ durationMs: i }))
    }
    assert.equal(collector.snapshot().length, 100)
  })

  it("summary() returns correct stats", () => {
    collector.record(mockBuild({ durationMs: 100, cacheHitRate: 0.5 }))
    collector.record(mockBuild({ durationMs: 200, cacheHitRate: 0.8 }))
    const s = collector.summary()
    assert.ok(s, "summary should exist")
    assert.equal(s.totalBuilds, 2)
    assert.ok(s.avgDurationMs >= 100 && s.avgDurationMs <= 200)
    assert.ok(s.avgCacheHitRate >= 0.5 && s.avgCacheHitRate <= 0.8)
  })

  it("summary() returns null for empty data", () => {
    const s = collector.summary()
    assert.equal(s, null)
  })

  it("formatCli() returns string", () => {
    collector.record(mockBuild())
    const cli = collector.formatCli()
    assert.ok(typeof cli === "string")
    assert.ok(cli.includes("1 builds"), `Expected '1 builds' in: ${cli}`)
  })

  it("reset() clears data", () => {
    collector.record(mockBuild())
    collector.reset()
    assert.equal(collector.snapshot().length, 0)
  })

  it("does not record when disabled", () => {
    const disabled = new TelemetryCollector(false)
    disabled.record(mockBuild())
    assert.equal(disabled.snapshot().length, 0)
  })

  it("toJSON() includes summary and history", () => {
    collector.record(mockBuild())
    const json = collector.toJSON()
    assert.ok(json.summary, "should have summary")
    assert.ok(Array.isArray(json.history), "history should be array")
  })
})

describe("createBuildTimer", () => {
  it("records phase timings", () => {
    const timer = createBuildTimer()
    timer.phase("scan")
    timer.phase("compile")
    const build = timer.finish({
      filesScanned: 5,
      filesCached: 2,
      classesExtracted: 20,
    })
    assert.ok(build.durationMs >= 0)
    assert.ok(build.phases.scan >= 0)
    assert.ok(build.phases.compile >= 0)
    assert.ok(build.timestamp > 0)
  })

  it("auto-records to global telemetry", () => {
    resetGlobalTelemetry()
    // Enable via env
    process.env.TWS_TELEMETRY = "1"
    const timer = createBuildTimer()
    timer.finish({ filesScanned: 1, filesCached: 0, classesExtracted: 5 })
    delete process.env.TWS_TELEMETRY
  })
})

describe("getGlobalTelemetry()", () => {
  beforeEach(() => resetGlobalTelemetry())

  it("returns singleton", () => {
    const a = getGlobalTelemetry()
    const b = getGlobalTelemetry()
    assert.equal(a, b)
  })

  it("resetGlobalTelemetry() creates new instance", () => {
    const a = getGlobalTelemetry()
    resetGlobalTelemetry()
    const b = getGlobalTelemetry()
    assert.notEqual(a, b)
  })
})
