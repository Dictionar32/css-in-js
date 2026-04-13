/**
 * Shared observability contract lintas CLI, dashboard, dan devtools.
 * Dari execution-log: "Stabilkan shared observability contract"
 *
 * Semua surface inspection (CLI why, DevTools trace, dashboard /inspect)
 * menggunakan type contract yang sama di sini.
 */

// ── Class Inspection Surface ─────────────────────────────────────────────────

export interface ClassProperty {
  property: string
  value: string
}

export interface ClassUsageLocation {
  file: string
  line: number
  column: number
  usage: "direct" | "variant" | "component"
}

/** Unified inspection result - dipakai oleh CLI, DevTools, Dashboard */
export interface ClassInspection {
  className: string
  /** CSS properties yang di-set oleh class ini */
  properties: ClassProperty[]
  /** Konflik dengan class lain (property conflicts) */
  conflicts: string[]
  /** Files yang menggunakan class ini */
  usedIn: ClassUsageLocation[]
  /** Risk level untuk removal */
  risk: "low" | "medium" | "high"
  /** Estimated bundle contribution dalam bytes */
  bundleBytes: number
  /** Raw CSS string */
  css: string
  /** Variant chain (hover:, md:, dll) */
  variants: string[]
  /** Timestamp */
  inspectedAt: number
}

// ── Build Trace Surface ───────────────────────────────────────────────────────

export interface BuildPhaseTrace {
  phase: "scan" | "compile" | "engine" | "output"
  durationMs: number
  filesProcessed?: number
  classesFound?: number
}

export interface BuildTrace {
  buildId: string
  totalDurationMs: number
  phases: BuildPhaseTrace[]
  classCount: number
  fileCount: number
  cacheHitRate: number
  mode: string
  timestamp: number
}

// ── Dashboard Metrics Surface ─────────────────────────────────────────────────

export interface DashboardMetrics {
  buildMs: number
  scanMs: number
  analyzeMs: number
  compileMs: number
  classCount: number
  fileCount: number
  mode: string
  cacheHitRate?: number
  nativeVersion?: string
}

export interface DashboardSummary {
  totalBuilds: number
  avgBuildMs: number
  p95BuildMs: number
  avgCacheHitRate: number
  lastBuild: DashboardMetrics | null
}

// ── Observability Client ──────────────────────────────────────────────────────

export interface ObservabilityClient {
  /** Fetch class inspection dari dashboard */
  inspectClass(className: string): Promise<ClassInspection | null>
  /** Fetch current metrics */
  getMetrics(): Promise<DashboardMetrics | null>
  /** Fetch summary */
  getSummary(): Promise<DashboardSummary | null>
  /** Fetch build history */
  getHistory(): Promise<BuildTrace[]>
}

/** Buat observability client yang connect ke dashboard server */
export function createObservabilityClient(
  opts: { baseUrl?: string; timeoutMs?: number } = {}
): ObservabilityClient {
  const { baseUrl = "http://localhost:7421", timeoutMs = 3000 } = opts

  async function fetchJson<T>(path: string): Promise<T | null> {
    try {
      const res = await fetch(`${baseUrl}${path}`, {
        signal: AbortSignal.timeout(timeoutMs),
      })
      if (!res.ok) return null
      return await res.json() as T
    } catch {
      return null
    }
  }

  return {
    async inspectClass(className: string): Promise<ClassInspection | null> {
      const data = await fetchJson<ClassInspection>(`/inspect?class=${encodeURIComponent(className)}`)
      if (!data) return null
      return { ...data, inspectedAt: Date.now() }
    },

    async getMetrics(): Promise<DashboardMetrics | null> {
      return fetchJson<DashboardMetrics>("/metrics")
    },

    async getSummary(): Promise<DashboardSummary | null> {
      return fetchJson<DashboardSummary>("/summary")
    },

    async getHistory(): Promise<BuildTrace[]> {
      const data = await fetchJson<BuildTrace[]>("/history")
      return Array.isArray(data) ? data : []
    },
  }
}
