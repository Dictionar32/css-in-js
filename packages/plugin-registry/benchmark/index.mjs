#!/usr/bin/env node
/**
 * Plugin Registry SLO Benchmark
 * Target: p95 < 500ms untuk search dan list
 * Error rate: < 1% dalam 100 eksekusi
 *
 * Usage: node packages/plugin-registry/benchmark/index.mjs [--runs=100] [--json]
 */
import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const req = createRequire(import.meta.url)

const args = new Map(
  process.argv.slice(2).map(a => {
    const [k, v] = a.replace(/^--/, "").split("=")
    return [k, v ?? "true"]
  })
)
const RUNS = Number(args.get("runs") ?? 100)
const JSON_OUTPUT = args.get("json") === "true"
const SLO_P95_MS = 500
const SLO_ERROR_RATE = 0.01

let PluginRegistry
try {
  PluginRegistry = req(path.resolve(__dirname, "../dist/index.js")).PluginRegistry
} catch {
  console.error("plugin-registry dist not found — run npm run build first")
  process.exit(1)
}

const MOCK_DATA = {
  version: "5.0.0",
  official: Array.from({ length: 20 }, (_, i) => ({
    name: `@tailwind-styled/plugin-${i}`,
    description: `Official plugin number ${i} for tailwind-styled`,
    version: "1.0.0",
    tags: ["official", `tag-${i % 5}`],
    official: true,
  })),
  community: Array.from({ length: 30 }, (_, i) => ({
    name: `community-plugin-${i}`,
    description: `Community plugin ${i}`,
    version: "0.1.0",
    tags: ["community", `category-${i % 3}`],
  })),
}

const registry = new PluginRegistry(MOCK_DATA)

function benchmark(label, fn, runs) {
  const timings = []
  let errors = 0

  for (let i = 0; i < runs; i++) {
    const start = performance.now()
    try {
      fn()
    } catch {
      errors++
    }
    timings.push(performance.now() - start)
  }

  timings.sort((a, b) => a - b)
  const p50 = timings[Math.floor(runs * 0.5)]
  const p95 = timings[Math.floor(runs * 0.95)]
  const p99 = timings[Math.floor(runs * 0.99)]
  const avg = timings.reduce((a, b) => a + b, 0) / runs
  const errorRate = errors / runs

  return { label, runs, avg, p50, p95, p99, errors, errorRate }
}

const results = [
  benchmark("search (query)", () => registry.search("official"), RUNS),
  benchmark("search (empty)", () => registry.search(""), RUNS),
  benchmark("getAll", () => registry.getAll(), RUNS),
  benchmark("getByName (hit)", () => registry.getByName("@tailwind-styled/plugin-0"), RUNS),
  benchmark("getByName (miss)", () => registry.getByName("nonexistent"), RUNS),
]

const sloChecks = results.map(r => ({
  ...r,
  p95Pass: r.p95 < SLO_P95_MS,
  errorRatePass: r.errorRate <= SLO_ERROR_RATE,
  pass: r.p95 < SLO_P95_MS && r.errorRate <= SLO_ERROR_RATE,
}))

const allPass = sloChecks.every(r => r.pass)

if (JSON_OUTPUT) {
  console.log(JSON.stringify({ sloTargets: { p95Ms: SLO_P95_MS, errorRate: SLO_ERROR_RATE }, results: sloChecks, allPass }, null, 2))
} else {
  console.log(`\n📊 Plugin Registry SLO Benchmark (${RUNS} runs each)\n`)
  console.log(`SLO targets: p95 < ${SLO_P95_MS}ms, error rate < ${(SLO_ERROR_RATE * 100).toFixed(0)}%\n`)

  for (const r of sloChecks) {
    const status = r.pass ? "✅" : "❌"
    console.log(`${status} ${r.label}`)
    console.log(`   avg=${r.avg.toFixed(2)}ms  p50=${r.p50.toFixed(2)}ms  p95=${r.p95.toFixed(2)}ms  p99=${r.p99.toFixed(2)}ms  errors=${r.errors}/${r.runs}`)
    if (!r.p95Pass) console.log(`   ⚠️  p95 ${r.p95.toFixed(2)}ms exceeds SLO ${SLO_P95_MS}ms`)
    if (!r.errorRatePass) console.log(`   ⚠️  error rate ${(r.errorRate * 100).toFixed(1)}% exceeds SLO ${(SLO_ERROR_RATE * 100).toFixed(0)}%`)
  }

  console.log(`\n${allPass ? "✅ All SLO targets met" : "❌ Some SLO targets missed"}`)
}

process.exitCode = allPass ? 0 : 1
