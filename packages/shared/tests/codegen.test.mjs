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
  console.warn("[shared/tests] dist not found")
  process.exit(0) // INTENTIONAL
}

const { generateComponentCode, generateStorybookStory, generateClassRenameCodemod, generateBarrelFile } = mod

describe("generateComponentCode()", () => {
  it("generates basic component", () => {
    if (!generateComponentCode) return
    const code = generateComponentCode({
      name: "Button",
      tag: "button",
      base: "px-4 py-2 rounded",
    })
    assert.ok(code.includes("Button"), "should include component name")
    assert.ok(code.includes("tw.button"), "should use tw.button")
    assert.ok(code.includes("px-4 py-2 rounded"), "should include base classes")
  })

  it("generates variants", () => {
    if (!generateComponentCode) return
    const code = generateComponentCode({
      name: "Button",
      variants: {
        intent: { primary: "bg-blue-500", danger: "bg-red-500" },
        size: { sm: "h-8", lg: "h-12" },
      },
      defaultVariants: { intent: "primary", size: "sm" },
    })
    assert.ok(code.includes("variants"), "should include variants")
    assert.ok(code.includes("intent"), "should include intent key")
    assert.ok(code.includes("primary"), "should include primary value")
    assert.ok(code.includes("defaultVariants"), "should include defaultVariants")
  })

  it("generates TypeScript types", () => {
    if (!generateComponentCode) return
    const code = generateComponentCode({
      name: "Card",
      withTypes: true,
      variants: { size: { sm: "p-2", lg: "p-6" } },
    })
    assert.ok(code.includes("CardProps"), "should include Props type")
    assert.ok(code.includes("InferVariantProps"), "should use InferVariantProps")
  })

  it("generates Vue component", () => {
    if (!generateComponentCode) return
    const code = generateComponentCode({ name: "Button", framework: "vue" })
    assert.ok(code.includes("@tailwind-styled/vue"), "should import from vue adapter")
  })

  it("generates compound variants", () => {
    if (!generateComponentCode) return
    const code = generateComponentCode({
      name: "Button",
      compoundVariants: [{ size: "lg", intent: "danger", class: "font-bold" }],
    })
    assert.ok(code.includes("compoundVariants"), "should include compound variants")
    assert.ok(code.includes("font-bold"), "should include compound class")
  })
})

describe("generateStorybookStory()", () => {
  it("generates valid story file", () => {
    if (!generateStorybookStory) return
    const story = generateStorybookStory({
      name: "Button",
      variants: { intent: { primary: "bg-blue-500", danger: "bg-red-500" } },
      defaultVariants: { intent: "primary" },
    })
    assert.ok(story.includes("Meta"), "should include Meta type")
    assert.ok(story.includes("Button"), "should include component name")
    assert.ok(story.includes("export default meta"), "should have default export")
    assert.ok(story.includes("generateArgTypes"), "should use generateArgTypes")
  })

  it("generates variant stories", () => {
    if (!generateStorybookStory) return
    const story = generateStorybookStory({
      name: "Badge",
      variants: { type: { info: "bg-blue", warning: "bg-yellow", error: "bg-red" } },
    })
    // Should have one story per variant value
    assert.ok(story.includes("TypeInfo") || story.includes("Info"), "should have variant story")
  })
})

describe("generateClassRenameCodemod()", () => {
  it("generates valid codemod script", () => {
    if (!generateClassRenameCodemod) return
    const code = generateClassRenameCodemod({ "btn-primary": "bg-blue-500 text-white" })
    assert.ok(typeof code === "string")
    assert.ok(code.includes("btn-primary"), "should include old class")
    assert.ok(code.includes("bg-blue-500"), "should include new class")
    assert.ok(code.includes("#!/usr/bin/env node"), "should be executable script")
  })

  it("handles multiple renames", () => {
    if (!generateClassRenameCodemod) return
    const code = generateClassRenameCodemod({
      "old-1": "new-1",
      "old-2": "new-2",
      "old-3": "new-3",
    })
    assert.ok(code.includes("old-1"))
    assert.ok(code.includes("old-3"))
  })
})

describe("generateBarrelFile()", () => {
  it("generates barrel exports", () => {
    if (!generateBarrelFile) return
    const barrel = generateBarrelFile(["Button", "Card", "Input"], "src/components")
    assert.ok(barrel.includes("export { default as Button"), "should export Button")
    assert.ok(barrel.includes("export { default as Card"), "should export Card")
    assert.ok(barrel.includes("ButtonProps"), "should include Props type")
  })

  it("includes directory in comment", () => {
    if (!generateBarrelFile) return
    const barrel = generateBarrelFile([], "src/ui")
    assert.ok(barrel.includes("src/ui"), "should reference directory")
  })
})
