#!/usr/bin/env node
/**
 * Check dan track ukuran binary .node untuk mendeteksi regresi.
 * QA #16: Binary Size monitoring.
 *
 * Usage:
 *   node scripts/check-binary-size.mjs
 *   node scripts/check-binary-size.mjs --max-mb=15
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, "..")

const args = new Map(
  process.argv.slice(2).map(a => {
    const [k, v] = a.replace(/^--/, "").split("=")
    return [k, v ?? "true"]
  })
)

const MAX_MB = Number(args.get("max-mb") ?? 20)
const WARN_MB = MAX_MB * 0.8

// Lokasi binary yang diexpect
const BINARY_CANDIDATES = [
  path.join(root, "native", "tailwind_styled_parser.node"),
  path.join(root, "native", "target", "release", "libtailwind_styled_parser.so"),
  path.join(root, "native", "target", "release", "libtailwind_styled_parser.dylib"),
  path.join(root, "native", "target", "release", "tailwind_styled_parser.dll"),
]

// Dist bundle check
const DIST_PACKAGES = [
  "packages/shared",
  "packages/compiler",
  "packages/engine",
  "packages/scanner",
  "packages/cli",
]

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / 1024 / 1024).toFixed(2)}MB`
}

function getDistSize(pkgDir) {
  const distDir = path.join(root, pkgDir, "dist")
  if (!fs.existsSync(distDir)) return null

  let total = 0
  const stack = [distDir]
  while (stack.length) {
    const dir = stack.pop()
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) stack.push(full)
      else if (/\.(js|cjs|mjs)$/.test(entry.name)) {
        total += fs.statSync(full).size
      }
    }
  }
  return total
}

console.log("\n📦 Binary & Bundle Size Report\n")

// Check native binary
let hasBinary = false
for (const candidate of BINARY_CANDIDATES) {
  if (fs.existsSync(candidate)) {
    const { size } = fs.statSync(candidate)
    const mb = size / 1024 / 1024
    const icon = mb > MAX_MB ? "❌" : mb > WARN_MB ? "⚠️ " : "✅"
    console.log(`${icon} Native binary: ${formatBytes(size)} — ${path.basename(candidate)}`)
    if (mb > MAX_MB) {
      console.error(`   ERROR: ${mb.toFixed(1)}MB exceeds max ${MAX_MB}MB`)
      process.exitCode = 1
    } else if (mb > WARN_MB) {
      console.warn(`   WARN: ${mb.toFixed(1)}MB is ${(mb / WARN_MB * 100).toFixed(0)}% of limit`)
    }
    hasBinary = true
  }
}

if (!hasBinary) {
  console.log("ℹ️  Native binary not built yet (run npm run build:rust)")
}

// Check dist bundles
console.log("\n📊 Package dist sizes:\n")
for (const pkg of DIST_PACKAGES) {
  const size = getDistSize(pkg)
  if (size === null) {
    console.log(`   ⚪ ${pkg}: not built`)
    continue
  }
  const kb = size / 1024
  const icon = kb > 500 ? "⚠️ " : "✅"
  console.log(`${icon} ${pkg}: ${formatBytes(size)}`)
}

console.log(`\nMax native binary: ${MAX_MB}MB | Warn at: ${WARN_MB.toFixed(0)}MB`)
console.log("Tip: Build with opt-level='z' in Cargo.toml for smallest binary\n")
