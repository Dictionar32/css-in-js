import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"

const rootDir = process.cwd()
const packageJsonPath = path.join(rootDir, "package.json")
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"))
const exportsMap = packageJson.exports ?? {}

function getExportEntry(key) {
  const entry = exportsMap[key]
  assert.ok(entry, `missing exports entry: ${key}`)
  assert.equal(typeof entry, "object", `exports entry ${key} must be an object`)
  return entry
}

test("root export keeps import + require compatibility", () => {
  const rootExport = getExportEntry(".")
  assert.equal(typeof rootExport.import, "string")
  assert.equal(typeof rootExport.require, "string")
  assert.equal(typeof rootExport.types, "string")
})

test("critical subpath exports keep import + require compatibility", () => {
  const criticalSubpaths = [
    "./compiler",
    "./engine",
    "./plugin",
    "./runtime",
    "./shared",
    "./testing",
    "./next",
    "./vite",
  ]

  for (const subpath of criticalSubpaths) {
    const entry = getExportEntry(subpath)
    assert.equal(typeof entry.import, "string", `${subpath} must define import target`)
    assert.equal(typeof entry.require, "string", `${subpath} must define require target`)
  }
})

test("all object exports stay dual-mode while compatibility window is open", () => {
  for (const [subpath, entry] of Object.entries(exportsMap)) {
    if (!entry || typeof entry !== "object") {
      continue
    }

    const hasImport = Object.prototype.hasOwnProperty.call(entry, "import")
    const hasRequire = Object.prototype.hasOwnProperty.call(entry, "require")

    if (hasImport || hasRequire) {
      assert.equal(hasImport, true, `${subpath} is missing import target`)
      assert.equal(hasRequire, true, `${subpath} is missing require target`)
    }
  }
})
