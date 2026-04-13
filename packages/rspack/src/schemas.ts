import { z } from "zod"
import { TwError } from "@tailwind-styled/shared"

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
  throw TwError.fromZod(parsed.error)
}

export const RspackPluginOptionsSchema = z.object({
  include: z.instanceof(RegExp).optional(),
  exclude: z.instanceof(RegExp).optional(),
  addDataAttr: z.boolean().optional(),
  analyze: z.boolean().optional(),
  cssEntry: z.string().optional(),
})

export type RspackPluginOptionsInput = z.infer<typeof RspackPluginOptionsSchema>

export const parseRspackPluginOptions = (options: unknown) =>
  parseWithSchema(RspackPluginOptionsSchema, options ?? {}, "rspack plugin options are invalid")
