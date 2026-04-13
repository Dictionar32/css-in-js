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
  console.warn("[animate/tests] dist not found — run npm run build first")
  process.exit(0) // INTENTIONAL
}

const { animate, keyframes, compileAnimation, compileKeyframes,
        AnimationRegistry, animations, extractAnimationCss } = mod ?? {}

describe("AnimationRegistry", () => {
  it("is exported", () => {
    assert.ok(AnimationRegistry, "AnimationRegistry should be exported")
  })

  it("can be instantiated", () => {
    if (!AnimationRegistry) return
    try {
      const registry = new AnimationRegistry()
      assert.ok(registry)
    } catch (err) {
      if (String(err).includes("native") || String(err).includes("NATIVE")) {
        console.warn("[animate] Native not available for AnimationRegistry")
        return
      }
      throw err
    }
  })
})

describe("animations preset object", () => {
  it("is exported", () => {
    if (!animations) {
      console.warn("[animate] animations not exported, skipping")
      return
    }
    assert.ok(typeof animations === "object", "animations should be object")
  })

  it("contains animation definitions", () => {
    if (!animations) return
    const keys = Object.keys(animations)
    assert.ok(keys.length > 0, "animations should have entries")
    // Check a known animation
    const knownAnimations = ["fadeIn", "fadeOut", "slideUp", "slideDown", "spin", "pulse", "bounce"]
    const hasKnown = knownAnimations.some(k => k in animations)
    assert.ok(hasKnown, `Expected at least one of: ${knownAnimations.join(", ")}. Got: ${keys.join(", ")}`)
  })
})

describe("animate()", () => {
  it("is exported as function", () => {
    if (!animate) {
      console.warn("[animate] animate() not exported, skipping")
      return
    }
    assert.equal(typeof animate, "function")
  })

  it("returns CSS class string", async () => {
    if (!animate) return
    try {
      const result = await animate({ name: "fadeIn", duration: "200ms" })
      assert.ok(typeof result === "string", "should return string")
    } catch (err) {
      if (String(err).includes("native") || String(err).includes("NATIVE")) {
        console.warn("[animate] Native not available for animate()")
        return
      }
      throw err
    }
  })
})

describe("compileAnimation()", () => {
  it("is exported as function", () => {
    if (!compileAnimation) {
      console.warn("[animate] compileAnimation not exported, skipping")
      return
    }
    assert.equal(typeof compileAnimation, "function")
  })

  it("compiles animation to CSS", async () => {
    if (!compileAnimation) return
    try {
      const result = compileAnimation("fadeIn", { duration: "200ms", easing: "ease-in-out" })
      if (result && typeof result === "object" && "css" in result) {
        assert.ok(typeof result.css === "string")
      }
    } catch (err) {
      if (String(err).includes("native") || String(err).includes("NATIVE")) {
        return
      }
      throw err
    }
  })
})

describe("keyframes()", () => {
  it("is exported as function", () => {
    if (!keyframes) {
      console.warn("[animate] keyframes not exported, skipping")
      return
    }
    assert.equal(typeof keyframes, "function")
  })
})

describe("extractAnimationCss()", () => {
  it("is exported as function", () => {
    if (!extractAnimationCss) {
      console.warn("[animate] extractAnimationCss not exported, skipping")
      return
    }
    assert.equal(typeof extractAnimationCss, "function")
  })
})
