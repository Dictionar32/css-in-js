const test = require("node:test")
const assert = require("node:assert/strict")
const { StudioError } = require("./studioError")

test("StudioError.engineUnavailable wraps Error cause with stable code", () => {
  const cause = new Error("engine boot failed")
  const err = StudioError.engineUnavailable(cause)
  assert.ok(err instanceof StudioError)
  assert.equal(err.code, "ENGINE_UNAVAILABLE")
  assert.equal(err.message, "Engine unavailable: engine boot failed")
  assert.equal(err.cause, cause)
})

test("StudioError.engineUnavailable stringifies non-Error cause", () => {
  const err = StudioError.engineUnavailable({ reason: "unknown" })
  assert.equal(err.code, "ENGINE_UNAVAILABLE")
  assert.equal(err.message, "Engine unavailable: [object Object]")
})
