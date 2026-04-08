import test from "node:test"
import assert from "node:assert/strict"
import os from "node:os"
import path from "node:path"

import { TwError } from "./errors"
import { wrapUnknownError } from "./index"
import {
  getPlatformExtension,
  loadNativeBindingOrThrow,
  resolveNativeBindingCandidates,
} from "./nativeBinding"
import { resolveNativeBindingCandidates as resolveNativeBindingCandidatesFromIndex } from "./index"

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

test("resolveNativeBindingCandidates includes 3-level and 4-level monorepo fallbacks", () => {
  const runtimeDir = path.resolve("/repo", "packages", "scanner", "dist")
  const bindingName = `tailwind_styled_parser${getPlatformExtension()}`
  const candidates = resolveNativeBindingCandidates({
    runtimeDir,
    includeDefaultCandidates: true,
  })

  assert.ok(
    candidates.includes(path.resolve(runtimeDir, "..", "..", "..", "native", bindingName))
  )
  assert.ok(
    candidates.includes(path.resolve(runtimeDir, "..", "..", "..", "..", "native", bindingName))
  )
})

test("index resolver prioritizes 4-level fallback for src runtime paths", () => {
  const runtimeDir = path.resolve("/repo", "packages", "scanner", "src")
  const bindingName = "tailwind_styled_parser.node"
  const candidates = resolveNativeBindingCandidatesFromIndex({
    runtimeDir,
    includeDefaultCandidates: true,
  })

  const up4 = path.resolve(runtimeDir, "..", "..", "..", "..", "native", bindingName)
  const up3 = path.resolve(runtimeDir, "..", "..", "..", "native", bindingName)

  assert.ok(candidates.includes(up4))
  assert.ok(candidates.includes(up3))
  assert.ok(candidates.indexOf(up4) < candidates.indexOf(up3))
})
