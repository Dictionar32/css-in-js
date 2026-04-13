/**
 * Zod schemas untuk validasi native binding responses.
 *
 * Dipakai untuk memvalidasi data yang datang dari Rust native bindings
 * sebelum masuk ke domain logic TypeScript.
 *
 * Pattern:
 *   const raw = native.scanWorkspace(root)
 *   const validated = NativeScanResultSchema.parse(raw)
 *   // Setelah ini, gunakan `validated` (trusted typed object)
 */
import { z } from "zod"

// ── Scan ─────────────────────────────────────────────────────────────────────

export const NativeScanFileSchema = z.object({
  file: z.string().min(1, "file path cannot be empty"),
  classes: z.array(z.string()),
  hash: z.string().optional(),
})

export type NativeScanFile = z.infer<typeof NativeScanFileSchema>

export const NativeScanResultSchema = z.object({
  files: z.array(NativeScanFileSchema),
  totalFiles: z.number().int().nonnegative(),
  uniqueClasses: z.array(z.string()),
})

export type NativeScanResult = z.infer<typeof NativeScanResultSchema>

// ── Analyzer ──────────────────────────────────────────────────────────────────

export const NativeClassUsageSchema = z.object({
  name: z.string(),
  count: z.number().int().nonnegative(),
  files: z.array(z.string()).optional(),
})

export type NativeClassUsage = z.infer<typeof NativeClassUsageSchema>

export const NativeAnalyzerReportSchema = z.object({
  root: z.string(),
  topClasses: z.array(NativeClassUsageSchema).optional(),
  safelist: z.array(z.string()).optional(),
  css: z.string().optional(),
  conflicts: z.array(z.unknown()).optional(),
  unusedClasses: z.array(z.string()).optional(),
  durationMs: z.number().nonnegative().optional(),
})

export type NativeAnalyzerReport = z.infer<typeof NativeAnalyzerReportSchema>

// ── Transform ─────────────────────────────────────────────────────────────────

export const NativeTransformResultSchema = z.object({
  code: z.string(),
  classes: z.array(z.string()),
  changed: z.boolean(),
  rsc: z.object({
    isServer: z.boolean(),
    needsClientDirective: z.boolean(),
    clientReasons: z.array(z.string()),
  }).optional(),
})

export type NativeTransformResult = z.infer<typeof NativeTransformResultSchema>

// ── CSS Compile ───────────────────────────────────────────────────────────────

export const NativeCssCompileResultSchema = z.object({
  css: z.string(),
  resolvedClasses: z.array(z.string()),
  unresolvedClasses: z.array(z.string()).optional(),
})

export type NativeCssCompileResult = z.infer<typeof NativeCssCompileResultSchema>

// ── Watch ────────────────────────────────────────────────────────────────────

export const NativeWatchEventSchema = z.object({
  type: z.enum(["change", "unlink", "create"]),
  path: z.string(),
})

export type NativeWatchEvent = z.infer<typeof NativeWatchEventSchema>

export const NativeWatchResultSchema = z.object({
  status: z.enum(["ok", "error"]),
  handleId: z.string().optional(),
  error: z.string().optional(),
})

export type NativeWatchResult = z.infer<typeof NativeWatchResultSchema>

// ── Cache ────────────────────────────────────────────────────────────────────

export const NativeCacheEntrySchema = z.object({
  file: z.string(),
  hash: z.string(),
  classes: z.array(z.string()),
  timestamp: z.number(),
  size: z.number().optional(),
})

export type NativeCacheEntry = z.infer<typeof NativeCacheEntrySchema>

export const NativeCacheReadResultSchema = z.object({
  entries: z.array(NativeCacheEntrySchema),
  version: z.string().optional(),
})

export type NativeCacheReadResult = z.infer<typeof NativeCacheReadResultSchema>

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Validasi native binding response dengan fallback ke nilai default.
 * Gunakan ini di hot path agar tidak crash saat native returns unexpected shape.
 *
 * @example
 * const raw = native.scanWorkspace(root)
 * const result = safeParseNative(NativeScanResultSchema, raw, {
 *   files: [], totalFiles: 0, uniqueClasses: []
 * })
 */
export function safeParseNative<T>(
  schema: z.ZodType<T>,
  data: unknown,
  fallback: T
): T {
  const result = schema.safeParse(data)
  return result.success ? result.data : fallback
}

/**
 * Parse native response — throw TwError jika gagal.
 * Gunakan ini di boundary entry points.
 */
export function parseNative<T>(schema: z.ZodType<T>, data: unknown, context: string): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    const first = result.error.errors[0]
    const path = first?.path?.join(".") ?? "(root)"
    throw new Error(
      `[${context}] Native binding returned unexpected data: ${path}: ${first?.message ?? "validation failed"}`
    )
  }
  return result.data
}
