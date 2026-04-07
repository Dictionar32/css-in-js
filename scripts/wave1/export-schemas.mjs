#!/usr/bin/env node

import fs from "node:fs"
import path from "node:path"
import { spawnSync } from "node:child_process"

const root = process.cwd()
const binaryPath = path.join(root, "native", "target", "debug", "export-schemas")
const schemaDir = path.join(root, "native", "json-schemas")

function run(command, args, label) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  })

  if ((result.status ?? 1) !== 0) {
    const code = result.status ?? 1
    throw new Error(`${label} failed with exit code ${code}`)
  }
}

const hasExistingSchemas = () => {
  if (!fs.existsSync(schemaDir)) return false
  return fs.readdirSync(schemaDir).some((name) => name.endsWith(".json"))
}

try {
  if (fs.existsSync(binaryPath)) {
    run(binaryPath, [], "native export-schemas binary")
    process.exit(0)
  }

  try {
    run("cargo", ["run", "--manifest-path", "native/Cargo.toml", "--bin", "export-schemas"], "cargo export-schemas")
    process.exit(0)
  } catch (error) {
    if (hasExistingSchemas()) {
      console.warn("[wave1:export-schemas] cargo run failed; using existing native/json-schemas snapshot")
      console.warn(error instanceof Error ? error.message : String(error))
      process.exit(0)
    }
    throw error
  }
} catch (error) {
  console.error("[wave1:export-schemas] failed")
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}
