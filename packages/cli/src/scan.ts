import fs from "node:fs"
import path from "node:path"

import { scanWorkspaceAsync } from "@tailwind-styled/scanner"
import { createCliOutput } from "./utils/output"

export interface ScanCliResult {
  root: string
  totalFiles: number
  uniqueClassCount: number
  topClasses: Array<{ name: string; count: number }>
  cachePath?: string
}

interface ScanCacheEntry {
  name: string
  definedAt?: { file: string; line: number; column: number }
  variants?: string[]
  rules?: Array<{ property: string; value: string; applied: boolean }>
  finalStyle?: Array<{ property: string; value: string }>
  conflicts?: Array<{ property: string; winner: string; loser: string }>
  usedIn?: string[]
  bundleContribution?: number
  risk?: "low" | "medium" | "high"
  componentsAffected?: string[]
}

interface ScanCacheFile {
  generatedAt: string
  root: string
  totalFiles: number
  uniqueClasses: string[]
  classNames: ScanCacheEntry[]
  files: Array<{ file: string; classes: string[] }>
}

function buildTopClasses(
  files: Array<{ classes: string[] }>
): Array<{ name: string; count: number }> {
  const counts = new Map<string, number>()
  for (const file of files) {
    for (const className of file.classes) {
      counts.set(className, (counts.get(className) ?? 0) + 1)
    }
  }
  return Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 20)
    .map(([name, count]) => ({ name, count }))
}

function buildClassNames(
  files: Array<{ file: string; classes: string[] }>,
  uniqueClasses: string[]
): ScanCacheEntry[] {
  const usageMap = new Map<string, string[]>()
  for (const file of files) {
    for (const cls of file.classes) {
      const existing = usageMap.get(cls) ?? []
      existing.push(file.file)
      usageMap.set(cls, existing)
    }
  }
  const freq = new Map<string, number>()
  for (const [cls, files_] of usageMap) {
    freq.set(cls, files_.length)
  }
  const totalUsage = Array.from(freq.values()).reduce((a, b) => a + b, 0)

  return uniqueClasses.map((name): ScanCacheEntry => {
    const usedIn = usageMap.get(name) ?? []
    const count = freq.get(name) ?? 0
    const bundleContribution = totalUsage > 0 ? Math.round((count / totalUsage) * 10000) / 100 : 0
    const risk: "low" | "medium" | "high" =
      usedIn.length > 10 ? "high" : usedIn.length > 3 ? "medium" : "low"
    const variants: string[] = []
    const colonIdx = name.lastIndexOf(":")
    if (colonIdx > -1) variants.push(name.slice(0, colonIdx))
    return {
      name,
      usedIn: usedIn.slice(0, 20),
      bundleContribution,
      risk,
      componentsAffected: usedIn.slice(0, 10),
      ...(variants.length > 0 ? { variants } : {}),
    }
  })
}

function writeScanCache(root: string, cacheData: ScanCacheFile): string {
  const cacheDir = path.join(root, ".tailwind-styled")
  const cachePath = path.join(cacheDir, "scan-cache.json")
  fs.mkdirSync(cacheDir, { recursive: true })
  fs.writeFileSync(cachePath, JSON.stringify(cacheData, null, 2), "utf-8")
  return cachePath
}

export async function runScanCli(rawArgs: string[]): Promise<void> {
  const target = rawArgs.find((arg) => !arg.startsWith("-")) ?? "."
  const asJson = rawArgs.includes("--json")
  const saveCache = rawArgs.includes("--save") || rawArgs.includes("--cache")
  const output = createCliOutput({
    json: asJson,
    debug: process.env.TWS_DEBUG === "1" || process.env.DEBUG === "1",
    verbose: process.env.TWS_VERBOSE === "1" || process.env.VERBOSE === "1",
  })

  const root = path.resolve(process.cwd(), target)
  const spinner = output.spinner()
  spinner.start(`Scanning ${root}`)
  const scanned = await scanWorkspaceAsync(root)
  spinner.stop(`Scan complete: ${scanned.totalFiles} file(s)`)

  const result: ScanCliResult = {
    root,
    totalFiles: scanned.totalFiles,
    uniqueClassCount: scanned.uniqueClasses.length,
    topClasses: buildTopClasses(scanned.files),
  }

  const shouldSave = saveCache || process.env.TWS_SCAN_SAVE === "1"
  if (shouldSave) {
    const classNames = buildClassNames(scanned.files, scanned.uniqueClasses)
    const cacheData: ScanCacheFile = {
      generatedAt: new Date().toISOString(),
      root,
      totalFiles: scanned.totalFiles,
      uniqueClasses: scanned.uniqueClasses,
      classNames,
      files: scanned.files.map((f) => ({ file: f.file, classes: f.classes })),
    }
    const cachePath = writeScanCache(root, cacheData)
    result.cachePath = cachePath
    if (!asJson) {
      output.writeText(`\nCache written    : ${cachePath}`)
      output.writeText(`Cache entries    : ${classNames.length} classes`)
    }
  }

  if (asJson) {
    output.jsonSuccess("scan", result)
    return
  }

  output.writeText(`\nScan root       : ${result.root}`)
  output.writeText(`Total files     : ${result.totalFiles}`)
  output.writeText(`Unique classes  : ${result.uniqueClassCount}`)
  output.writeText("\nTop classes:")
  for (const item of result.topClasses.slice(0, 10)) {
    output.writeText(`  - ${item.name}: ${item.count}`)
  }
  if (!shouldSave) {
    output.writeText(
      "\nTip: Gunakan --save untuk generate .tailwind-styled/scan-cache.json (dibutuhkan VSCode extension)"
    )
  }
}
