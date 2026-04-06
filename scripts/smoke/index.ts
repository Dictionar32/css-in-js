#!/usr/bin/env node

import fs from "node:fs"
import path from "node:path"
import { spawnSync } from "node:child_process"

const root = process.cwd()
const verbose = process.env.SMOKE_VERBOSE === "1"

function fail(message) {
  console.error(`[smoke] FAIL: ${message}`)
  process.exit(1)
}

function ensureFile(relativePath) {
  const absolutePath = path.join(root, relativePath)
  if (!fs.existsSync(absolutePath)) {
    fail(`required file missing: ${relativePath}`)
  }
  if (verbose) {
    console.log(`[smoke] ok file: ${relativePath}`)
  }
}

function runCommand(label, command, args) {
  if (verbose) {
    console.log(`[smoke] run: ${command} ${args.join(" ")}`)
  }
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: verbose ? "inherit" : "pipe",
    encoding: "utf8",
  })

  if ((result.status ?? 1) !== 0) {
    const stderr = result.stderr?.toString().trim()
    const stdout = result.stdout?.toString().trim()
    const detail = stderr || stdout || `exit code ${result.status ?? "unknown"}`
    fail(`${label} failed (${detail})`)
  }
}

const checks = [
  {
    label: "required scripts exist",
    run: () => {
      ensureFile("scripts/validate/final-report.ts")
      ensureFile("scripts/validate/health-summary.ts")
      ensureFile("scripts/benchmark/sprint2-bench.ts")
      ensureFile("scripts/check-pack-artifacts.ts")
      ensureFile("scripts/v48/lsp.mjs")
    },
  },
  {
    label: "pack:check core",
    run: () =>
      runCommand("pack:check core", process.execPath, [
        "scripts/check-pack-artifacts.mjs",
        "packages/core",
      ]),
  },
]

console.log("[smoke] starting release candidate smoke checks")
for (const check of checks) {
  if (verbose) {
    console.log(`[smoke] -> ${check.label}`)
  }
  check.run()
}

console.log("[smoke] all checks passed")
