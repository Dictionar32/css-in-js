/* Auto-generated from Rust JSON Schema — do not edit manually */

import { z } from "zod"

export const RouteClassMapSchema = z.object({
  "classes": z.array(z.string()),
  "route": z.string(),
})

export type RouteClassMap = z.infer<typeof RouteClassMapSchema>
