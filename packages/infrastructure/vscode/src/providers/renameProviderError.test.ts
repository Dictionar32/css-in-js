import test from "node:test"
import assert from "node:assert/strict"
import { RenameProviderError } from "./renameProviderError"

test("RenameProviderError keeps stable code and message", () => {
  const err = new RenameProviderError(
    "RENAME_NOT_IN_CLASS_TOKEN",
    "Rename is only available on class tokens inside class/className attributes."
  )
  assert.ok(err instanceof RenameProviderError)
  assert.equal(err.code, "RENAME_NOT_IN_CLASS_TOKEN")
  assert.equal(err.name, "RenameProviderError")
})
