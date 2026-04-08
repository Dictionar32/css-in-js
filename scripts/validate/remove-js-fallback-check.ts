#!/usr/bin/env tsx

import fs from "node:fs"
import path from "node:path"

const repoRoot = process.cwd()

const checks: Array<{ file: string; forbidden: Array<{ pattern: RegExp; reason: string }> }> = [
  {
    file: "packages/compiler/src/twDetector.ts",
    forbidden: [
      { pattern: /tryGetNativeBridge\s*\(/, reason: "legacy native-optional helper" },
      { pattern: /IMPORT_RE/, reason: "regex fallback marker" },
    ],
  },
  {
    file: "packages/compiler/src/astParser.ts",
    forbidden: [
      { pattern: /parseComponentConfigFallback\s*\(/, reason: "tokenizer fallback parser" },
      { pattern: /\btokenize\s*\(/, reason: "legacy tokenizer fallback" },
    ],
  },
  {
    file: "packages/compiler/src/tailwindEngine.ts",
    forbidden: [
      { pattern: /generateViaTailwindV4\s*\(/, reason: "postcss fallback tier" },
      { pattern: /generateManualCss\s*\(/, reason: "manual css fallback tier" },
      { pattern: /filterCssForClasses\s*\(/, reason: "css filter fallback helper" },
    ],
  },
  {
    file: "packages/compiler/src/coreCompiler.ts",
    forbidden: [
      { pattern: /jsStep\s*\(/, reason: "js compile fallback step" },
      { pattern: /shouldFallbackToJs\s*\(/, reason: "native->js fallback gate" },
    ],
  },
  {
    file: "packages/scanner/src/index.ts",
    forbidden: [
      { pattern: /extractClassesJs\s*\(/, reason: "js class extraction fallback" },
      { pattern: /extractAllClasses/, reason: "syntax fallback extractor" },
    ],
  },
  {
    file: "packages/scanner/src/ast-native.ts",
    forbidden: [{ pattern: /engine:\s*"rust"\s*\|\s*"oxc"/, reason: "non-native engine union" }],
  },
  {
    file: "packages/scanner/src/in-memory-cache.ts",
    forbidden: [{ pattern: /jsCache/, reason: "map-based js cache fallback" }],
  },
  {
    file: "packages/scanner/src/oxc-bridge.ts",
    forbidden: [{ pattern: /astExtractClasses\(/, reason: "oxc->ast fallback chain" }],
  },
  {
    file: "packages/engine/src/incremental.ts",
    forbidden: [{ pattern: /scanFile\s*\(normalizedPath\)\s*\/\/\s*fallback/i, reason: "incremental js fallback path" }],
  },
  {
    file: "packages/engine/src/watch-native.ts",
    forbidden: [
      { pattern: /nodeWatch\s*\(/, reason: "node fs.watch fallback" },
      { pattern: /fs\.watch\s*\(/, reason: "node fs.watch fallback usage" },
    ],
  },
  {
    file: "packages/shared/src/nativeBinding.ts",
    forbidden: [
      { pattern: /TWS_NO_NATIVE/, reason: "native-disable env fallback" },
      { pattern: /TWS_NO_RUST/, reason: "native-disable env fallback" },
      { pattern: /TWS_DISABLE_NATIVE/, reason: "native-disable env fallback" },
    ],
  },
]

let hasFailure = false

for (const check of checks) {
  const filePath = path.join(repoRoot, check.file)
  const content = fs.readFileSync(filePath, "utf8")
  let fileFailed = false

  for (const forbidden of check.forbidden) {
    if (forbidden.pattern.test(content)) {
      hasFailure = true
      fileFailed = true
      console.error(
        `[remove-js-fallback-check] FAIL: ${check.file} matched ${forbidden.pattern} (${forbidden.reason})`
      )
    }
  }

  if (!fileFailed) {
    console.log(
      `[remove-js-fallback-check] OK: ${check.file} (${check.forbidden.length} pattern guards)`
    )
  }
}

if (hasFailure) {
  process.exit(1)
}

console.log("[remove-js-fallback-check] PASS: no forbidden JS fallback patterns detected.")
