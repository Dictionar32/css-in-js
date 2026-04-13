#!/usr/bin/env node
/**
 * QA validation script: verify build / test / lint passes.
 * Dijalankan oleh CI dan sebelum release.
 */
import { spawnSync } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

function run(cmd, args = [], opts = {}) {
  const result = spawnSync(cmd, args, {
    cwd: ROOT, stdio: "pipe", encoding: "utf-8",
    env: { ...process.env, TWS_DISABLE_NATIVE: "1" },
    ...opts,
  })
  return { ok: result.status === 0, out: result.stdout + result.stderr, status: result.status }
}

const checks = []

// 1. TypeScript check (subset of packages - quick)
console.log("🔍 Running QA validation...\n")

const tsc = run("npx", ["tsc", "--noEmit", "-p", "tsconfig.dev.json"])
checks.push({ name: "npm run typecheck", ok: tsc.ok, note: tsc.ok ? "" : tsc.out.slice(0, 300) })

// 2. Tests (pure TS packages only — no native needed)
const testPackages = ["shared", "core", "plugin-registry", "testing", "vue", "svelte"]
for (const pkg of testPackages) {
  const r = run("node", ["--test", `packages/${pkg}/tests/*.test.mjs`,
    `packages/${pkg}/__tests__/*.test.mjs`].filter(Boolean),
    { shell: true }
  )
  checks.push({ name: `test:${pkg}`, ok: r.ok || r.status === 0, note: "" })
}

// 3. No any types
const anyCheck = run("sh", ["-c",
  `grep -rn ': any\\b' packages/ --include='*.ts' --include='*.tsx' | grep -v 'node_modules\\|dist\\|eslint-disable\\|starter-plugin' | wc -l`
])
const anyCount = parseInt(anyCheck.out.trim(), 10)
checks.push({ name: "no :any types", ok: anyCount === 0, note: anyCount > 0 ? `${anyCount} remaining` : "" })

// 4. No empty catch blocks
const catchCheck = run("sh", ["-c",
  `grep -rn '} catch {$' packages/ --include='*.ts' | grep -v 'node_modules\\|dist\\|/\\*' | wc -l`
])
const catchCount = parseInt(catchCheck.out.trim(), 10)
checks.push({ name: "no empty catch{}", ok: catchCount === 0, note: catchCount > 0 ? `${catchCount} remaining` : "" })

// Print results
let allOk = true
for (const c of checks) {
  const icon = c.ok ? "✅" : "❌"
  console.log(`${icon} ${c.name}${c.note ? `: ${c.note}` : ""}`)
  if (!c.ok) allOk = false
}

console.log(`\n${allOk ? "✅ All QA checks passed" : "❌ Some checks failed"}`)
process.exitCode = allOk ? 0 : 1
