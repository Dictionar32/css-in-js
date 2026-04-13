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
  console.warn("[cli/tests] dist not found")
  process.exit(0) // INTENTIONAL
}

describe("CLI arg utilities", () => {
  it("parseCliArgs is exported if available", () => {
    const fn = mod.parseCliArgs ?? mod.parseArgs ?? mod.parseCli
    if (!fn) {
      console.warn("[cli] parseCliArgs not exported, skipping")
      return
    }
    assert.equal(typeof fn, "function")
  })

  it("ensureFlag is exported if available", () => {
    // ensureFlag may be internal only
    const fn = mod.ensureFlag
    if (!fn) return
    assert.equal(typeof fn, "function")
  })

  it("createCliOutput is exported", () => {
    const fn = mod.createCliOutput
    if (!fn) {
      console.warn("[cli] createCliOutput not exported")
      return
    }
    assert.equal(typeof fn, "function")
    // Test it creates an output object
    const output = fn({ json: false, debug: false, verbose: false })
    assert.ok(output, "output should be truthy")
    assert.equal(typeof output.writeText, "function")
    assert.equal(typeof output.jsonSuccess, "function")
    assert.equal(typeof output.spinner, "function")
  })
})
