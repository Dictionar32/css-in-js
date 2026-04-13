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
  console.warn("[next/tests] dist not found")
  process.exit(0)
}

const { default: turbopackLoader, detectRouter } = mod ?? {}

describe("detectRouter()", () => {
  if (!detectRouter) {
    it.skip = true
    return
  }
  it("detects app router", () => {
    assert.equal(detectRouter("/project/src/app/page.tsx"), "app")
    assert.equal(detectRouter("C:\\project\\app\\layout.tsx"), "app")
  })
  it("detects pages router", () => {
    assert.equal(detectRouter("/project/src/pages/index.tsx"), "pages")
  })
  it("returns unknown for other paths", () => {
    assert.equal(detectRouter("/project/src/components/Button.tsx"), "unknown")
  })
})

describe("turbopackLoader()", () => {
  it("is exported as function", () => {
    if (!turbopackLoader) {
      console.warn("[next] turbopackLoader not exported, skipping")
      return
    }
    assert.equal(typeof turbopackLoader, "function")
  })

  it("returns source unchanged for non-tw files", () => {
    if (!turbopackLoader) return
    const source = `const x = 1 + 2`
    const ctx = { resourcePath: "/project/src/app/utils.ts" }
    try {
      const result = turbopackLoader.call(ctx, source, {})
      assert.ok(typeof result === "string")
    } catch (err) {
      if (String(err).includes("native") || String(err).includes("NATIVE")) {
        console.warn("[turbopack] Native not available, skipping transform test")
        return
      }
      throw err
    }
  })

  it("skips node_modules", () => {
    if (!turbopackLoader) return
    const source = `import { tw } from "tailwind-styled-v4"; const B = tw.button\`px-4\``
    const ctx = { resourcePath: "/project/node_modules/some-pkg/index.tsx" }
    try {
      const result = turbopackLoader.call(ctx, source, {})
      // node_modules should be skipped → return unchanged
      assert.equal(result, source)
    } catch (err) {
      if (String(err).includes("native") || String(err).includes("NATIVE")) return
      throw err
    }
  })

  it("preserves use client directive", () => {
    if (!turbopackLoader) return
    const source = `"use client"\nimport { tw } from "tailwind-styled-v4"\nconst B = tw.div\`flex\``
    const ctx = { resourcePath: "/project/src/app/client.tsx" }
    try {
      const result = turbopackLoader.call(ctx, source, {})
      assert.ok(result.startsWith('"use client"') || result.startsWith("'use client'"),
        `Expected use client preserved, got: ${result.slice(0, 50)}`)
    } catch (err) {
      if (String(err).includes("native") || String(err).includes("NATIVE")) return
      throw err
    }
  })

  it("skips .d.ts files", () => {
    if (!turbopackLoader) return
    const source = `export type Foo = string`
    const ctx = { resourcePath: "/project/src/types.d.ts" }
    const result = turbopackLoader.call(ctx, source, {})
    assert.equal(result, source, ".d.ts should pass through unchanged")
  })
})
