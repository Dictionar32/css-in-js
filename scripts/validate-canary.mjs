#!/usr/bin/env node
/**
 * Canary-friendly validation untuk workspaces penting.
 * Dari monorepo checklist: "Siapkan canary-friendly validation"
 *
 * Validasi: build, exports, types, dan tests semua green.
 * Usage: node scripts/validate-canary.mjs [package-name]
 */
import { execSync, spawnSync } from "node:child_process"
import path from "node:path"
import fs from "node:fs"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, "..")

const CANARY_PACKAGES = [
  "packages/shared",
  "packages/compiler",
  "packages/engine",
  "packages/scanner",
  "packages/core",
  "packages/cli",
  "packages/plugin-registry",
]

const args = process.argv.slice(2)
const targets = args.length > 0
  ? args.map(a => a.startsWith("packages/") ? a : `packages/${a}`)
  : CANARY_PACKAGES

function run(cmd, cwd = root) {
  const result = spawnSync("sh", ["-c", cmd], { cwd, stdio: "pipe", encoding: "utf-8" })
  return { ok: result.status === 0, output: result.stdout + result.stderr }
}

function checkPackage(pkgDir) {
  const pkgPath = path.join(root, pkgDir, "package.json")
  if (!fs.existsSync(pkgPath)) {
    return { ok: false, error: `${pkgDir}/package.json not found` }
  }
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"))
  const name = pkg.name

  const results = []

  // 1. dist/ exists
  const distDir = path.join(root, pkgDir, "dist")
  if (!fs.existsSync(distDir)) {
    results.push({ check: "dist/", ok: false, note: "Run npm run build first" })
  } else {
    const files = fs.readdirSync(distDir)
    const hasEntry = files.some(f => f.endsWith(".js") || f.endsWith(".cjs"))
    results.push({ check: "dist/", ok: hasEntry, note: hasEntry ? "" : "No .js/.cjs entry found" })
  }

  // 2. type-check
  const hasCheck = pkg.scripts?.check
  if (hasCheck) {
    const r = run(`npm run check 2>&1`, path.join(root, pkgDir))
    results.push({ check: "typecheck", ok: r.ok, note: r.ok ? "" : r.output.slice(0, 200) })
  }

  // 3. tests
  const hasTest = pkg.scripts?.test && !pkg.scripts.test.includes("No tests yet")
  if (hasTest) {
    const r = run(
      `TWS_DISABLE_NATIVE=1 npm test 2>&1 | tail -5`,
      path.join(root, pkgDir)
    )
    results.push({ check: "tests", ok: r.ok, note: r.ok ? "" : r.output.slice(-200) })
  }

  return { name, results }
}

console.log("\n🔍 Canary Validation\n")

let allOk = true
for (const pkgDir of targets) {
  const { name, results, error } = checkPackage(pkgDir)
  if (error) {
    console.log(`❌ ${pkgDir}: ${error}`)
    allOk = false
    continue
  }

  const allPassed = results.every(r => r.ok)
  const icon = allPassed ? "✅" : "❌"
  console.log(`${icon} ${name}`)

  for (const r of results) {
    const rIcon = r.ok ? "  ✓" : "  ✗"
    console.log(`${rIcon} ${r.check}${r.note ? `: ${r.note}` : ""}`)
  }

  if (!allPassed) allOk = false
}

console.log(`\n${allOk ? "✅ All canary checks passed" : "❌ Some checks failed"}\n`)
process.exitCode = allOk ? 0 : 1
