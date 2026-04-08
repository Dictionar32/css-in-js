import assert from "node:assert/strict"
import test from "node:test"

import { eliminateDeadCss, optimizeCss } from "../src/deadStyleEliminator"

test("eliminateDeadCss removes rules for dead classes", () => {
  const inputCss = [".btn{padding:1rem}", ".card{margin:1rem}", ".btn:hover{opacity:.8}"].join("\n")
  const dead = new Set<string>(["btn"])
  const output = eliminateDeadCss(inputCss, dead)

  assert.equal(output.includes(".btn{"), false)
  assert.equal(output.includes(".btn:hover"), false)
  assert.equal(output.includes(".card{margin:1rem}"), true)
})

test("optimizeCss merges selectors with identical declarations", () => {
  const inputCss = [".a{color:red}", ".b{color:red}", ".c{margin:1rem}"].join("\n")
  const output = optimizeCss(inputCss)

  assert.equal(output.includes(".a,.b { color:red }"), true)
  assert.equal(output.includes(".c { margin:1rem }"), true)
})
