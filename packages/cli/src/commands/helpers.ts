import fs from "node:fs"
import fsp from "node:fs/promises"
import { createRequire } from "node:module"
import path from "node:path"

import { CliUsageError } from "../utils/errors"
import { firstExistingPath, resolveMonorepoPath } from "../utils/paths"
import type { CommandContext } from "./types"

export type PluginInfo = {
  name: string
  description: string
  version: string
  tags: string[]
  official?: boolean
}

export function enumerateVariantProps(matrix: Record<string, Array<string | number | boolean>>) {
  const keys = Object.keys(matrix)
  if (keys.length === 0) return [{}]
  const result: Array<Record<string, string | number | boolean>> = []

  function walk(index: number, current: Record<string, string | number | boolean>) {
    if (index >= keys.length) {
      result.push({ ...current })
      return
    }
    const key = keys[index]
    const values = matrix[key] ?? []
    for (const value of values) {
      current[key] = value
      walk(index + 1, current)
    }
  }

  walk(0, {})
  return result
}

export async function resolveScript(
  context: CommandContext,
  relativeToRepoRoot: string
): Promise<string> {
  const relativeCandidates = buildRelativeCandidates(relativeToRepoRoot)
  const absoluteCandidates: string[] = []

  for (const relativeCandidate of relativeCandidates) {
    const fromRuntime = await resolveMonorepoPath(context.runtimeDir, relativeCandidate)
    const fromCwd = path.resolve(process.cwd(), relativeCandidate)
    absoluteCandidates.push(fromRuntime, fromCwd)
  }

  const resolved = await firstExistingPath(absoluteCandidates)
  if (!resolved) {
    throw new CliUsageError(`Required script not found: ${relativeToRepoRoot}`)
  }
  return resolved
}

interface ScriptCommand {
  binary: string
  args: string[]
}

function buildRelativeCandidates(relativeToRepoRoot: string): string[] {
  const normalized = relativeToRepoRoot.trim()
  if (!normalized) return [relativeToRepoRoot]

  const candidates = [normalized]
  if (normalized.endsWith(".mjs")) {
    candidates.push(normalized.replace(/\.mjs$/u, ".ts"))
  } else if (normalized.endsWith(".ts")) {
    candidates.push(normalized.replace(/\.ts$/u, ".mjs"))
  }
  return Array.from(new Set(candidates))
}

export function buildScriptCommand(scriptPath: string, scriptArgs: string[] = []): ScriptCommand {
  const isTypeScriptEntry =
    scriptPath.endsWith(".ts") || scriptPath.endsWith(".tsx") || scriptPath.endsWith(".mts")

  if (isTypeScriptEntry) {
    const requireFromHere = createRequire(import.meta.url)
    try {
      const tsxCliPath = requireFromHere.resolve("tsx/dist/cli.mjs")
      return {
        binary: process.execPath,
        args: [tsxCliPath, scriptPath, ...scriptArgs],
      }
    } catch {
      const mjsFallbackPath = scriptPath.replace(/\.(?:ts|tsx|mts)$/u, ".mjs")
      if (fs.existsSync(mjsFallbackPath)) {
        return {
          binary: process.execPath,
          args: [mjsFallbackPath, ...scriptArgs],
        }
      }
      throw new CliUsageError(
        `TypeScript runtime unavailable for script: ${scriptPath}. Install 'tsx' or provide an .mjs fallback.`
      )
    }
  }

  return {
    binary: process.execPath,
    args: [scriptPath, ...scriptArgs],
  }
}

export async function loadRegistry(context: CommandContext): Promise<PluginInfo[]> {
  const runtimeRegistryPath = await resolveMonorepoPath(
    context.runtimeDir,
    "packages/plugin-registry/registry.json"
  )
  const candidates: string[] = [
    runtimeRegistryPath,
    path.resolve(process.cwd(), "packages/plugin-registry/registry.json"),
  ]

  const registryPath = await firstExistingPath(candidates)
  if (!registryPath) {
    throw new CliUsageError("Plugin registry file not found.")
  }

  const raw = await fsp.readFile(registryPath, "utf8")
  const data = JSON.parse(raw) as { official: PluginInfo[]; community: PluginInfo[] }
  return [
    ...data.official.map((item) => ({ ...item, official: true })),
    ...data.community.map((item) => ({ ...item, official: false })),
  ]
}

export function validatePackageName(value: string): boolean {
  return /^(?:@[a-z0-9._-]+\/)?[a-z0-9][a-z0-9._-]*$/i.test(value)
}
