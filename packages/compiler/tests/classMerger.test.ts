import assert from "node:assert/strict"
import test from "node:test"

import { mergeClassesStatic, normalizeClasses } from "../src/classMerger"

test("mergeClassesStatic resolves tailwind conflicts", () => {
  const output = mergeClassesStatic("p-2 p-4 bg-red-500 bg-blue-500")
  assert.equal(output, "p-4 bg-blue-500")
})

test("normalizeClasses trims and collapses whitespace", () => {
  const output = normalizeClasses("  p-4   \n  text-sm   bg-blue-500  ")
  assert.equal(output, "p-4 text-sm bg-blue-500")
})
