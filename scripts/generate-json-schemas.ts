#!/usr/bin/env node

/**
 * generate-json-schemas.ts — Rust → JSON Schema → Zod bridge
 *
 * Reads JSON Schema output from Rust (via schemars/JsonSchema derive),
 * converts each schema to a Zod schema definition, and writes the result
 * to packages/shared/src/generated/.
 *
 * Usage:
 *   node scripts/generate-json-schemas.ts [--check]
 *
 * Flags:
 *   --check   Dry-run mode: exit 1 if generated files differ from committed.
 *
 * Prerequisites:
 *   1. Cargo binary `export-schemas` must exist (generates JSON Schema files).
 *   2. Or manually place JSON Schema files in native/json-schemas/.
 */

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "..")
const SCHEMA_INPUT_DIR = path.resolve(ROOT, "native", "json-schemas")
const GENERATED_DIR = path.resolve(ROOT, "packages", "shared", "src", "generated")
const HEADER = "/* Auto-generated from Rust JSON Schema — do not edit manually */\n"
const INDEX_PATH = path.join(GENERATED_DIR, "index.ts")
const TYPES_DTS_PATH = path.join(GENERATED_DIR, "rust-schema-types.d.ts")

const CHECK_MODE = process.argv.includes("--check")
const PLACEHOLDER_SOURCE = [
  HEADER.trimEnd(),
  "",
  "// Placeholder index. No Rust JSON Schemas detected yet.",
  "// Once native/json-schemas/*.json exists, run scripts/generate-json-schemas.ts.",
  "export {}",
  "",
].join("\n")

const PLACEHOLDER_DTS_SOURCE = [HEADER.trimEnd(), "", "export {}", ""].join("\n")

const UNSUPPORTED_ROOT_KEYS = [
  "$comment",
  "$vocabulary",
  "$dynamicAnchor",
  "$dynamicRef",
  "$anchor",
  "$ref",
  "$defs",
  "$recursiveRef",
  "$recursiveAnchor",
  "dependencies",
  "patternProperties",
  "allOf",
  "anyOf",
  "oneOf",
  "not",
  "if",
  "then",
  "else",
] as const

// ── JSON Schema → Zod converter ────────────────────────────────────────────

function jsonSchemaTypeToZod(prop) {
  if (!prop || typeof prop !== "object") return "z.unknown()"

  if (prop.$ref) {
    const refName = prop.$ref.replace("#/$defs/", "").replace("#/definitions/", "")
    return `${refName}Schema`
  }

  const type = prop.type

  if (Array.isArray(prop.oneOf) || Array.isArray(prop.anyOf)) {
    const variants = (prop.oneOf || prop.anyOf).map((v) => jsonSchemaTypeToZod(v))
    return `z.union([${variants.join(", ")}])`
  }

  if (type === "string") {
    let schema = "z.string()"
    if (prop.minLength != null) schema += `.min(${prop.minLength})`
    if (prop.maxLength != null) schema += `.max(${prop.maxLength})`
    if (prop.pattern) schema += `.regex(new RegExp(${JSON.stringify(prop.pattern)}))`
    return schema
  }

  if (type === "integer") {
    let schema = "z.number().int()"
    if (prop.minimum != null) schema += `.min(${prop.minimum})`
    if (prop.maximum != null) schema += `.max(${prop.maximum})`
    return schema
  }

  if (type === "number") {
    let schema = "z.number()"
    if (prop.minimum != null) schema += `.min(${prop.minimum})`
    if (prop.maximum != null) schema += `.max(${prop.maximum})`
    return schema
  }

  if (type === "boolean") return "z.boolean()"

  if (type === "array") {
    const itemSchema = prop.items ? jsonSchemaTypeToZod(prop.items) : "z.unknown()"
    return `z.array(${itemSchema})`
  }

  if (type === "object") {
    if (prop.properties) {
      return buildObjectSchema(prop)
    }
    if (prop.additionalProperties) {
      const valSchema = jsonSchemaTypeToZod(prop.additionalProperties)
      return `z.record(z.string(), ${valSchema})`
    }
    return "z.record(z.string(), z.unknown())"
  }

  return "z.unknown()"
}

function buildObjectSchema(schema) {
  const props = schema.properties || {}
  const required = new Set(schema.required || [])
  const lines = []

  for (const [key, propSchema] of Object.entries(props)) {
    let zodType = jsonSchemaTypeToZod(propSchema)
    if (!required.has(key)) {
      zodType += ".optional()"
    }
    lines.push(`  ${JSON.stringify(key)}: ${zodType},`)
  }

  return `z.object({\n${lines.join("\n")}\n})`
}

function generateZodSchema(name, jsonSchema) {
  const objectSchema = buildObjectSchema(jsonSchema)
  const lines = [
    HEADER,
    `import { z } from "zod"`,
    "",
    `export const ${name}Schema = ${objectSchema}`,
    "",
    `export type ${name} = z.infer<typeof ${name}Schema>`,
    "",
  ]
  return lines.join("\n")
}

function validateRootSchema(filePath, file, jsonSchema) {
  if (jsonSchema.$schema !== "http://json-schema.org/draft-07/schema#") {
    console.error(`Invalid JSON Schema: ${filePath}`)
    process.exit(1)
  }
  if (jsonSchema.$id !== file) {
    console.error(`Invalid $id in ${filePath}: expected ${file}, got ${jsonSchema.$id}`)
    process.exit(1)
  }
  if (jsonSchema.type !== "object") {
    console.error(`Invalid type in ${filePath}: expected object, got ${jsonSchema.type}`)
    process.exit(1)
  }
  if (!jsonSchema.properties || typeof jsonSchema.properties !== "object") {
    console.error(`Invalid schema in ${filePath}: missing properties`)
    process.exit(1)
  }
  if (!Array.isArray(jsonSchema.required)) {
    console.error(`Invalid schema in ${filePath}: missing required array`)
    process.exit(1)
  }
  if (jsonSchema.additionalProperties !== false) {
    console.error(`Invalid schema in ${filePath}: additionalProperties must be false`)
    process.exit(1)
  }
  if (jsonSchema.unevaluatedProperties != null && jsonSchema.unevaluatedProperties !== false) {
    console.error(`Invalid schema in ${filePath}: unevaluatedProperties must be false when present`)
    process.exit(1)
  }

  for (const key of UNSUPPORTED_ROOT_KEYS) {
    if (jsonSchema[key] != null) {
      console.error(`Invalid schema in ${filePath}: ${key} not supported`)
      process.exit(1)
    }
  }
}

// ── Main ────────────────────────────────────────────────────────────────────

function main() {
  if (!fs.existsSync(GENERATED_DIR)) {
    fs.mkdirSync(GENERATED_DIR, { recursive: true })
  }

  if (!fs.existsSync(SCHEMA_INPUT_DIR)) {
    console.log(`No JSON Schema input directory found at ${SCHEMA_INPUT_DIR}`)
    console.log("To generate JSON Schemas from Rust, run:")
    console.log("  cargo run --bin export-schemas")
    console.log("")
    console.log("Or manually place JSON Schema files in native/json-schemas/")
    if (CHECK_MODE) {
      const current = fs.existsSync(INDEX_PATH) ? fs.readFileSync(INDEX_PATH, "utf-8") : ""
      if (current !== PLACEHOLDER_SOURCE) {
        console.error(`DRIFT: ${INDEX_PATH} differs from placeholder output`)
        process.exit(1)
      }
      const currentDts = fs.existsSync(TYPES_DTS_PATH) ? fs.readFileSync(TYPES_DTS_PATH, "utf-8") : ""
      if (currentDts !== PLACEHOLDER_DTS_SOURCE) {
        console.error(`DRIFT: ${TYPES_DTS_PATH} differs from placeholder output`)
        process.exit(1)
      }
      console.log("Placeholder index is up to date.")
      return
    }
    fs.writeFileSync(INDEX_PATH, PLACEHOLDER_SOURCE, "utf-8")
    fs.writeFileSync(TYPES_DTS_PATH, PLACEHOLDER_DTS_SOURCE, "utf-8")
    return
  }

  const schemaFiles = fs.readdirSync(SCHEMA_INPUT_DIR).filter((f) => f.endsWith(".json"))

  if (schemaFiles.length === 0) {
    console.log("No JSON Schema files found in native/json-schemas/")
    if (CHECK_MODE) {
      const current = fs.existsSync(INDEX_PATH) ? fs.readFileSync(INDEX_PATH, "utf-8") : ""
      if (current !== PLACEHOLDER_SOURCE) {
        console.error(`DRIFT: ${INDEX_PATH} differs from placeholder output`)
        process.exit(1)
      }
      console.log("Placeholder index is up to date.")
      return
    }
    fs.writeFileSync(INDEX_PATH, PLACEHOLDER_SOURCE, "utf-8")
    return
  }

  let changed = 0
  let unchanged = 0
  const indexExports: string[] = []
  const dtsTypeExports: string[] = []
  const expectedSchemaFiles = new Set<string>()

  for (const file of schemaFiles) {
    const filePath = path.join(SCHEMA_INPUT_DIR, file)
    const content = fs.readFileSync(filePath, "utf-8")
    const jsonSchema = JSON.parse(content)
    validateRootSchema(filePath, file, jsonSchema)

    const name = path.basename(file, ".json")
    const zodSource = generateZodSchema(name, jsonSchema)
    const outPath = path.join(GENERATED_DIR, `${name}.schema.ts`)
    expectedSchemaFiles.add(path.basename(outPath))
    indexExports.push(`export * from "./${name}.schema"`)
    dtsTypeExports.push(`export type { ${name} } from "./${name}.schema"`)

    if (CHECK_MODE) {
      if (fs.existsSync(outPath)) {
        const existing = fs.readFileSync(outPath, "utf-8")
        if (existing !== zodSource) {
          console.error(`DRIFT: ${outPath} differs from generated output`)
          changed++
        } else {
          unchanged++
        }
      } else {
        console.error(`MISSING: ${outPath} does not exist`)
        changed++
      }
    } else {
      fs.writeFileSync(outPath, zodSource, "utf-8")
      console.log(`Generated: ${outPath}`)
    }
  }

  if (CHECK_MODE) {
    const existingGenerated = fs.readdirSync(GENERATED_DIR).filter((f) => f.endsWith(".schema.ts"))
    for (const existing of existingGenerated) {
      if (!expectedSchemaFiles.has(existing)) {
        console.error(`STALE: ${path.join(GENERATED_DIR, existing)} should be removed`)
        changed++
      }
    }

    const expectedIndex = [HEADER.trimEnd(), "", ...indexExports.sort(), ""].join("\n")
    const currentIndex = fs.existsSync(INDEX_PATH) ? fs.readFileSync(INDEX_PATH, "utf-8") : ""
    if (currentIndex !== expectedIndex) {
      console.error(`DRIFT: ${INDEX_PATH} differs from generated output`)
      changed++
    }
    const expectedTypesDts = [HEADER.trimEnd(), "", ...dtsTypeExports.sort(), ""].join("\n")
    const currentTypesDts = fs.existsSync(TYPES_DTS_PATH) ? fs.readFileSync(TYPES_DTS_PATH, "utf-8") : ""
    if (currentTypesDts !== expectedTypesDts) {
      console.error(`DRIFT: ${TYPES_DTS_PATH} differs from generated output`)
      changed++
    }

    if (changed > 0) {
      console.error(`\n${changed} schema(s) are out of sync. Run: node scripts/generate-json-schemas.ts`)
      process.exit(1)
    } else {
      console.log(`All ${unchanged} generated schema(s) are up to date.`)
    }
  } else {
    const existingGenerated = fs.readdirSync(GENERATED_DIR).filter((f) => f.endsWith(".schema.ts"))
    for (const existing of existingGenerated) {
      if (!expectedSchemaFiles.has(existing)) {
        fs.unlinkSync(path.join(GENERATED_DIR, existing))
        console.log(`Removed stale: ${path.join(GENERATED_DIR, existing)}`)
      }
    }

    const indexSource = [HEADER.trimEnd(), "", ...indexExports.sort(), ""].join("\n")
    fs.writeFileSync(INDEX_PATH, indexSource, "utf-8")
    console.log(`Generated: ${INDEX_PATH}`)
    const dtsSource = [HEADER.trimEnd(), "", ...dtsTypeExports.sort(), ""].join("\n")
    fs.writeFileSync(TYPES_DTS_PATH, dtsSource, "utf-8")
    console.log(`Generated: ${TYPES_DTS_PATH}`)
  }
}

main()
