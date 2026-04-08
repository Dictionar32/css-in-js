const path = require("node:path")
const fs = require("node:fs")

function resolveStudioScript({
  resourcesPath = process.resourcesPath,
  cwd = process.cwd(),
  dirname = __dirname,
  existsSync = fs.existsSync,
} = {}) {
  const candidates = [
    resourcesPath ? path.join(resourcesPath, "scripts/v45/studio.mjs") : null,
    path.join(dirname, "../../scripts/v45/studio.mjs"),
    path.join(cwd, "scripts/v45/studio.mjs"),
  ].filter(Boolean)

  return candidates.find((candidate) => existsSync(candidate)) ?? candidates[1]
}

function resolveInitialProject(argv = process.argv, cwd = process.cwd()) {
  const projectArg = argv.find((value) => value.startsWith("--project="))
  const projectFromArg = projectArg?.slice("--project=".length)
  return projectFromArg && projectFromArg.length > 0 ? projectFromArg : cwd
}

module.exports = {
  resolveInitialProject,
  resolveStudioScript,
}
