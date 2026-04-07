import test from "node:test"
import assert from "node:assert/strict"
import os from "node:os"
import path from "node:path"

import { TwError } from "./errors"
import { wrapUnknownError } from "./index"
import { loadNativeBindingOrThrow, resolveNativeBindingCandidates } from "./nativeBinding"

test("wrapUnknownError maps unknown domain to compile source", () => {
  const err = wrapUnknownError("custom-domain", "CUSTOM_FAIL", new Error("boom"))
  assert.ok(err instanceof TwError)
  assert.equal(err.source, "compile")
  assert.equal(err.code, "CUSTOM_FAIL")
  assert.equal(err.message, "boom")
})

test("resolveNativeBindingCandidates throws TwError for invalid env extension", () => {
  process.env.TWS_NATIVE_PATH = "/tmp/not-a-node.txt"
  try {
    assert.throws(
      () =>
        resolveNativeBindingCandidates({
          runtimeDir: "/tmp",
          envVarNames: ["TWS_NATIVE_PATH"],
          enforceNodeExtensionForEnvPath: true,
          includeDefaultCandidates: false,
        }),
      (error: unknown) =>
        error instanceof TwError && error.code === "NATIVE_PATH_INVALID_EXTENSION"
    )
  } finally {
    delete process.env.TWS_NATIVE_PATH
  }
})

test("loadNativeBindingOrThrow throws TwError when no binding candidate can be loaded", () => {
  const runtimeDir = path.join(os.tmpdir(), "tw-shared-native-binding-tests")
  assert.throws(
    () =>
      loadNativeBindingOrThrow({
        bindingName: "tailwind_styled_parser",
        runtimeDir,
        candidates: [path.join(runtimeDir, "missing.node")],
        isValid(_module: unknown): _module is { ok: true } {
          return false
        },
        invalidExportMessage: "invalid export",
      }),
    (error: unknown) => error instanceof TwError && error.code === "NATIVE_BINDING_NOT_FOUND"
  )
})
