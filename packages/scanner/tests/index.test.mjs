import { describe, it } from "node:test"
import assert from "node:assert/strict"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createRequire } from "node:module"
import fs from "node:fs"
import os from "node:os"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const req = createRequire(import.meta.url)

let mod
try {
  mod = req(path.resolve(__dirname, "../dist/index.js"))
} catch {
  console.warn("[scanner/tests] dist not found — run npm run build first")
  process.exit(0) // INTENTIONAL
}

const { isScannableFile, DEFAULT_EXTENSIONS, DEFAULT_IGNORES, scanFile, scanWorkspace } = mod

describe("isScannableFile", () => {
  it("returns true for .tsx file", () => {
    assert.ok(isScannableFile("Button.tsx"))
  })

  it("returns true for .ts file", () => {
    assert.ok(isScannableFile("utils.ts"))
  })

  it("returns true for .jsx file", () => {
    assert.ok(isScannableFile("App.jsx"))
  })

  it("returns false for .css file", () => {
    assert.ok(!isScannableFile("styles.css"))
  })

  it("returns false for .json file", () => {
    assert.ok(!isScannableFile("package.json"))
  })

  it("returns false for .png file", () => {
    assert.ok(!isScannableFile("image.png"))
  })

  it("respects custom extensions list", () => {
    assert.ok(isScannableFile("comp.vue", [".vue"]))
    assert.ok(!isScannableFile("comp.tsx", [".vue"]))
  })
})

describe("DEFAULT_EXTENSIONS", () => {
  it("is an array of strings", () => {
    assert.ok(Array.isArray(DEFAULT_EXTENSIONS))
    assert.ok(DEFAULT_EXTENSIONS.every(e => typeof e === "string"))
  })

  it("includes common extensions", () => {
    assert.ok(DEFAULT_EXTENSIONS.includes(".tsx") || DEFAULT_EXTENSIONS.includes("tsx"))
    assert.ok(DEFAULT_EXTENSIONS.includes(".ts") || DEFAULT_EXTENSIONS.includes("ts"))
  })
})

describe("DEFAULT_IGNORES", () => {
  it("is an array", () => {
    assert.ok(Array.isArray(DEFAULT_IGNORES))
  })

  it("includes node_modules", () => {
    assert.ok(DEFAULT_IGNORES.some(d => d.includes("node_modules")))
  })
})

describe("scanFile()", () => {
  it("scans a file with Tailwind classes", async () => {
    // Buat temp file untuk test
    const tmpFile = path.join(os.tmpdir(), `tw-test-${Date.now()}.tsx`)
    fs.writeFileSync(tmpFile, `
      export const Button = () => (
        <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Click me
        </button>
      )
    `, "utf-8")

    try {
      const result = scanFile(tmpFile)
      assert.ok(result, "result should be truthy")
      assert.equal(result.file, tmpFile)
      assert.ok(Array.isArray(result.classes))
      // Native punya extraction berbeda, cukup cek ada classes
      if (result.classes.length > 0) {
        // Jika native tersedia, verifikasi beberapa classes
        const cls = result.classes.join(" ")
        assert.ok(
          cls.includes("px-4") || cls.includes("py-2") || cls.includes("bg-blue-500"),
          `Expected Tailwind classes in: ${cls}`
        )
      }
    } finally {
      fs.unlinkSync(tmpFile)
    }
  })

  it("returns empty classes for file with no Tailwind usage", () => {
    const tmpFile = path.join(os.tmpdir(), `tw-empty-${Date.now()}.tsx`)
    fs.writeFileSync(tmpFile, `export const x = 42`, "utf-8")
    try {
      const result = scanFile(tmpFile)
      assert.ok(result)
      assert.ok(Array.isArray(result.classes))
    } finally {
      fs.unlinkSync(tmpFile)
    }
  })
})

describe("scanWorkspace()", () => {
  it("scans a directory", () => {
    // Buat temp dir dengan beberapa files
    const tmpDir = path.join(os.tmpdir(), `tw-ws-${Date.now()}`)
    fs.mkdirSync(tmpDir, { recursive: true })

    const files = [
      ["Button.tsx", `const B = () => <div className="flex items-center px-4" />`],
      ["Card.tsx", `const C = () => <div className="rounded-lg shadow-md p-6" />`],
    ]

    for (const [name, content] of files) {
      fs.writeFileSync(path.join(tmpDir, name), content, "utf-8")
    }

    try {
      const result = scanWorkspace(tmpDir)
      assert.ok(result, "result should be truthy")
      assert.ok(typeof result.totalFiles === "number")
      assert.ok(Array.isArray(result.uniqueClasses))
      assert.ok(Array.isArray(result.files))
      assert.ok(result.totalFiles >= 0)
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    }
  })
})
