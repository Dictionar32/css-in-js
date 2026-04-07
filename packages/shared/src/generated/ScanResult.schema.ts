/* Auto-generated from Rust JSON Schema — do not edit manually */

import { z } from "zod"

export const ScanResultSchema = z.object({
  "files_scanned": z.number().int().min(0),
  "unique_classes": z.array(z.string()),
})

export type ScanResult = z.infer<typeof ScanResultSchema>
