import { z } from "zod"

const formatIssues = (error: z.ZodError): string =>
  error.issues
    .map((issue) => {
      const p = issue.path.length > 0 ? issue.path.join(".") : "<root>"
      return `${p}: ${issue.message}`
    })
    .join("; ")

const parseWithSchema = <T>(schema: z.ZodType<T>, data: unknown, label: string): T => {
  const parsed = schema.safeParse(data)
  if (parsed.success) return parsed.data
  throw new TypeError(`${label}: ${formatIssues(parsed.error)}`)
}

export const DesignTokensSchema: z.ZodType<
  Record<string, string | number | Record<string, unknown>>
> = z.record(z.string(), z.union([z.string(), z.number(), z.lazy(() => DesignTokensSchema)]))

export const TwClassResultSchema = z.object({
  css: z.string(),
  classes: z.array(z.string()),
})

export const TwPluginOptionsSchema = z.object({
  classProcessor: z
    .function({ input: [z.array(z.string())], output: TwClassResultSchema })
    .optional(),
  tokens: DesignTokensSchema.optional(),
  debug: z.boolean().optional(),
  minify: z.boolean().optional(),
})

export type TwPluginOptionsInput = z.infer<typeof TwPluginOptionsSchema>

export const PluginManifestSchema = z.object({
  name: z.string().min(1),
  setup: z.function({ input: [z.unknown()], output: z.unknown() }),
})

export type PluginManifestInput = z.infer<typeof PluginManifestSchema>

export const TransformRegistrationSchema = z.function({ input: [z.unknown()], output: z.unknown() })

export const TokenRegistrationSchema = z.object({
  name: z.string().min(1),
  value: z.string(),
})

export type TokenRegistrationInput = z.infer<typeof TokenRegistrationSchema>

export const parseTwPluginOptions = (options: unknown) =>
  parseWithSchema(TwPluginOptionsSchema, options ?? {}, "plugin options are invalid")

export const parsePluginManifest = (plugin: unknown) =>
  parseWithSchema(PluginManifestSchema, plugin, "plugin manifest is invalid")

export const parseTokenRegistration = (data: unknown) =>
  parseWithSchema(TokenRegistrationSchema, data, "token registration is invalid")

// ── Enhanced plugin validation (dari monorepo checklist) ────────────────────

/** Nama plugin harus mengikuti format npm package */
export const PluginNameSchema = z.string()
  .min(1, "Plugin name cannot be empty")
  .regex(
    /^(@[a-z0-9-]+\/)?[a-z0-9][a-z0-9-]*[a-z0-9]$/,
    "Plugin name must follow npm naming: lowercase, hyphens allowed, no leading/trailing hyphens"
  )

/** Versi semantic versioning */
export const SemverSchema = z.string()
  .regex(/^\d+\.\d+\.\d+(-[a-z0-9.]+)?$/, "Version must follow semver: x.y.z or x.y.z-prerelease")

/** Full plugin manifest dengan validasi nama dan versi */
export const FullPluginManifestSchema = PluginManifestSchema.extend({
  name: PluginNameSchema,
  version: SemverSchema.optional(),
  description: z.string().max(200).optional(),
  keywords: z.array(z.string()).max(10).optional(),
})

export type FullPluginManifest = z.infer<typeof FullPluginManifestSchema>

/** Validate full plugin manifest */
export const parseFullPluginManifest = (plugin: unknown): FullPluginManifest =>
  parseWithSchema(FullPluginManifestSchema, plugin, "plugin manifest is invalid")

/** Validate plugin name only */
export const validatePluginName = (name: unknown): string =>
  parseWithSchema(PluginNameSchema, name, "plugin name is invalid")

/** Zod validation for plugin registration payload */
export const PluginRegistrationPayloadSchema = z.object({
  plugin: FullPluginManifestSchema,
  config: z.record(z.string(), z.unknown()).optional(),
  priority: z.number().int().min(0).max(100).optional(),
})

export type PluginRegistrationPayload = z.infer<typeof PluginRegistrationPayloadSchema>

export const parsePluginRegistrationPayload = (payload: unknown): PluginRegistrationPayload =>
  parseWithSchema(PluginRegistrationPayloadSchema, payload, "plugin registration payload is invalid")
