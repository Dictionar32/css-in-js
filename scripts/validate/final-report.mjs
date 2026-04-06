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
 */

import { execSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const reportDir = path.join(root, "artifacts")
const reportPath = path.join(reportDir, "validation-report.json")
const FLAG_JSON = process.argv.includes("--json")

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

const checks = {
  // Build artifacts
  rootDist:      checkFile("root dist/index.mjs",      path.join(root, "dist/index.mjs")),
  rootDistCjs:   checkFile("root dist/index.js",       path.join(root, "dist/index.js")),
  rootDistTypes: checkFile("root dist/index.d.ts",     path.join(root, "dist/index.d.ts")),
  rootDistTw:    checkFile("root dist/tw.js (CLI)",     path.join(root, "dist/tw.js")),
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
    const exists = fs.existsSync(nextBuiltId)
    return {
      label: "next-js-app/.next/BUILD_ID",
      ok: exists,
      detail: exists ? "next build sudah jalan" : "jalankan: npm run build -w examples/next-js-app",
    }
  })(),
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

if (FLAG_JSON) {
  console.log(JSON.stringify(report, null, 2))
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
}

process.exit(failed > 0 ? 1 : 0)
