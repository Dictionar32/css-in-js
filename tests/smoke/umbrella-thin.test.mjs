/**
 * Smoke test: root umbrella package harus tetap thin (wrapper-only).
 * Verifikasi bahwa setiap file umbrella hanya berisi re-exports,
 * bukan logic/implementation sendiri.
 */
import { describe, it } from "node:test"
import assert from "node:assert/strict"
import path from "node:path"
import { fileURLToPath } from "node:url"
import fs from "node:fs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "../..")

describe("Root umbrella package — thin wrapper assertion", () => {
  const umbrellaDir = path.join(ROOT, "src", "umbrella")

  it("umbrella directory exists", () => {
    assert.ok(fs.existsSync(umbrellaDir), `umbrella dir should exist at ${umbrellaDir}`)
  })

  it("each umbrella file is a thin re-export (no implementation)", () => {
    if (!fs.existsSync(umbrellaDir)) return

    const files = fs.readdirSync(umbrellaDir).filter(f => f.endsWith(".ts"))
    assert.ok(files.length > 0, "umbrella should have files")

    for (const file of files) {
      const content = fs.readFileSync(path.join(umbrellaDir, file), "utf-8")
      const trimmed = content.trim()

      // Umbrella files should only have export * / export { } / import for bin
      const hasOnlyReExports = (
        trimmed.split("\n").every(line => {
          const stripped = line.trim()
          return (
            stripped === "" ||
            stripped.startsWith("//") ||
            stripped.startsWith("export *") ||
            stripped.startsWith("export {") ||
            stripped.startsWith("export type") ||
            stripped.startsWith("import ") ||
            stripped.startsWith("#!/usr/bin/env")
          )
        })
      )

      assert.ok(
        hasOnlyReExports,
        `${file} should only contain re-exports, found implementation code`
      )
    }
  })

  it("root src/ files are thin wrappers or bin stubs", () => {
    const srcDir = path.join(ROOT, "src")
    if (!fs.existsSync(srcDir)) return

    const topLevel = fs.readdirSync(srcDir)
      .filter(f => f.endsWith(".ts") && !fs.statSync(path.join(srcDir, f)).isDirectory())

    for (const file of topLevel) {
      const content = fs.readFileSync(path.join(srcDir, file), "utf-8")
      const lineCount = content.split("\n").filter(l => l.trim()).length
      // Thin wrappers should be short
      assert.ok(
        lineCount <= 10,
        `${file}: root src file should be thin (≤10 meaningful lines), found ${lineCount}`
      )
    }
  })
})
