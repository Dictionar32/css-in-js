const test = require("node:test")
const assert = require("node:assert/strict")
const path = require("node:path")

const { resolveInitialProject, resolveStudioScript } = require("./main.paths")

test("resolveInitialProject reads --project argument", () => {
  const project = resolveInitialProject(["electron", "--project=/tmp/demo"], "/fallback")
  assert.equal(project, "/tmp/demo")
})

test("resolveInitialProject falls back to cwd when --project is missing", () => {
  const project = resolveInitialProject(["electron", "--dev"], "/workspace/demo")
  assert.equal(project, "/workspace/demo")
})

test("resolveInitialProject keeps '=' inside project path", () => {
  const project = resolveInitialProject(["electron", "--project=/tmp/foo=bar/demo"], "/workspace/demo")
  assert.equal(project, "/tmp/foo=bar/demo")
})

test("resolveInitialProject falls back to cwd when --project is empty", () => {
  const project = resolveInitialProject(["electron", "--project="], "/workspace/demo")
  assert.equal(project, "/workspace/demo")
})

test("resolveStudioScript prefers bundled resource path", () => {
  const checks = new Set([path.join("/resources", "scripts/v45/studio.mjs")])
  const script = resolveStudioScript({
    resourcesPath: "/resources",
    cwd: "/repo",
    dirname: "/repo/packages/studio-desktop/src",
    existsSync(candidate) {
      return checks.has(candidate)
    },
  })
  assert.equal(script, path.join("/resources", "scripts/v45/studio.mjs"))
})

test("resolveStudioScript falls back to package relative path when no candidate exists", () => {
  const script = resolveStudioScript({
    resourcesPath: null,
    cwd: "/repo",
    dirname: "/repo/packages/studio-desktop/src",
    existsSync() {
      return false
    },
  })
  assert.equal(script, path.join("/repo/scripts/v45/studio.mjs"))
})
