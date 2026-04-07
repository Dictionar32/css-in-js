/* Auto-generated from Rust JSON Schema — do not edit manually */

import { z } from "zod"

export const TransformResultSchema = z.object({
  "classes": z.array(z.string()),
  "css": z.string(),
})

export type TransformResult = z.infer<typeof TransformResultSchema>
