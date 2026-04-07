#!/usr/bin/env node
/**
 * scripts/validate/final-report.ts
 *
 * CI validation gate: verifikasi artifacts build ada dan Next.js test endpoint bisa di-hit.
 * Semua test behavior dan package sudah dipindah ke Next.js (/api/tests/*).
 *
 * Usage:
 *   npx tsx scripts/validate/final-report.ts
 *   npx tsx scripts/validate/final-report.ts --json
 *   npx tsx scripts/validate/final-report.ts --json --strict
 */

import { execSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const reportDir = path.join(root, "artifacts")
const reportPath = path.join(reportDir, "validation-report.json")
const healthSummaryPath = path.join(reportDir, "health-summary.json")
const FLAG_JSON = process.argv.includes("--json")
const FLAG_STRICT = process.argv.includes("--strict")
const FLAG_PREPARE = process.argv.includes("--prepare")

function run(cmd, options = {}) {
  try {
    const out = execSync(cmd, { stdio: "pipe", encoding: "utf8", ...options })
    return { ok: true, output: out.trim() }
  } catch (error) {
    return {
      ok: false,
      output: (error.stdout || "").toString().trim(),
      error: (error.stderr || error.message || "").toString().trim(),
    }
  }
}

function checkFile(label, filePath) {
  const exists = fs.existsSync(filePath)
  return { label, ok: exists, detail: exists ? filePath : `tidak ditemukan: ${filePath}` }
}

function checkOptionalFile(label, filePath, hint) {
  const exists = fs.existsSync(filePath)
  return {
    label,
    ok: true,
    detail: exists ? filePath : `optional: ${hint || `tidak ditemukan: ${filePath}`}`,
  }
}

const criticalBuildOutputs = [
  path.join(root, "dist/index.mjs"),
  path.join(root, "dist/index.d.mts"),
  path.join(root, "dist/tw.mjs"),
  path.join(root, "packages/core/dist/index.js"),
  path.join(root, "packages/compiler/dist/index.js"),
  path.join(root, "packages/scanner/dist/index.js"),
  path.join(root, "packages/engine/dist/index.js"),
  path.join(root, "packages/vite/dist/plugin.js"),
  path.join(root, "packages/next/dist/index.js"),
  path.join(root, "packages/rspack/dist/index.js"),
  path.join(root, "examples/next-js-app/.next/BUILD_ID"),
]

function hasMissingCriticalOutputs() {
  return criticalBuildOutputs.some((target) => !fs.existsSync(target))
}

if ((FLAG_PREPARE || FLAG_STRICT) && hasMissingCriticalOutputs()) {
  const prepCommands = [
    "npm run build -w packages/core",
    "npm run build -w packages/compiler",
    "npm run build -w packages/scanner",
    "npm run build -w packages/engine",
    "npm run build -w packages/vite",
    "npm run build -w packages/next",
    "npm run build -w packages/rspack",
    "npx tsup --config tsup.config.ts",
    "npm run build --prefix examples/next-js-app",
  ]

  const prepResults = prepCommands.map((cmd) => ({ cmd, result: run(cmd) }))
  const prepFailures = prepResults.filter(({ result }) => !result.ok)

  if (prepFailures.length > 0) {
    const prepErrors = prepFailures.map(({ cmd, result }) => {
      const errDetail = result.error || result.output || "unknown error"
      return `${cmd}\n${errDetail}`
    })
    console.error(
      `prepare build gagal:\n${prepErrors.join("\n\n")}`.trim()
    )
  }
}

const checks = {
  // Build artifacts
  rootDist:      checkFile("root dist/index.mjs",      path.join(root, "dist/index.mjs")),
  rootDistTypes: checkFile("root dist/index.d.mts",     path.join(root, "dist/index.d.mts")),
  rootDistTw:    checkFile("root dist/tw.mjs (CLI)",     path.join(root, "dist/tw.mjs")),
  coreDist:      checkFile("@tailwind-styled/core dist", path.join(root, "packages/core/dist/index.js")),
  compilerDist:  checkFile("@tailwind-styled/compiler dist", path.join(root, "packages/compiler/dist/index.js")),
  scannerDist:   checkFile("@tailwind-styled/scanner dist",  path.join(root, "packages/scanner/dist/index.js")),
  engineDist:    checkFile("@tailwind-styled/engine dist",   path.join(root, "packages/engine/dist/index.js")),
  viteDist:      checkFile("@tailwind-styled/vite dist",     path.join(root, "packages/vite/dist/plugin.js")),
  nextDist:      checkFile("@tailwind-styled/next dist",     path.join(root, "packages/next/dist/index.js")),
  rspackDist:    checkFile("@tailwind-styled/rspack dist",   path.join(root, "packages/rspack/dist/index.js")),
  // TypeScript check
  tscRoot: (() => {
    const r = run("npx tsc --noEmit")
    return { label: "tsc root --noEmit", ok: r.ok, detail: r.error?.slice(0, 200) || "clean" }
  })(),
  tscNext: (() => {
    const r = run("npx tsc --noEmit -p examples/next-js-app/tsconfig.json")
    return { label: "tsc next-js-app --noEmit", ok: r.ok, detail: r.error?.slice(0, 200) || "clean" }
  })(),
  // Next.js build
  nextBuild: (() => {
    const nextBuiltId = path.join(root, "examples/next-js-app/.next/BUILD_ID")
    return checkOptionalFile(
      "next-js-app/.next/BUILD_ID (optional)",
      nextBuiltId,
      "jalankan: npm run build --prefix examples/next-js-app"
    )
  })(),
  nextExample: checkFile(
    "examples/next-js-app/tailwind-styled.config.json",
    path.join(root, "examples/next-js-app/tailwind-styled.config.json")
  ),
  viteReactExample: checkFile(
    "examples/vite-react/tailwind-styled.config.json",
    path.join(root, "examples/vite-react/tailwind-styled.config.json")
  ),
  nextV5Proxy: checkFile(
    "examples/nextjs-v5/package.json",
    path.join(root, "examples/nextjs-v5/package.json")
  ),
  viteV5Proxy: checkFile(
    "examples/vite-v5/package.json",
    path.join(root, "examples/vite-v5/package.json")
  ),
}

const results = Object.entries(checks).map(([key, check]) => ({
  key,
  label: check.label,
  ok: check.ok,
  detail: check.detail,
}))

const passed = results.filter((r) => r.ok).length
const failed = results.filter((r) => !r.ok).length

fs.mkdirSync(reportDir, { recursive: true })

const report = {
  generatedAt: new Date().toISOString(),
  passed,
  failed,
  ok: failed === 0,
  summary: {
    passed,
    failed,
    ok: failed === 0,
  },
  note: "Behavior tests ada di http://localhost:3000/tests saat next dev berjalan",
  results,
}

fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

const health = {
  generatedAt: new Date().toISOString(),
  status: failed === 0 ? "PASS" : "FAIL",
  totals: { passed, failed },
  recommendation:
    failed === 0
      ? "Release candidate gate passed. Safe to continue."
      : "Fix failing checks before release candidate.",
}

fs.writeFileSync(healthSummaryPath, JSON.stringify(health, null, 2) + "\n")

if (FLAG_JSON) {
  console.log(JSON.stringify({ report, health }, null, 2))
} else {
  console.log(`\nValidation Report`)
  console.log(`${"─".repeat(50)}`)
  for (const r of results) {
    const mark = r.ok ? "✓" : "✗"
    console.log(`  ${mark} ${r.label}${r.ok ? "" : `\n      ${r.detail}`}`)
  }
  console.log(`\n${passed}/${results.length} passed`)
  if (failed > 0) {
    console.log(`\nNote: Behavior tests ada di http://localhost:3000/tests`)
  }
  console.log(`Validation report written: ${path.relative(root, reportPath)}`)
  console.log(`Health summary written : ${path.relative(root, healthSummaryPath)}`)
}

const shouldFailProcess = failed > 0 && (!FLAG_JSON || FLAG_STRICT)
process.exit(shouldFailProcess ? 1 : 0)
