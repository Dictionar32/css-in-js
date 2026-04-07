import fs from "node:fs"
import path from "node:path"
import { spawnSync } from "node:child_process"

const root = process.cwd()
const reportPath = path.join(root, "artifacts", "validation-report.json")
const summaryPath = path.join(root, "artifacts", "health-summary.json")

if (!fs.existsSync(reportPath)) {
  const command = process.platform === "win32" ? "npx.cmd" : "npx"
  const generated = spawnSync(command, ["tsx", "scripts/validate/final-report.ts", "--json"], {
    cwd: root,
    stdio: "inherit",
  })

  if (!fs.existsSync(reportPath)) {
    console.error("validation-report.json not found and auto-generation failed.")
    process.exit(1)
  }
}

const report = JSON.parse(fs.readFileSync(reportPath, "utf8"))
const failed = Number(report.failed ?? report.summary?.failed ?? 0)
const passed = Number(report.passed ?? report.summary?.passed ?? 0)

const health = {
  generatedAt: new Date().toISOString(),
  status: failed === 0 ? "PASS" : "FAIL",
  totals: { passed, failed },
  parserBenchmark: report?.benchmark ?? null,
  recommendation:
    failed === 0
      ? "Release candidate gate passed. Safe to continue."
      : "Fix failing checks before release candidate.",
}

fs.mkdirSync(path.dirname(summaryPath), { recursive: true })
fs.writeFileSync(summaryPath, JSON.stringify(health, null, 2) + "\n")
console.log(`Health summary written: ${path.relative(root, summaryPath)}`)

if (failed > 0) process.exitCode = 1
