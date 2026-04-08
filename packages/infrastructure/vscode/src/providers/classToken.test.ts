import test from "node:test"
import assert from "node:assert/strict"
import {
  findClassAttributesInLine,
  findTokenAtColumn,
  rewriteClassValue,
} from "./classTokenCore"

test("findClassAttributesInLine finds className attribute value range", () => {
  const line = `const x = <div className="px-4 text-sm font-bold" />`
  const matches = findClassAttributesInLine(line)
  assert.equal(matches.length, 1)
  assert.equal(matches[0]?.value, "px-4 text-sm font-bold")
  assert.equal(line.slice(matches[0]!.valueStartCol, matches[0]!.valueEndCol), matches[0]!.value)
})

test("findClassAttributesInLine supports class attribute", () => {
  const line = `<button class='btn-primary  rounded-md'>ok</button>`
  const matches = findClassAttributesInLine(line)
  assert.equal(matches.length, 1)
  assert.equal(matches[0]?.value, "btn-primary  rounded-md")
})

test("findTokenAtColumn resolves the token under cursor", () => {
  const value = "px-4 text-sm font-bold"
  const textSmCol = value.indexOf("text-sm") + 2
  const token = findTokenAtColumn(value, textSmCol)
  assert.deepEqual(token, { token: "text-sm", startCol: 5, endCol: 12 })
})

test("rewriteClassValue can deduplicate and sort classes", () => {
  const value = "text-sm px-4 text-sm font-bold"
  const dedup = rewriteClassValue(value, (tokens) => [...new Set(tokens)])
  assert.equal(dedup, "text-sm px-4 font-bold")

  const sorted = rewriteClassValue(value, (tokens) => [...new Set(tokens)].sort())
  assert.equal(sorted, "font-bold px-4 text-sm")
})
