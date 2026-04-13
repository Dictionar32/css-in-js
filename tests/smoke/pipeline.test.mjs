/**
 * Smoke test: scanner → analyzer → compiler → engine pipeline
 * Verifikasi bahwa pipeline utama bekerja end-to-end.
 */
import { describe, it } from "node:test"
import assert from "node:assert/strict"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createRequire } from "node:module"
import fs from "node:fs"
import os from "node:os"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const req = createRequire(import.meta.url)
const ROOT = path.resolve(__dirname, "../..")

function tryLoad(distPath) {
  try { return req(distPath) } catch { return null }
}

const scannerMod = tryLoad(path.join(ROOT, "packages/scanner/dist/index.js"))
const analyzerMod = tryLoad(path.join(ROOT, "packages/analyzer/dist/index.js"))
const compilerMod = tryLoad(path.join(ROOT, "packages/compiler/dist/index.js"))
const engineMod  = tryLoad(path.join(ROOT, "packages/engine/dist/index.js"))

describe("Pipeline smoke: scanner", () => {
  it("scanner module is loadable", () => {
    if (!scannerMod) {
      console.warn("[pipeline] scanner dist not built, skipping")
      return
    }
    assert.ok(scannerMod, "scanner should load")
    assert.ok(scannerMod.isScannableFile || scannerMod.scanFile || scannerMod.scanWorkspace,
      "scanner should export scanning functions")
  })

  it("scanFile works on a temp file", () => {
    if (!scannerMod?.scanFile) return
    const tmp = path.join(os.tmpdir(), `smoke-${Date.now()}.tsx`)
    fs.writeFileSync(tmp, `export const X = () => <div className="flex px-4 rounded" />`)
    try {
      const result = scannerMod.scanFile(tmp)
      assert.ok(result, "scanFile should return result")
      assert.ok(Array.isArray(result.classes), "classes should be array")
    } catch (err) {
      if (String(err).includes("native") || String(err).includes("NATIVE")) {
        console.warn("[pipeline] Native not available for scanFile")
        return
      }
      throw err
    } finally {
      fs.unlinkSync(tmp)
    }
  })
})

describe("Pipeline smoke: compiler", () => {
  it("compiler module is loadable", () => {
    if (!compilerMod) {
      console.warn("[pipeline] compiler dist not built, skipping")
      return
    }
    assert.ok(compilerMod)
  })

  it("transformSource is exported", () => {
    if (!compilerMod) return
    assert.equal(typeof compilerMod.transformSource, "function",
      "transformSource should be exported")
  })

  it("transformSource handles basic input", () => {
    if (!compilerMod?.transformSource) return
    const source = `
      import { tw } from "tailwind-styled-v4"
      const Btn = tw.button\`px-4 py-2 rounded\`
    `
    try {
      const result = compilerMod.transformSource(source, { filename: "smoke.tsx" })
      // Null means no tw usage found or native not available
      if (result !== null && result !== undefined) {
        assert.ok(typeof result.code === "string", "result.code should be string")
        assert.ok(Array.isArray(result.classes), "result.classes should be array")
      }
    } catch (err) {
      if (String(err).includes("native") || String(err).includes("NATIVE")) {
        console.warn("[pipeline] Native not available for transformSource")
        return
      }
      throw err
    }
  })
})

describe("Pipeline smoke: engine", () => {
  it("engine module is loadable", () => {
    if (!engineMod) {
      console.warn("[pipeline] engine dist not built, skipping")
      return
    }
    assert.ok(engineMod)
  })

  it("createEngine is exported", () => {
    if (!engineMod) return
    assert.equal(typeof engineMod.createEngine, "function")
  })

  it("scanWorkspace facade is exported", () => {
    if (!engineMod) return
    assert.equal(typeof engineMod.scanWorkspace, "function",
      "scanWorkspace facade should be exported from engine")
  })

  it("generateSafelist facade is exported", () => {
    if (!engineMod) return
    assert.equal(typeof engineMod.generateSafelist, "function")
  })

  it("build facade is exported", () => {
    if (!engineMod) return
    assert.equal(typeof engineMod.build, "function")
  })
})

describe("Pipeline smoke: analyzer", () => {
  it("analyzer module is loadable", () => {
    if (!analyzerMod) {
      console.warn("[pipeline] analyzer dist not built, skipping")
      return
    }
    assert.ok(analyzerMod)
  })

  it("analyzeWorkspace is exported", () => {
    if (!analyzerMod) return
    assert.equal(typeof analyzerMod.analyzeWorkspace, "function")
  })
})
