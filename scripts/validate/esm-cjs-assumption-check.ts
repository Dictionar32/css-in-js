#!/usr/bin/env tsx

import { execSync } from "node:child_process"

const MAX_ALLOWED = Number(process.env.TWS_ESM_CJS_BASELINE ?? "3")
const TARGET_DIRS = [
  "packages/analyzer",
  "packages/compiler",
  "packages/scanner",
  "packages/next",
  "packages/rspack",
  "packages/cli",
]
const PATTERN = "createRequire\\(|module\\.require|typeof __dirname"

function run(cmd: string): string {
  try {
    return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to run command: ${cmd}\n${message}`)
  }
}

const matchesRaw = run(`rg -n "${PATTERN}" ${TARGET_DIRS.join(" ")} -g '*.ts'`)
const matches = matchesRaw.length === 0 ? [] : matchesRaw.split("\n")
const total = matches.length

console.log(`[esm-check] matches: ${total}`)
console.log(`[esm-check] max allowed baseline: ${MAX_ALLOWED}`)

for (const line of matches) {
  console.log(`[esm-check] ${line}`)
}

if (total > MAX_ALLOWED) {
  console.error(
    `[esm-check] FAIL: detected ${total} CJS-assumption pattern(s), above baseline ${MAX_ALLOWED}.` +
      " Continue ESM migration or raise baseline intentionally with TWS_ESM_CJS_BASELINE."
  )
  process.exit(1)
}

console.log("[esm-check] PASS: no regression vs baseline.")
