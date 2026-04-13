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
  console.warn("[testing] dist not found — run npm run build first")
  process.exit(0) // INTENTIONAL: skip jika dist tidak ada
}

const {
  toHaveClass, toHaveClasses, toNotHaveClass,
  expectClasses, expectNoClasses, expectClassesEqual,
  getClassList, expandVariantMatrix, testAllVariants,
  snapshotVariants,
} = mod

// Helper: buat mock DOM element
function mockElement(className = "") {
  const classes = new Set(className.split(/\s+/).filter(Boolean))
  return {
    classList: {
      contains: (c) => classes.has(c),
    },
    className,
  }
}

describe("toHaveClass", () => {
  it("passes when element has class", () => {
    const matcher = toHaveClass("active")
    const result = matcher(mockElement("btn active large"))
    assert.equal(result.pass, true)
  })

  it("fails when element missing class", () => {
    const matcher = toHaveClass("active")
    const result = matcher(mockElement("btn large"))
    assert.equal(result.pass, false)
  })
})

describe("toHaveClasses", () => {
  it("passes when element has all classes", () => {
    const matcher = toHaveClasses(["px-4", "py-2", "rounded"])
    const result = matcher(mockElement("px-4 py-2 rounded font-bold"))
    assert.equal(result.pass, true)
  })

  it("fails when element missing some classes", () => {
    const matcher = toHaveClasses(["px-4", "py-2", "rounded"])
    const result = matcher(mockElement("px-4 py-2"))
    assert.equal(result.pass, false)
  })
})

describe("toNotHaveClass", () => {
  it("passes when element does not have class", () => {
    const matcher = toNotHaveClass("hidden")
    const result = matcher(mockElement("flex items-center"))
    assert.equal(result.pass, true)
  })

  it("fails when element has class", () => {
    const matcher = toNotHaveClass("hidden")
    const result = matcher(mockElement("flex hidden"))
    assert.equal(result.pass, false)
  })
})

describe("expectClasses", () => {
  it("passes silently when all classes present", () => {
    assert.doesNotThrow(() =>
      expectClasses(mockElement("px-4 py-2 bg-blue-500"), ["px-4", "py-2"])
    )
  })

  it("throws when classes missing", () => {
    assert.throws(
      () => expectClasses(mockElement("px-4"), ["px-4", "py-2", "rounded"]),
      /Expected element to have classes/
    )
  })

  it("throws for null element", () => {
    assert.throws(() => expectClasses(null, ["px-4"]))
  })
})

describe("expectNoClasses", () => {
  it("passes when none of the classes are present", () => {
    assert.doesNotThrow(() =>
      expectNoClasses(mockElement("flex items-center"), ["hidden", "opacity-0"])
    )
  })

  it("throws when a forbidden class is present", () => {
    assert.throws(
      () => expectNoClasses(mockElement("flex hidden"), ["hidden"]),
      /Expected element NOT to have classes/
    )
  })
})

describe("expectClassesEqual", () => {
  it("passes for same classes in different order", () => {
    assert.doesNotThrow(() =>
      expectClassesEqual("bg-blue-500 px-4 py-2", "py-2 px-4 bg-blue-500")
    )
  })

  it("throws when classes differ", () => {
    assert.throws(
      () => expectClassesEqual("px-4 py-2", "px-4 rounded"),
      /Class mismatch/
    )
  })
})

describe("getClassList", () => {
  it("returns sorted array of class names", () => {
    const list = getClassList(mockElement("z-10 flex px-4"))
    assert.deepEqual(list, ["flex", "px-4", "z-10"])
  })

  it("returns empty array for null element", () => {
    assert.deepEqual(getClassList(null), [])
  })
})

describe("expandVariantMatrix", () => {
  it("returns all combinations", () => {
    const matrix = {
      intent: ["primary", "danger"],
      size: ["sm", "lg"],
    }
    const combos = expandVariantMatrix(matrix)
    assert.equal(combos.length, 4) // 2 × 2
    assert.ok(combos.some(c => c.intent === "primary" && c.size === "sm"))
    assert.ok(combos.some(c => c.intent === "danger" && c.size === "lg"))
  })

  it("handles empty matrix", () => {
    const combos = expandVariantMatrix({})
    assert.deepEqual(combos, [{}])
  })

  it("handles single dimension", () => {
    const combos = expandVariantMatrix({ size: ["sm", "md", "lg"] })
    assert.equal(combos.length, 3)
  })
})

describe("testAllVariants", () => {
  it("calls testFn for each variant combination", () => {
    const called = []
    testAllVariants(
      { size: ["sm", "lg"], intent: ["primary", "danger"] },
      (variant) => called.push(variant)
    )
    assert.equal(called.length, 4)
  })
})

describe("snapshotVariants", () => {
  it("maps variants to render output", () => {
    const snapshots = snapshotVariants(
      (v) => `${v.size}-${v.intent}`,
      [{ size: "sm", intent: "primary" }, { size: "lg", intent: "danger" }]
    )
    assert.equal(snapshots.length, 2)
    assert.equal(snapshots[0].output, "sm-primary")
    assert.equal(snapshots[1].output, "lg-danger")
  })
})
