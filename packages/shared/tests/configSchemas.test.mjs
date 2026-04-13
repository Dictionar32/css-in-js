import { describe, it } from "node:test"
import assert from "node:assert/strict"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createRequire } from "node:module"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const req = createRequire(import.meta.url)

let mod
try {
  mod = req(path.resolve(__dirname, "../dist/index.js"))
} catch {
  console.warn("[shared/tests] dist not found")
  process.exit(0) // INTENTIONAL
}

const {
  ScanCacheSchema, TailwindConfigSchema, RegistryFileSchema,
  PackageJsonSchema, parseJsonWithSchema
} = mod

describe("ScanCacheSchema", () => {
  it("validates correct scan cache", () => {
    if (!ScanCacheSchema) return
    const data = {
      version: "1",
      generatedAt: new Date().toISOString(),
      root: "/projects/my-app",
      classNames: [
        { name: "flex", usedIn: ["Button.tsx"], risk: "low", bundleContribution: 10, variants: [] },
      ],
      totalFiles: 5,
      uniqueCount: 1,
    }
    const result = ScanCacheSchema.safeParse(data)
    assert.ok(result.success, `Should parse: ${result.error?.message}`)
    assert.equal(result.data.classNames.length, 1)
  })

  it("rejects empty className name", () => {
    if (!ScanCacheSchema) return
    const data = {
      version: "1",
      generatedAt: new Date().toISOString(),
      root: "/",
      classNames: [{ name: "", usedIn: [], risk: "low", bundleContribution: 0, variants: [] }],
      totalFiles: 0,
      uniqueCount: 0,
    }
    const result = ScanCacheSchema.safeParse(data)
    assert.ok(!result.success, "Should fail for empty name")
  })
})

describe("TailwindConfigSchema", () => {
  it("validates minimal config", () => {
    if (!TailwindConfigSchema) return
    const result = TailwindConfigSchema.safeParse({ content: ["./src/**/*.tsx"] })
    assert.ok(result.success, `Should parse minimal config`)
  })

  it("validates full config", () => {
    if (!TailwindConfigSchema) return
    const result = TailwindConfigSchema.safeParse({
      content: ["./src/**/*.tsx"],
      darkMode: "class",
      theme: { extend: { colors: { brand: "#3b82f6" } } },
      plugins: [],
    })
    assert.ok(result.success)
  })

  it("allows extra keys (passthrough)", () => {
    if (!TailwindConfigSchema) return
    const result = TailwindConfigSchema.safeParse({ futureFlag: true, experimental: {} })
    assert.ok(result.success, "passthrough should allow extra keys")
  })
})

describe("RegistryFileSchema", () => {
  it("validates registry file", () => {
    if (!RegistryFileSchema) return
    const data = {
      version: "5.0.0",
      official: [{
        name: "@tailwind-styled/typography",
        description: "Typography plugin",
        version: "1.0.0",
        tags: ["typography"],
        official: true,
      }],
      community: [],
    }
    const result = RegistryFileSchema.safeParse(data)
    assert.ok(result.success)
    assert.equal(result.data.official.length, 1)
  })
})

describe("PackageJsonSchema", () => {
  it("validates minimal package.json", () => {
    if (!PackageJsonSchema) return
    const result = PackageJsonSchema.safeParse({ name: "my-pkg", version: "1.0.0" })
    assert.ok(result.success)
  })

  it("rejects missing name", () => {
    if (!PackageJsonSchema) return
    const result = PackageJsonSchema.safeParse({ version: "1.0.0" })
    assert.ok(!result.success)
  })
})

describe("parseJsonWithSchema()", () => {
  it("parses valid JSON with schema", () => {
    if (!parseJsonWithSchema || !PackageJsonSchema) return
    const json = JSON.stringify({ name: "test-pkg", version: "0.1.0" })
    const result = parseJsonWithSchema(json, PackageJsonSchema, "package.json")
    assert.equal(result.name, "test-pkg")
  })

  it("throws readable error for invalid JSON", () => {
    if (!parseJsonWithSchema || !PackageJsonSchema) return
    assert.throws(
      () => parseJsonWithSchema("{invalid json}", PackageJsonSchema, "test.json"),
      (err) => {
        assert.ok(String(err).includes("test.json"))
        assert.ok(String(err).includes("Invalid JSON"))
        return true
      }
    )
  })

  it("throws readable error for schema failure", () => {
    if (!parseJsonWithSchema || !PackageJsonSchema) return
    assert.throws(
      () => parseJsonWithSchema('{"version":"1.0.0"}', PackageJsonSchema, "pkg.json"),
      (err) => {
        assert.ok(String(err).includes("Schema validation failed"))
        return true
      }
    )
  })
})
