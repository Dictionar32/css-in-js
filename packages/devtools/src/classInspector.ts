/**
 * Class Inspector — reusable surface inspection untuk DevTools.
 * Menggunakan inspectClass() dari @tailwind-styled/engine.
 *
 * Dipakai oleh:
 * - DevTools TracePanel → class detail panel
 * - CLI `tw why <class>` → terminal output
 * - Dashboard `/inspect?class=` endpoint
 *
 * Surface ini reusable sesuai requirement dari execution-log.
 */

export interface ClassInspectResult {
  className: string
  css: string
  properties: Array<{ property: string; value: string }>
  conflicts: string[]
  usedIn: string[]
  risk: "low" | "medium" | "high"
  bundleBytes: number
  fetchedAt: number
}

export interface InspectorFetchOptions {
  /** Dashboard base URL (default: http://localhost:7421) */
  baseUrl?: string
  /** Timeout ms (default: 3000) */
  timeoutMs?: number
}

/**
 * Fetch inspection data untuk sebuah class dari dashboard server.
 * Dashboard server pakai inspectClass() dari engine secara internal.
 *
 * @example
 * // Di DevTools panel:
 * const result = await fetchClassInspection("flex")
 * console.log(result.properties) // [{ property: "display", value: "flex" }]
 * console.log(result.usedIn)     // ["src/Button.tsx"]
 */
export async function fetchClassInspection(
  className: string,
  opts: InspectorFetchOptions = {}
): Promise<ClassInspectResult | null> {
  const { baseUrl = "http://localhost:7421", timeoutMs = 3000 } = opts

  const url = `${baseUrl}/inspect?class=${encodeURIComponent(className)}`

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) })
    if (!res.ok) return null
    const data = await res.json()
    return {
      className,
      css: data.css ?? "",
      properties: data.properties ?? [],
      conflicts: data.conflicts ?? [],
      usedIn: data.usedIn ?? [],
      risk: data.risk ?? "low",
      bundleBytes: data.bundleBytes ?? 0,
      fetchedAt: Date.now(),
    }
  } catch {
    return null
  }
}

/** Format inspection result untuk CLI terminal output */
export function formatClassInspectionCli(result: ClassInspectResult): string {
  const lines: string[] = [
    `\n  Class: .${result.className}`,
    `  Risk:  ${result.risk}`,
    ``,
  ]

  if (result.properties.length > 0) {
    lines.push(`  CSS Properties:`)
    for (const p of result.properties) {
      lines.push(`    ${p.property}: ${p.value}`)
    }
    lines.push(``)
  }

  if (result.usedIn.length > 0) {
    lines.push(`  Used in ${result.usedIn.length} file(s):`)
    for (const f of result.usedIn.slice(0, 5)) {
      lines.push(`    ${f}`)
    }
    if (result.usedIn.length > 5) {
      lines.push(`    ... and ${result.usedIn.length - 5} more`)
    }
    lines.push(``)
  } else {
    lines.push(`  ⚠️  Not found in workspace scan (dead code?)`)
    lines.push(``)
  }

  if (result.bundleBytes > 0) {
    lines.push(`  Bundle contribution: ~${result.bundleBytes}B`)
  }

  if (result.conflicts.length > 0) {
    lines.push(`  Conflicts: ${result.conflicts.join(", ")}`)
  }

  return lines.join("\n")
}

/** Format for JSON output (CLI --json flag) */
export function formatClassInspectionJson(result: ClassInspectResult): string {
  return JSON.stringify(result, null, 2)
}
