#!/usr/bin/env tsx

import fs from "node:fs"
import path from "node:path"

type ExportEntry = string | Record<string, ExportEntry>

const repoRoot = process.cwd()
const packagesDir = path.join(repoRoot, "packages")

function collectPackageJsonPaths(dir: string): string[] {
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(dir, entry.name, "package.json"))
    .filter((packageJsonPath) => fs.existsSync(packageJsonPath))
}

function hasRequirePath(entry: ExportEntry): boolean {
  if (typeof entry === "string") return false
  for (const [key, value] of Object.entries(entry)) {
    if (key === "require") return true
    if (typeof value === "object" && value !== null && hasRequirePath(value as ExportEntry)) {
      return true
    }
  }
  return false
}

const packageJsonPaths = collectPackageJsonPaths(packagesDir)
const offenders: string[] = []

for (const packageJsonPath of packageJsonPaths) {
  const raw = fs.readFileSync(packageJsonPath, "utf8")
  const parsed = JSON.parse(raw) as { name?: string; exports?: ExportEntry }
  if (!parsed.exports) continue
  if (hasRequirePath(parsed.exports)) {
    offenders.push(parsed.name ?? path.dirname(packageJsonPath))
  }
}

if (offenders.length > 0) {
  console.error("[esm-package-cutover] FAIL: found package exports with `require` path:")
  for (const name of offenders) {
    console.error(`- ${name}`)
  }
  process.exit(1)
}

console.log(`[esm-package-cutover] PASS: ${packageJsonPaths.length} package.json checked, no require exports.`)
