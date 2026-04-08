#!/usr/bin/env tsx

import assert from "node:assert/strict"
import path from "node:path"
import { pathToFileURL } from "node:url"

const repoRoot = process.cwd()

async function importTsModule(relativePath: string): Promise<Record<string, unknown>> {
  const absolutePath = path.join(repoRoot, relativePath)
  const moduleUrl = pathToFileURL(absolutePath).href
  return import(moduleUrl)
}

async function run(): Promise<void> {
  const engineMod = await importTsModule("packages/engine/src/index.ts")
  const createEngine = engineMod.createEngine as ((options?: Record<string, unknown>) => Promise<Record<string, unknown>>) | undefined
  assert.equal(typeof createEngine, "function", "engine.createEngine should be exported")

  const engine = await createEngine?.({ root: repoRoot, compileCss: false })
  assert.ok(engine, "createEngine should return facade object")
  assert.equal(typeof engine?.scanWorkspace, "function", "engine facade must expose scanWorkspace")
  assert.equal(typeof engine?.analyzeWorkspace, "function", "engine facade must expose analyzeWorkspace")
  assert.equal(typeof engine?.generateSafelist, "function", "engine facade must expose generateSafelist")
  assert.equal(typeof engine?.build, "function", "engine facade must expose build")

  const viteMod = await importTsModule("packages/vite/src/plugin.ts")
  assert.equal(typeof viteMod.tailwindStyledPlugin, "function", "vite adapter should export tailwindStyledPlugin")

  const nextMod = await importTsModule("packages/next/src/index.ts")
  assert.equal(typeof nextMod.withTailwindStyled, "function", "next adapter should export withTailwindStyled")

  const rspackMod = await importTsModule("packages/rspack/src/index.ts")
  assert.equal(typeof rspackMod.tailwindStyledRspackPlugin, "function", "rspack adapter should export tailwindStyledRspackPlugin")

  console.log("[adapter-smoke] PASS: engine facade + vite/next/rspack adapters exported correctly.")
}

run().catch((error) => {
  console.error(
    "[adapter-smoke] FAIL:",
    error instanceof Error ? error.message : String(error)
  )
  process.exit(1)
})
