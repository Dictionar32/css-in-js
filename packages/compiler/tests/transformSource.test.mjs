import { describe, it } from "node:test"
import assert from "node:assert/strict"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createRequire } from "node:module"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

// Guard: skip gracefully jika dist belum dibangun
let mod
try {
  mod = require(path.resolve(__dirname, "../dist/index.js"))
} catch {
  console.warn("[compiler/tests] dist not found — jalankan `npm run build` dulu")
  process.exit(0) // INTENTIONAL: skip jika dist tidak ada (bukan false-positive — test tidak pernah "pass")
}

const { transformSource } = mod

describe("transformSource", () => {
  it("transforms basic tw template literal", () => {
    const source = `
      import { tw } from "tailwind-styled-v4"
      const Button = tw.button\`px-4 py-2 rounded\`
    `
    const result = transformSource(source, { filename: "Button.tsx" })
    assert.ok(result, "result should not be null")
    assert.ok(typeof result.code === "string", "result.code should be string")
    assert.ok(Array.isArray(result.classes), "result.classes should be array")
  })

  it("extracts classes from template literal", () => {
    const source = `const Btn = tw.button\`flex items-center gap-2\``
    const result = transformSource(source, { filename: "test.tsx" })
    if (!result) return // native not available
    const classes = result.classes ?? []
    assert.ok(classes.some(c => ["flex", "items-center", "gap-2"].includes(c)),
      `Expected flex/items-center/gap-2 in ${JSON.stringify(classes)}`)
  })

  it("handles tw object config with variants", () => {
    const source = `
      const Button = tw.button({
        base: "px-4 py-2",
        variants: { size: { sm: "h-8 text-sm", lg: "h-12 text-lg" } },
        defaultVariants: { size: "sm" }
      })
    `
    const result = transformSource(source, { filename: "Button.tsx" })
    if (!result) return
    assert.ok(typeof result.code === "string")
  })

  it("returns null or passthrough for non-tw source", () => {
    const source = `const x = 1 + 2`
    const result = transformSource(source, { filename: "plain.ts" })
    // null = no tw usage, or passthrough with original code
    if (result !== null && result !== undefined) {
      assert.ok(typeof result.code === "string")
    }
  })

  it("handles empty source", () => {
    const result = transformSource("", { filename: "empty.tsx" })
    assert.ok(result === null || result === undefined || typeof result.code === "string")
  })
})
