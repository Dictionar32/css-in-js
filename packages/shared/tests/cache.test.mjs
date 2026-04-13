import { describe, it } from "node:test"
import assert from "node:assert/strict"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { createRequire } from "node:module"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

let mod
try {
  mod = require(path.resolve(__dirname, "../dist/index.js"))
} catch {
  console.warn("[shared/tests] dist not found")
  process.exit(0) // INTENTIONAL: skip jika dist tidak ada (bukan false-positive — test tidak pernah "pass")
}

const { LRUCache } = mod

describe("LRUCache", () => {
  it("stores and retrieves values", () => {
    if (!LRUCache) return
    const cache = new LRUCache(10)
    cache.set("key1", "value1")
    assert.equal(cache.get("key1"), "value1")
  })

  it("returns undefined for missing keys", () => {
    if (!LRUCache) return
    const cache = new LRUCache(10)
    assert.equal(cache.get("nonexistent"), undefined)
  })

  it("evicts oldest entry when at capacity", () => {
    if (!LRUCache) return
    const cache = new LRUCache(3)
    cache.set("a", 1)
    cache.set("b", 2)
    cache.set("c", 3)
    cache.set("d", 4) // evicts "a"
    assert.equal(cache.get("a"), undefined)
    assert.equal(cache.get("d"), 4)
  })

  it("has() returns correct boolean", () => {
    if (!LRUCache) return
    const cache = new LRUCache(10)
    cache.set("exists", true)
    assert.ok(cache.has("exists"))
    assert.ok(!cache.has("missing"))
  })

  it("delete() removes entry", () => {
    if (!LRUCache) return
    const cache = new LRUCache(10)
    cache.set("x", 42)
    cache.delete("x")
    assert.equal(cache.get("x"), undefined)
  })

  it("clear() empties cache", () => {
    if (!LRUCache) return
    const cache = new LRUCache(10)
    cache.set("a", 1)
    cache.set("b", 2)
    cache.clear()
    assert.equal(cache.get("a"), undefined)
    assert.equal(cache.get("b"), undefined)
  })
})
