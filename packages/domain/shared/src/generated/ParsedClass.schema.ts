/* Auto-generated from Rust JSON Schema — do not edit manually */

import { z } from "zod"

export const ParsedClassSchema = z.object({
  "class_name": z.string(),
  "variants": z.array(z.string()),
})

export type ParsedClass = z.infer<typeof ParsedClassSchema>
