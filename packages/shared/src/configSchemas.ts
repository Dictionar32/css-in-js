/**
 * Zod schemas untuk JSON, cache, manifest, dan config reads.
 * PLAN.md: "JSON, cache, manifest, and config reads should be parsed into typed schema-backed values"
 *
 * Pattern: validate at the I/O boundary, pass typed values inward.
 */
import { z } from "zod"

// ── Scan Cache ────────────────────────────────────────────────────────────────

/** Schema untuk .tailwind-styled/scan-cache.json */
export const ScanCacheClassEntrySchema = z.object({
  name: z.string().min(1),
  usedIn: z.array(z.string()),
  risk: z.enum(["low", "medium", "high"]).default("low"),
  bundleContribution: z.number().nonnegative().default(0),
  variants: z.array(z.string()).default([]),
})
export type ScanCacheClassEntry = z.infer<typeof ScanCacheClassEntrySchema>

export const ScanCacheSchema = z.object({
  version: z.string().default("1"),
  generatedAt: z.string(),
  root: z.string(),
  classNames: z.array(ScanCacheClassEntrySchema),
  totalFiles: z.number().int().nonnegative(),
  uniqueCount: z.number().int().nonnegative(),
})
export type ScanCache = z.infer<typeof ScanCacheSchema>

// ── Tailwind Config ───────────────────────────────────────────────────────────

export const TailwindContentItemSchema = z.union([
  z.string(),
  z.object({
    raw: z.string(),
    extension: z.string().optional(),
  }),
  z.object({
    files: z.array(z.string()),
    transform: z.record(z.function()).optional(),
  }),
])

export const TailwindConfigSchema = z.object({
  content: z.array(TailwindContentItemSchema).optional(),
  theme: z.record(z.unknown()).optional(),
  plugins: z.array(z.unknown()).optional(),
  darkMode: z.union([z.literal("class"), z.literal("media"), z.literal(false)]).optional(),
  prefix: z.string().optional(),
  safelist: z.array(z.union([z.string(), z.object({ pattern: z.instanceof(RegExp) })])).optional(),
  blocklist: z.array(z.string()).optional(),
}).passthrough() // Allow additional Tailwind v4 config keys
export type TailwindConfig = z.infer<typeof TailwindConfigSchema>

// ── Plugin Registry Entry ─────────────────────────────────────────────────────

export const RegistryPluginEntrySchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  version: z.string(),
  tags: z.array(z.string()).default([]),
  official: z.boolean().default(false),
  docs: z.string().url().optional(),
  install: z.string().optional(),
  integrity: z.string().optional(),
})
export type RegistryPluginEntry = z.infer<typeof RegistryPluginEntrySchema>

export const RegistryFileSchema = z.object({
  version: z.string(),
  official: z.array(RegistryPluginEntrySchema).default([]),
  community: z.array(RegistryPluginEntrySchema).default([]),
})
export type RegistryFile = z.infer<typeof RegistryFileSchema>

// ── Package.json (minimal) ────────────────────────────────────────────────────

export const PackageJsonSchema = z.object({
  name: z.string(),
  version: z.string(),
  scripts: z.record(z.string()).optional(),
  dependencies: z.record(z.string()).optional(),
  devDependencies: z.record(z.string()).optional(),
  peerDependencies: z.record(z.string()).optional(),
  main: z.string().optional(),
  module: z.string().optional(),
  exports: z.unknown().optional(),
  type: z.enum(["module", "commonjs"]).optional(),
}).passthrough()
export type PackageJson = z.infer<typeof PackageJsonSchema>

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Parse JSON string dengan schema validation.
 * Melempar error yang human-readable jika gagal.
 *
 * @example
 * const cache = parseJsonWithSchema(
 *   fs.readFileSync(".tailwind-styled/scan-cache.json", "utf-8"),
 *   ScanCacheSchema,
 *   "scan-cache.json"
 * )
 */
export function parseJsonWithSchema<T>(
  jsonString: string,
  schema: z.ZodType<T>,
  sourceName: string
): T {
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonString)
  } catch (err) {
    throw new Error(
      `[${sourceName}] Invalid JSON: ${err instanceof Error ? err.message : String(err)}`
    )
  }

  const result = schema.safeParse(parsed)
  if (!result.success) {
    const issues = result.error.errors
      .map(e => `  ${e.path.join(".")}: ${e.message}`)
      .join("\n")
    throw new Error(`[${sourceName}] Schema validation failed:\n${issues}`)
  }

  return result.data
}

/**
 * Parse JSON file dengan schema validation.
 *
 * @example
 * const pkg = parseJsonFileWithSchema("package.json", PackageJsonSchema)
 */
export function parseJsonFileWithSchema<T>(
  filePath: string,
  schema: z.ZodType<T>
): T {
  const { readFileSync } = require("node:fs") as typeof import("node:fs")
  const { basename } = require("node:path") as typeof import("node:path")

  let content: string
  try {
    content = readFileSync(filePath, "utf-8")
  } catch (err) {
    throw new Error(
      `[${basename(filePath)}] Could not read file: ${err instanceof Error ? err.message : String(err)}`
    )
  }

  return parseJsonWithSchema(content, schema, basename(filePath))
}
