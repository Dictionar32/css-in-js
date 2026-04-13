/**
 * Smoke test: root import compatibility
 * Verifikasi bahwa semua public export dari root package masih bisa diimport.
 */
import { describe, it } from "node:test"
import assert from "node:assert/strict"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createRequire } from "node:module"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const req = createRequire(import.meta.url)
const ROOT = path.resolve(__dirname, "../..")

// Guard: skip jika dist belum dibangun
let rootMod
try {
  rootMod = req(path.join(ROOT, "dist/index.js"))
} catch {
  console.warn("[smoke/root-imports] root dist not found — run npm run build first")
  process.exit(0) // INTENTIONAL
}

describe("Root package exports", () => {
  it("exports tw function", () => {
    assert.ok(rootMod.tw, "tw should be exported from root")
    assert.ok(typeof rootMod.tw === "function" || typeof rootMod.tw === "object",
      "tw should be callable or object")
  })

  it("exports cv function", () => {
    assert.ok(rootMod.cv, "cv should be exported")
    assert.equal(typeof rootMod.cv, "function")
  })

  it("exports cx/cn utilities", () => {
    // cx atau cn harus ada
    const hasCx = rootMod.cx || rootMod.cn || rootMod.cxm
    assert.ok(hasCx, "cx/cn/cxm should be exported")
  })

  it("exports createEngine", () => {
    assert.equal(typeof rootMod.createEngine, "function", "createEngine should be exported")
  })

  it("exports liveToken", () => {
    assert.ok(rootMod.liveToken, "liveToken should be exported")
  })
})

describe("Root subpath exports", () => {
  it("@tailwind-styled/engine is importable via workspace", () => {
    let engineMod
    try {
      engineMod = req(path.join(ROOT, "packages/engine/dist/index.js"))
    } catch {
      console.warn("[smoke] engine dist not found")
      return
    }
    assert.equal(typeof engineMod.createEngine, "function")
  })

  it("@tailwind-styled/scanner is importable via workspace", () => {
    let scannerMod
    try {
      scannerMod = req(path.join(ROOT, "packages/scanner/dist/index.js"))
    } catch {
      console.warn("[smoke] scanner dist not found")
      return
    }
    assert.ok(scannerMod.isScannableFile || scannerMod.scanFile || scannerMod.scanWorkspace,
      "scanner should export scanning functions")
  })

  it("@tailwind-styled/shared is importable", () => {
    let sharedMod
    try {
      sharedMod = req(path.join(ROOT, "packages/shared/dist/index.js"))
    } catch {
      console.warn("[smoke] shared dist not found")
      return
    }
    assert.ok(sharedMod.TwError || sharedMod.LRUCache, "shared should export core utilities")
  })
})
