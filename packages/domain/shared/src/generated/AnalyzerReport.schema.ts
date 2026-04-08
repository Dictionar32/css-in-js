/* Auto-generated from Rust JSON Schema — do not edit manually */

import { z } from "zod"

export const AnalyzerReportSchema = z.object({
  "duplicates": z.number().int().min(0),
  "total_classes": z.number().int().min(0),
})

export type AnalyzerReport = z.infer<typeof AnalyzerReportSchema>
