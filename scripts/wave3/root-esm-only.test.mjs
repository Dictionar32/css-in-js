import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"

const rootDir = process.cwd()
const packageJsonPath = path.join(rootDir, "package.json")
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"))
const exportsMap = packageJson.exports ?? {}

test("root exports are ESM-only (no require paths)", () => {
  for (const [subpath, entry] of Object.entries(exportsMap)) {
    if (!entry || typeof entry !== "object") continue
    assert.equal(
      Object.prototype.hasOwnProperty.call(entry, "require"),
      false,
      `${subpath} should not expose require path in ESM-only mode`
    )
  }
})

test("root exports keep import targets for all object subpaths", () => {
  for (const [subpath, entry] of Object.entries(exportsMap)) {
    if (!entry || typeof entry !== "object") continue
    assert.equal(typeof entry.import, "string", `${subpath} should keep import target`)
  }
})
