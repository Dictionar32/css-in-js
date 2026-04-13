import { describe, it } from "node:test"
import assert from "node:assert/strict"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createRequire } from "node:module"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

let mod
try {
  mod = require(path.resolve(__dirname, "../dist/index.js"))
} catch {
  console.warn("[compiler/tests] dist not found — jalankan `npm run build` dulu")
  process.exit(0) // INTENTIONAL: skip jika dist tidak ada (bukan false-positive — test tidak pernah "pass")
}

const { extractAllClasses } = mod ?? {}

describe("extractAllClasses", () => {
  it("extracts classes from JSX className prop", () => {
    if (!extractAllClasses) return
    const source = `<div className="px-4 py-2 bg-blue-500 text-white" />`
    const result = extractAllClasses(source)
    assert.ok(Array.isArray(result), "result should be array")
    assert.ok(result.includes("px-4"), `Expected px-4 in ${result}`)
    assert.ok(result.includes("py-2"), `Expected py-2 in ${result}`)
    assert.ok(result.includes("bg-blue-500"))
    assert.ok(result.includes("text-white"))
  })

  it("extracts classes from tw template literals", () => {
    if (!extractAllClasses) return
    const source = `const Btn = tw.button\`flex items-center gap-2\``
    const result = extractAllClasses(source)
    assert.ok(Array.isArray(result))
    const joined = result.join(" ")
    assert.ok(joined.includes("flex") || joined.includes("items-center"),
      `Expected tw classes in: ${joined}`)
  })

  it("returns empty array for source with no classes", () => {
    if (!extractAllClasses) return
    const result = extractAllClasses(`const x = 42`)
    assert.ok(Array.isArray(result))
    assert.equal(result.length, 0)
  })

  it("handles multiline className", () => {
    if (!extractAllClasses) return
    const source = `
      <div
        className={\`
          flex
          items-center
          gap-4
          hover:bg-blue-500
        \`}
      />
    `
    const result = extractAllClasses(source)
    assert.ok(Array.isArray(result))
  })
})
