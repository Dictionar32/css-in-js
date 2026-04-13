/**
 * Build performance telemetry untuk tailwind-styled-v4.
 * QA #14: Visibility ke build performance — scan speed, cache hit rate, trends.
 *
 * Design: zero-dependency, ring-buffer based, opt-in via TWS_TELEMETRY=1.
 */

export interface BuildPhases {
  scan: number
  compile: number
  engine: number
  output: number
}

export interface BuildTelemetry {
  timestamp: number
  durationMs: number
  filesScanned: number
  filesCached: number
  classesExtracted: number
  nativeVersion?: string
  phases: BuildPhases
  cacheHitRate: number
  mode?: string
}

export interface TelemetrySummary {
  totalBuilds: number
  avgDurationMs: number
  p95DurationMs: number
  avgCacheHitRate: number
  avgFilesScanned: number
  avgClassesExtracted: number
  phaseAvgs: BuildPhases
  slowestBuildMs: number
  fastestBuildMs: number
}

const RING_BUFFER_SIZE = 100

export class TelemetryCollector {
  private data: BuildTelemetry[] = []
  private enabled: boolean

  constructor(enabled?: boolean) {
    this.enabled =
      enabled ??
      (process.env.TWS_TELEMETRY === "1" || process.env.TWS_TELEMETRY === "true")
  }

  record(build: BuildTelemetry): void {
    if (!this.enabled) return
    if (this.data.length >= RING_BUFFER_SIZE) {
      this.data.shift() // ring buffer — hapus entri tertua
    }
    this.data.push(build)
  }

  snapshot(): BuildTelemetry[] {
    return [...this.data]
  }

  summary(): TelemetrySummary | null {
    if (this.data.length === 0) return null

    const durations = this.data.map(d => d.durationMs).sort((a, b) => a - b)
    const p95Idx = Math.floor(durations.length * 0.95)

    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length

    return {
      totalBuilds: this.data.length,
      avgDurationMs: avg(durations),
      p95DurationMs: durations[p95Idx] ?? durations[durations.length - 1] ?? 0,
      avgCacheHitRate: avg(this.data.map(d => d.cacheHitRate)),
      avgFilesScanned: avg(this.data.map(d => d.filesScanned)),
      avgClassesExtracted: avg(this.data.map(d => d.classesExtracted)),
      phaseAvgs: {
        scan: avg(this.data.map(d => d.phases.scan)),
        compile: avg(this.data.map(d => d.phases.compile)),
        engine: avg(this.data.map(d => d.phases.engine)),
        output: avg(this.data.map(d => d.phases.output)),
      },
      slowestBuildMs: durations[durations.length - 1] ?? 0,
      fastestBuildMs: durations[0] ?? 0,
    }
  }

  reset(): void {
    this.data = []
  }

  /** Format ringkas untuk CLI output */
  formatCli(): string {
    const s = this.summary()
    if (!s) return "[telemetry] no data"
    return [
      `[telemetry] ${s.totalBuilds} builds`,
      `avg ${s.avgDurationMs.toFixed(0)}ms`,
      `p95 ${s.p95DurationMs.toFixed(0)}ms`,
      `cache hit ${(s.avgCacheHitRate * 100).toFixed(0)}%`,
      `${s.avgFilesScanned.toFixed(0)} files`,
    ].join(" · ")
  }

  /** Export sebagai JSON untuk dashboard/prometheus */
  toJSON(): object {
    return {
      summary: this.summary(),
      history: this.data.slice(-20), // last 20 builds
    }
  }
}

/** Global singleton telemetry collector */
let _globalCollector: TelemetryCollector | null = null

export function getGlobalTelemetry(): TelemetryCollector {
  if (!_globalCollector) {
    _globalCollector = new TelemetryCollector()
  }
  return _globalCollector
}

export function resetGlobalTelemetry(): void {
  _globalCollector = null
}

/** Helper untuk record build dengan timing otomatis */
export function createBuildTimer() {
  const start = Date.now()
  const phases: Partial<BuildPhases> = {}
  let phaseStart = start

  return {
    phase(name: keyof BuildPhases): void {
      const now = Date.now()
      phases[name] = now - phaseStart
      phaseStart = now
    },
    finish(opts: Omit<BuildTelemetry, "timestamp" | "durationMs" | "phases" | "cacheHitRate"> & {
      cacheHitRate?: number
    }): BuildTelemetry {
      const now = Date.now()
      const record: BuildTelemetry = {
        timestamp: start,
        durationMs: now - start,
        phases: {
          scan: phases.scan ?? 0,
          compile: phases.compile ?? 0,
          engine: phases.engine ?? 0,
          output: phases.output ?? now - start,
        },
        cacheHitRate: opts.cacheHitRate ?? 0,
        ...opts,
      }
      getGlobalTelemetry().record(record)
      return record
    },
  }
}
