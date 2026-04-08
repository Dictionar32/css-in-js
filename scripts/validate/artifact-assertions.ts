#!/usr/bin/env tsx

import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { pathToFileURL } from "node:url"

const repoRoot = process.cwd()

function ensureNativeBindingArtifact(): void {
  const bindingPath = path.join(repoRoot, "native", "tailwind_styled_parser.node")
  if (fs.existsSync(bindingPath)) return

  const releaseDir = path.join(repoRoot, "native", "target", "release")
  const fallbackCandidates = [
    "libtailwind_styled_parser.so",
    "libtailwind_styled_parser.dylib",
    "tailwind_styled_parser.dll",
  ]

  for (const candidate of fallbackCandidates) {
    const candidatePath = path.join(releaseDir, candidate)
    if (!fs.existsSync(candidatePath)) continue
    fs.copyFileSync(candidatePath, bindingPath)
    return
  }

  throw new Error(
    "Native binding artifact not found. Build native module first: npm run build:rust"
  )
}

async function loadCreateEngine() {
  const entryPath = path.join(repoRoot, "packages/engine/src/index.ts")
  const moduleUrl = pathToFileURL(entryPath).href
  const mod = await import(moduleUrl)
  assert.equal(typeof mod.createEngine, "function", "createEngine export is required")
  return mod.createEngine as (options?: Record<string, unknown>) => Promise<{
    scanWorkspace: () => Promise<{ totalFiles: number; uniqueClasses: string[] }>
    generateSafelist: () => Promise<string[]>
    build: () => Promise<{ mergedClassList: string; css: string; scan: { totalFiles: number } }>
  }>
}

function makeFixture(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "tw-engine-artifact-"))
  fs.mkdirSync(path.join(root, "src"), { recursive: true })
  fs.writeFileSync(
    path.join(root, "src", "App.tsx"),
    [
      "export function App() {",
      "  return <div className=\"text-red-500 font-bold\">hello</div>",
      "}",
      "",
    ].join("\n")
  )
  return root
}

async function run(): Promise<void> {
  ensureNativeBindingArtifact()
  process.env.TWS_DISABLE_SCANNER_WORKER = "1"
  const createEngine = await loadCreateEngine()
  const fixtureRoot = makeFixture()

  const engine = await createEngine({
    root: fixtureRoot,
    compileCss: false,
    scanner: { includeExtensions: [".tsx"] },
  })

  const scan = await engine.scanWorkspace()
  assert.ok(scan.totalFiles >= 1, "scanWorkspace should detect at least one file")
  assert.ok(
    scan.uniqueClasses.includes("text-red-500"),
    "scanWorkspace should include text-red-500 class"
  )

  const safelist = await engine.generateSafelist()
  assert.ok(
    safelist.includes("font-bold"),
    "generateSafelist should include class extracted from fixture"
  )

  const build = await engine.build()
  assert.ok(build.scan.totalFiles >= 1, "build should include scan metadata")
  assert.match(
    build.mergedClassList,
    /text-red-500/,
    "build mergedClassList should include fixture class"
  )
  assert.equal(typeof build.css, "string", "build css should be a string artifact")

  fs.rmSync(fixtureRoot, { recursive: true, force: true })
  console.log("[artifact-assertions] PASS: engine facade artifacts validated.")
}

run().catch((error) => {
  console.error(
    "[artifact-assertions] FAIL:",
    error instanceof Error ? error.message : String(error)
  )
  process.exit(1)
})
