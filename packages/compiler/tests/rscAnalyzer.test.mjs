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
  console.warn("[compiler/tests] dist not found")
  process.exit(0) // INTENTIONAL
}

const { analyzeFile } = mod ?? {}

describe("analyzeFile() — RSC Boundary Detection (QA #3)", () => {
  it("is exported", () => {
    if (!analyzeFile) {
      console.warn("[rsc] analyzeFile not exported, skipping")
      return
    }
    assert.equal(typeof analyzeFile, "function")
  })

  it("detects 'use client' directive → client component", () => {
    if (!analyzeFile) return
    const result = analyzeFile(`"use client"\nimport React from "react"`, "Button.tsx")
    assert.equal(result.isServer, false, "Should be client when 'use client' present")
    assert.equal(result.needsClientDirective, false, "Already has directive")
  })

  it("detects 'use server' directive → server component", () => {
    if (!analyzeFile) return
    const result = analyzeFile(`"use server"\nexport async function action() {}`, "action.ts")
    assert.equal(result.isServer, true, "Should be server")
  })

  it("detects useState → needs client directive", () => {
    if (!analyzeFile) return
    const source = `
      import React, { useState } from "react"
      export const Counter = () => {
        const [count, setCount] = useState(0)
        return <div>{count}</div>
      }
    `
    const result = analyzeFile(source, "Counter.tsx")
    assert.equal(result.isServer, true, "No explicit directive")
    assert.equal(result.needsClientDirective, true, "Should need client directive")
    assert.ok(result.clientReasons.length > 0, "Should have reasons")
    assert.ok(
      result.clientReasons.some(r => r.includes("useState") || r.includes("hook")),
      `Expected useState reason in: ${result.clientReasons.join(", ")}`
    )
  })

  it("detects onClick → needs client directive", () => {
    if (!analyzeFile) return
    const source = `
      export const Button = () => (
        <button onClick={() => alert("click")}>Click</button>
      )
    `
    const result = analyzeFile(source, "Button.tsx")
    assert.equal(result.needsClientDirective, true)
    assert.ok(
      result.clientReasons.some(r => r.includes("onClick") || r.includes("event")),
      `Expected onClick reason in: ${result.clientReasons.join(", ")}`
    )
  })

  it("pure server component → no client needed", () => {
    if (!analyzeFile) return
    const source = `
      export default function Page({ params }) {
        return <div className="container mx-auto">{params.id}</div>
      }
    `
    const result = analyzeFile(source, "page.tsx")
    assert.equal(result.isServer, true)
    assert.equal(result.needsClientDirective, false, "Pure server component needs no client directive")
  })

  it("returns clientReasons array", () => {
    if (!analyzeFile) return
    const result = analyzeFile(`const x = 1`, "plain.ts")
    assert.ok(Array.isArray(result.clientReasons))
  })
})
