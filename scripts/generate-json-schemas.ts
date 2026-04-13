#!/usr/bin/env node
/**
 * generate-json-schemas.ts
 * PLAN.md: "Buat scripts/generate-json-schemas.mjs untuk Rust → JSON Schema → Zod bridge"
 *
 * Flow:
 * 1. Baca JSON Schema files dari native/json-schemas/
 * 2. Convert setiap schema ke Zod schema string
 * 3. Tulis ke packages/shared/src/generated/
 *
 * Usage: npx tsx scripts/generate-json-schemas.ts
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "..")
const INPUT_DIR = path.join(ROOT, "native", "json-schemas")
const OUTPUT_DIR = path.join(ROOT, "packages", "shared", "src", "generated")

// ── JSON Schema → Zod converter ───────────────────────────────────────────────

interface JsonSchema {
  type?: string | string[]
  properties?: Record<string, JsonSchema>
  required?: string[]
  items?: JsonSchema
  $ref?: string
  enum?: unknown[]
  anyOf?: JsonSchema[]
  oneOf?: JsonSchema[]
  allOf?: JsonSchema[]
  description?: string
  title?: string
  default?: unknown
  minimum?: number
  maximum?: number
  minLength?: number
  maxLength?: number
  pattern?: string
  additionalProperties?: boolean | JsonSchema
}

function jsonSchemaToZod(schema: JsonSchema, indent = 0): string {
  const pad = "  ".repeat(indent)

  if (schema.$ref) {
    const name = schema.$ref.replace("#/definitions/", "")
    return `${name}Schema`
  }

  if (schema.enum) {
    const values = schema.enum.map(v => JSON.stringify(v)).join(", ")
    return `z.enum([${values}])`
  }

  if (schema.anyOf || schema.oneOf) {
    const variants = (schema.anyOf ?? schema.oneOf ?? []).map(s => jsonSchemaToZod(s, indent))
    return `z.union([${variants.join(", ")}])`
  }

  const type = Array.isArray(schema.type) ? schema.type[0] : schema.type

  switch (type) {
    case "string": {
      let z = "z.string()"
      if (schema.minLength) z += `.min(${schema.minLength})`
      if (schema.maxLength) z += `.max(${schema.maxLength})`
      if (schema.pattern) z += `.regex(/${schema.pattern}/)`
      return z
    }
    case "number":
    case "integer": {
      let z = type === "integer" ? "z.number().int()" : "z.number()"
      if (schema.minimum !== undefined) z += `.min(${schema.minimum})`
      if (schema.maximum !== undefined) z += `.max(${schema.maximum})`
      return z
    }
    case "boolean":
      return "z.boolean()"
    case "null":
      return "z.null()"
    case "array": {
      const itemType = schema.items ? jsonSchemaToZod(schema.items, indent) : "z.unknown()"
      return `z.array(${itemType})`
    }
    case "object": {
      if (!schema.properties) {
        if (schema.additionalProperties) {
          const valType = typeof schema.additionalProperties === "object"
            ? jsonSchemaToZod(schema.additionalProperties, indent)
            : "z.unknown()"
          return `z.record(z.string(), ${valType})`
        }
        return "z.record(z.string(), z.unknown())"
      }

      const required = new Set(schema.required ?? [])
      const fields = Object.entries(schema.properties).map(([key, val]) => {
        const zodType = jsonSchemaToZod(val, indent + 1)
        const isOptional = !required.has(key)
        const comment = val.description ? `// ${val.description}\n${pad}  ` : ""
        return `${pad}  ${comment}${key}: ${zodType}${isOptional ? ".optional()" : ""},`
      })

      return `z.object({\n${fields.join("\n")}\n${pad}})`
    }
    default:
      return "z.unknown()"
  }
}

// ── Definitions resolver ──────────────────────────────────────────────────────

interface FullSchema {
  title?: string
  description?: string
  definitions?: Record<string, JsonSchema>
  $ref?: string
  properties?: Record<string, JsonSchema>
  type?: string
  required?: string[]
}

function generateZodFile(schemaName: string, fullSchema: FullSchema): string {
  const lines: string[] = [
    `/**`,
    ` * Auto-generated Zod schema from Rust JSON Schema.`,
    ` * DO NOT EDIT MANUALLY — regenerate with: npm run generate:schemas`,
    ` *`,
    ` * Source: native/json-schemas/${schemaName}.json`,
    ` */`,
    `import { z } from "zod"`,
    ``,
  ]

  // Generate schemas for definitions first (referenced types)
  if (fullSchema.definitions) {
    for (const [defName, defSchema] of Object.entries(fullSchema.definitions)) {
      const zodType = jsonSchemaToZod(defSchema)
      lines.push(`export const ${defName}Schema = ${zodType}`)
      lines.push(`export type ${defName} = z.infer<typeof ${defName}Schema>`)
      lines.push(``)
    }
  }

  // Generate main schema
  const mainSchema = fullSchema.$ref
    ? { $ref: fullSchema.$ref }
    : fullSchema as JsonSchema

  const zodType = jsonSchemaToZod(mainSchema)
  const typeName = schemaName
    .replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
    .replace(/^[a-z]/, (c: string) => c.toUpperCase())

  lines.push(`export const ${typeName}Schema = ${zodType}`)
  lines.push(`export type ${typeName} = z.infer<typeof ${typeName}Schema>`)
  lines.push(``)

  return lines.join("\n")
}

// ── Main ─────────────────────────────────────────────────────────────────────

function main() {
  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  // Check if input directory exists
  if (!fs.existsSync(INPUT_DIR)) {
    console.warn(`[generate-json-schemas] Input dir not found: ${INPUT_DIR}`)
    console.warn(`  Run: cargo run --bin export-schemas`)
    // Create placeholder index
    writeGeneratedIndex([])
    return
  }

  const jsonFiles = fs.readdirSync(INPUT_DIR).filter(f => f.endsWith(".json"))

  if (jsonFiles.length === 0) {
    console.warn(`[generate-json-schemas] No JSON Schema files found in ${INPUT_DIR}`)
    console.warn(`  Run: cargo run --bin export-schemas`)
    writeGeneratedIndex([])
    return
  }

  const generated: string[] = []

  for (const file of jsonFiles) {
    const schemaName = file.replace(".json", "")
    const inputPath = path.join(INPUT_DIR, file)
    const outputPath = path.join(OUTPUT_DIR, `${schemaName}.schema.ts`)

    try {
      const jsonStr = fs.readFileSync(inputPath, "utf-8")
      const schema: FullSchema = JSON.parse(jsonStr)
      const zodFile = generateZodFile(schemaName, schema)
      fs.writeFileSync(outputPath, zodFile)
      console.log(`[generate-json-schemas] ✓ ${schemaName} → ${path.relative(ROOT, outputPath)}`)
      generated.push(schemaName)
    } catch (err) {
      console.error(`[generate-json-schemas] ✗ ${schemaName}: ${err}`)
    }
  }

  writeGeneratedIndex(generated)
  console.log(`\n[generate-json-schemas] Done. ${generated.length} schemas generated.`)
}

function writeGeneratedIndex(schemas: string[]) {
  const lines: string[] = [
    `/**`,
    ` * Auto-generated index for Rust → Zod schemas.`,
    ` * DO NOT EDIT — regenerate with: npm run generate:schemas`,
    ` */`,
    ``,
  ]

  if (schemas.length === 0) {
    lines.push(`// No schemas generated yet.`)
    lines.push(`// Run: cargo run --bin export-schemas && npx tsx scripts/generate-json-schemas.ts`)
    lines.push(``)
    lines.push(`export const SCHEMAS_GENERATED = false`)
    lines.push(`export const SCHEMAS_VERSION = "0.0.0"`)
    lines.push(`export const GENERATED_SCHEMA_NAMES: string[] = []`)
  } else {
    for (const name of schemas) {
      const typeName = name
        .replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())
        .replace(/^[a-z]/, (c: string) => c.toUpperCase())
      lines.push(`export * from "./${name}.schema"`)
    }
    lines.push(``)
    lines.push(`export const SCHEMAS_GENERATED = true`)
    lines.push(`export const SCHEMAS_VERSION = "${new Date().toISOString().slice(0, 10)}"`)
    lines.push(`export const GENERATED_SCHEMA_NAMES = ${JSON.stringify(schemas)}`)
  }

  const indexPath = path.join(OUTPUT_DIR, "index.ts")
  fs.writeFileSync(indexPath, lines.join("\n"))
  console.log(`[generate-json-schemas] Generated index: ${path.relative(ROOT, indexPath)}`)
}

main()
