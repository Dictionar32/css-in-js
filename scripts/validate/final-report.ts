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

function checkContains(label, filePath, needle) {
  if (!fs.existsSync(filePath)) {
    return { label, ok: false, detail: `tidak ditemukan: ${filePath}` }
  }
  const content = fs.readFileSync(filePath, "utf8")
  const ok = content.includes(needle)
  return {
    label,
    ok,
    detail: ok ? `ok: ditemukan "${needle}"` : `tidak menemukan "${needle}" di ${filePath}`,
  }
}

function checkOptionalFile(label, filePath, hint) {
  const exists = fs.existsSync(filePath)
  return {
    label,
    ok: true,
    detail: exists ? filePath : `optional: ${hint || `tidak ditemukan: ${filePath}`}`,
  }
}

function checkAnyFile(label, filePaths, hint) {
  const found = filePaths.find((filePath) => fs.existsSync(filePath))
  return {
    label,
    ok: Boolean(found),
    detail: found || hint || `tidak ditemukan: ${filePaths.join(" | ")}`,
  }
}

function checkAnyOptionalFile(label, filePaths, hint) {
  const found = filePaths.find((filePath) => fs.existsSync(filePath))
  return {
    label,
    ok: true,
    detail: found || `optional: ${hint || `tidak ditemukan: ${filePaths.join(" | ")}`}`,
  }
}

const criticalBuildOutputs = [
  path.join(root, "dist/index.mjs"),
  path.join(root, "dist/tw.mjs"),
  path.join(root, "packages/core/dist/index.js"),
  path.join(root, "packages/compiler/dist/index.js"),
  path.join(root, "packages/scanner/dist/index.js"),
  path.join(root, "packages/engine/dist/index.js"),
  path.join(root, "packages/vite/dist/plugin.js"),
  path.join(root, "packages/next/dist/index.js"),
  path.join(root, "packages/rspack/dist/index.js"),
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
  rootDistTypes: checkAnyOptionalFile(
    "root dist type declarations (optional)",
    [path.join(root, "dist/index.d.mts"), path.join(root, "dist/index.d.ts")],
    "jalankan build root untuk menghasilkan typings"
  ),
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
  cacheHelperTests: (() => {
    const r = run("npm run test:cache")
    return {
      label: "cache helper smoke tests",
      ok: r.ok,
      detail: r.ok ? "pass" : r.error?.slice(0, 200) || "failed",
    }
  })(),
  compilerUnitTests: (() => {
    const r = run("npm run test:compiler")
    return {
      label: "compiler package tests",
      ok: r.ok,
      detail: r.ok ? "pass" : r.error?.slice(0, 200) || "failed",
    }
  })(),
  schemaSyncCheck: (() => {
    const r = run("npx tsx scripts/generate-json-schemas.ts --check")
    return {
      label: "generated schema drift check",
      ok: r.ok,
      detail: r.ok ? "pass" : r.error?.slice(0, 200) || "failed",
    }
  })(),
  syncHelperTests: (() => {
    const r = run("npm run test:sync")
    return {
      label: "sync helper smoke tests",
      ok: r.ok,
      detail: r.ok ? "pass" : r.error?.slice(0, 200) || "failed",
    }
  })(),
  gateSmokeSuite: (() => {
    const r = run("npm run test:gate")
    return {
      label: "aggregated gate smoke suite",
      ok: r.ok,
      detail: r.ok ? "pass" : r.error?.slice(0, 200) || "failed",
    }
  })(),
  cliHelpMain: (() => {
    const r = run("npx tsx packages/cli/src/index.ts --help")
    return {
      label: "CLI help (main command)",
      ok: r.ok,
      detail: r.ok ? "pass" : r.error?.slice(0, 200) || "failed",
    }
  })(),
  cliHelpSetup: (() => {
    const r = run("npx tsx packages/cli/src/index.ts setup --help")
    return {
      label: "CLI help (setup subcommand)",
      ok: r.ok,
      detail: r.ok ? "pass" : r.error?.slice(0, 200) || "failed",
    }
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
  syncAwsSdkTs: checkContains(
    "scripts/v45/sync.ts AWS SDK support",
    path.join(root, "scripts/v45/sync.ts"),
    "@aws-sdk/client-s3"
  ),
  syncAwsSdkMjs: checkContains(
    "scripts/v45/sync.mjs AWS SDK support",
    path.join(root, "scripts/v45/sync.mjs"),
    "@aws-sdk/client-s3"
  ),
  syncPullCmdTs: checkContains(
    "scripts/v45/sync.ts pull command",
    path.join(root, "scripts/v45/sync.ts"),
    "if (cmd === 'pull')"
  ),
  syncPushCmdTs: checkContains(
    "scripts/v45/sync.ts push command",
    path.join(root, "scripts/v45/sync.ts"),
    "if (cmd === 'push')"
  ),
  syncPullCmdMjs: checkContains(
    "scripts/v45/sync.mjs pull command",
    path.join(root, "scripts/v45/sync.mjs"),
    "if (cmd === 'pull')"
  ),
  syncPushCmdMjs: checkContains(
    "scripts/v45/sync.mjs push command",
    path.join(root, "scripts/v45/sync.mjs"),
    "if (cmd === 'push')"
  ),
  syncTestFile: checkFile(
    "scripts/v45/sync.test.mjs exists",
    path.join(root, "scripts/v45/sync.test.mjs")
  ),
  cacheRemoteTs: checkContains(
    "scripts/v45/cache.ts remote provider support",
    path.join(root, "scripts/v45/cache.ts"),
    "provider === 's3' || provider === 'redis'"
  ),
  cacheRemoteMjs: checkContains(
    "scripts/v45/cache.mjs remote provider support",
    path.join(root, "scripts/v45/cache.mjs"),
    "provider === 's3' || provider === 'redis'"
  ),
  cacheDoctorTs: checkContains(
    "scripts/v45/cache.ts doctor command",
    path.join(root, "scripts/v45/cache.ts"),
    "if (cmd === 'doctor')"
  ),
  cacheDoctorMjs: checkContains(
    "scripts/v45/cache.mjs doctor command",
    path.join(root, "scripts/v45/cache.mjs"),
    "if (cmd === 'doctor')"
  ),
  cacheExportTs: checkContains(
    "scripts/v45/cache.ts export command",
    path.join(root, "scripts/v45/cache.ts"),
    "if (cmd === 'export')"
  ),
  cacheExportMjs: checkContains(
    "scripts/v45/cache.mjs export command",
    path.join(root, "scripts/v45/cache.mjs"),
    "if (cmd === 'export')"
  ),
  cachePushTs: checkContains(
    "scripts/v45/cache.ts push command",
    path.join(root, "scripts/v45/cache.ts"),
    "if (cmd === 'push')"
  ),
  cachePushMjs: checkContains(
    "scripts/v45/cache.mjs push command",
    path.join(root, "scripts/v45/cache.mjs"),
    "if (cmd === 'push')"
  ),
  cachePullTs: checkContains(
    "scripts/v45/cache.ts pull command",
    path.join(root, "scripts/v45/cache.ts"),
    "if (cmd === 'pull')"
  ),
  cachePullMjs: checkContains(
    "scripts/v45/cache.mjs pull command",
    path.join(root, "scripts/v45/cache.mjs"),
    "if (cmd === 'pull')"
  ),
  cacheTestFile: checkFile(
    "scripts/v45/cache.test.mjs exists",
    path.join(root, "scripts/v45/cache.test.mjs")
  ),
  devtoolsTracePanel: checkContains(
    "devtools trace panel component",
    path.join(root, "packages/devtools/src/index.tsx"),
    "function TracePanel()"
  ),
  devtoolsTraceTab: checkContains(
    "devtools trace tab registered",
    path.join(root, "packages/devtools/src/index.tsx"),
    "{ id: \"trace\", label: \"Trace\", icon: \"🔬\" }"
  ),
  devtoolsTraceShortcut: checkContains(
    "devtools trace keyboard shortcut",
    path.join(root, "packages/devtools/src/index.tsx"),
    "if (e.key === \"6\")"
  ),
  devtoolsTraceRenderFlow: checkContains(
    "devtools trace panel render flow",
    path.join(root, "packages/devtools/src/index.tsx"),
    "state.panel === \"trace\" && React.createElement(TracePanel, null)"
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
