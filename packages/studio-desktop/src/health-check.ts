/**
 * Studio Desktop Health Check
 * Verifikasi bahwa dependencies dan IPC handlers bisa diload.
 * Dipanggil oleh: CI validation, preload script, dev mode startup.
 */

export interface HealthCheckResult {
  ok: boolean
  checks: Array<{ name: string; ok: boolean; note?: string }>
  version: string
}

export async function runHealthCheck(): Promise<HealthCheckResult> {
  const checks: Array<{ name: string; ok: boolean; note?: string }> = []

  // Check 1: Engine module loadable
  try {
    const engine = await import("@tailwind-styled/engine")
    checks.push({
      name: "engine",
      ok: typeof engine.createEngine === "function",
      note: "createEngine available",
    })
  } catch (err) {
    checks.push({ name: "engine", ok: false, note: String(err).slice(0, 100) })
  }

  // Check 2: Scanner module loadable
  try {
    const scanner = await import("@tailwind-styled/scanner")
    checks.push({
      name: "scanner",
      ok: typeof scanner.scanWorkspace === "function" || typeof scanner.scanFile === "function",
      note: "scan functions available",
    })
  } catch (err) {
    checks.push({ name: "scanner", ok: false, note: String(err).slice(0, 100) })
  }

  // Check 3: Shared module loadable
  try {
    const shared = await import("@tailwind-styled/shared")
    checks.push({
      name: "shared",
      ok: typeof shared.TwError === "function" && typeof shared.LRUCache === "function",
      note: "TwError + LRUCache available",
    })
  } catch (err) {
    checks.push({ name: "shared", ok: false, note: String(err).slice(0, 100) })
  }

  // Check 4: Electron IPC (only in Electron context)
  if (typeof process !== "undefined" && process.versions?.electron) {
    try {
      const { ipcMain } = await import("electron")
      checks.push({
        name: "electron-ipc",
        ok: typeof ipcMain?.on === "function",
        note: "ipcMain available",
      })
    } catch (err) {
      checks.push({ name: "electron-ipc", ok: false, note: String(err).slice(0, 100) })
    }
  } else {
    checks.push({ name: "electron-ipc", ok: true, note: "skipped (not in Electron context)" })
  }

  const ok = checks.every(c => c.ok)
  return {
    ok,
    checks,
    version: process.env.npm_package_version ?? "unknown",
  }
}
