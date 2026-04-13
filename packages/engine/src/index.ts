import fs from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"
import {
  type AnalyzerReport,
  type AnalyzerSemanticReport,
  analyzeWorkspace as runWorkspaceAnalysis,
} from "@tailwind-styled/analyzer"
import { generateCssForClasses, mergeClassesStatic } from "@tailwind-styled/compiler/internal"
import {
  type ScanWorkspaceOptions,
  type ScanWorkspaceResult,
  scanWorkspaceAsync,
} from "@tailwind-styled/scanner"
import { createLogger, TwError, wrapUnknownError } from "@tailwind-styled/shared"

import { applyIncrementalChange } from "./incremental"
import { ImpactTracker } from "./impactTracker"
import { EngineMetricsCollector, type EngineMetricsSnapshot } from "./metrics"
import { writeMetrics } from "./metricsWriter"
import {
  type EnginePlugin,
  runAfterBuild,
  runAfterScan,
  runAfterWatch,
  runBeforeBuild,
  runBeforeScan,
  runBeforeWatch,
  runOnError,
  runTransformClasses,
} from "./plugin-api"
import { parseEngineOptions, parseEngineWatchOptions } from "./schemas"
import { type WorkspaceWatcher, watchWorkspace } from "./watch"

const DEFAULT_LARGE_FILE_THRESHOLD_BYTES = 10 * 1024 * 1024
const DEFAULT_FLUSH_DEBOUNCE_MS = 100
const DEFAULT_MAX_EVENTS_PER_FLUSH = 100
const _DEFAULT_WATCH_EVENT_TYPE: EngineBuildWatchEventType = "change"

const configState = {
  cachedTailwindConfig: undefined as Record<string, unknown> | undefined,
  tailwindConfigLoaded: false,
  setLoaded(config: Record<string, unknown> | undefined) {
    this.cachedTailwindConfig = config
    this.tailwindConfigLoaded = true
  },
  getConfig() {
    return this.cachedTailwindConfig
  },
  isLoaded() {
    return this.tailwindConfigLoaded
  },
}
const log = createLogger("engine")

export interface EngineOptions {
  root?: string
  scanner?: ScanWorkspaceOptions
  compileCss?: boolean
  tailwindConfigPath?: string
  plugins?: EnginePlugin[]
  /** Enable analyzer integration - provides semantic report (unused classes, conflicts). Default: false */
  analyze?: boolean
}

export interface EngineWatchOptions {
  debounceMs?: number
  maxEventsPerFlush?: number
  largeFileThreshold?: number
}

export interface BuildResult {
  scan: ScanWorkspaceResult
  mergedClassList: string
  css: string
  /** Analyzer semantic report - present when analyze: true in options */
  analysis?: {
    unusedClasses: string[]
    classConflicts: Array<{
      className: string
      files: string[]
      classes?: string[]
      message?: string
    }>
    classUsage: Record<string, number>
    semantic?: AnalyzerSemanticReport
    report: AnalyzerReport
  }
}

interface BuildExecutionMetrics {
  analyzeMs: number
  compileMs: number
}

interface BuildExecution {
  result: BuildResult
  metrics: BuildExecutionMetrics
}

type EngineBuildWatchEventType = "initial" | "change" | "unlink" | "full-rescan"

export type EngineWatchEvent =
  | {
      type: EngineBuildWatchEventType
      filePath?: string
      result: BuildResult
      metrics?: EngineMetricsSnapshot
    }
  | {
      type: "error"
      filePath?: string
      error: string
      metrics?: EngineMetricsSnapshot
    }

export interface TailwindStyledEngine {
  scan(): Promise<ScanWorkspaceResult>
  scanWorkspace(): Promise<ScanWorkspaceResult>
  analyzeWorkspace(): Promise<Awaited<ReturnType<typeof runWorkspaceAnalysis>>>
  generateSafelist(): Promise<string[]>
  build(): Promise<BuildResult>
  watch(
    onEvent: (event: EngineWatchEvent) => void,
    options?: EngineWatchOptions
  ): Promise<{ close(): void }>
}

async function loadTailwindConfigFromPath(
  root: string,
  tailwindConfigPath?: string
): Promise<Record<string, unknown> | undefined> {
  if (!tailwindConfigPath) return undefined

  const configPath = path.resolve(root, tailwindConfigPath)
  if (!fs.existsSync(configPath)) {
    throw TwError.fromIo("CONFIG_NOT_FOUND", `tailwindConfigPath not found: ${configPath}`)
  }

  const imported = await import(pathToFileURL(configPath).href)
  const config = (imported.default ?? imported) as Record<string, unknown>
  return config
}

async function tryRunAnalyzer(root: string, options: EngineOptions) {
  try {
    const report = await runWorkspaceAnalysis(root, {
      scanner: options.scanner,
      semantic: true,
    })

    const classUsage: Record<string, number> = {}
    for (const usage of report.classStats.all) {
      classUsage[usage.name] = usage.count
    }

    const semantic = report.semantic
    return {
      unusedClasses: semantic?.unusedClasses.map((usage) => usage.name) ?? [],
      classConflicts:
        semantic?.conflicts.map((conflict) => ({
          className: conflict.className,
          files: [],
          classes: conflict.classes,
          message: conflict.message,
        })) ?? [],
      classUsage,
      semantic,
      report,
    }
  } catch (e) {
    log.warn("Analyzer not available:", String(e))
    return undefined
  }
}

async function buildFromScan(
  scan: ScanWorkspaceResult,
  root: string,
  options: EngineOptions,
  tailwindConfig?: Record<string, unknown>
): Promise<BuildExecution> {
  const plugins = options.plugins ?? []
  const context = { root, timestamp: Date.now() }

  await runBeforeBuild(plugins, scan, context)
  const compileStartedAt = Date.now()
  const transformedClasses = await runTransformClasses(plugins, scan.uniqueClasses, context)
  const mergedClassList = mergeClassesStatic(transformedClasses.join(" "))

  const css =
    options.compileCss !== false && mergedClassList.length > 0
      ? await generateCssForClasses(
          mergedClassList.split(/\s+/).filter(Boolean),
          tailwindConfig,
          root
        )
      : ""

  const compileMs = Date.now() - compileStartedAt
  const analyzeStartedAt = Date.now()
  const analysis = options.analyze ? await tryRunAnalyzer(root, options) : undefined
  const analyzeMs = options.analyze ? Date.now() - analyzeStartedAt : 0

  const result: BuildResult = {
    scan,
    mergedClassList,
    css,
    analysis,
  }

  return {
    result: await runAfterBuild(plugins, result, context),
    metrics: {
      analyzeMs,
      compileMs,
    },
  }
}

function countWorkspacePackages(root: string): number {
  const packagesDir = path.join(root, "packages")
  if (!fs.existsSync(packagesDir)) return 0

  try {
    return fs
      .readdirSync(packagesDir, { withFileTypes: true })
      .filter(
        (entry) =>
          entry.isDirectory() && fs.existsSync(path.join(packagesDir, entry.name, "package.json"))
      ).length
  } catch {
    return 0
  }
}

function writeDashboardMetrics(
  root: string,
  mode: "build" | "watch" | "error",
  result: BuildResult | null,
  metrics: Partial<{
    buildMs: number
    scanMs: number
    analyzeMs: number
    compileMs: number
    lastEventType: string
    error: string
  }> &
    Partial<EngineMetricsSnapshot>
): void {
  writeMetrics(
    {
      mode,
      buildMs: metrics.buildMs,
      scanMs: metrics.scanMs,
      analyzeMs: metrics.analyzeMs,
      compileMs: metrics.compileMs,
      classCount: result?.scan.uniqueClasses.length ?? 0,
      fileCount: result?.scan.totalFiles ?? 0,
      cssBytes: result ? Buffer.byteLength(result.css, "utf8") : 0,
      packageCount: countWorkspacePackages(root),
      error: metrics.error,
      lastEventType: metrics.lastEventType,
      eventsReceived: metrics.eventsReceived,
      eventsProcessed: metrics.eventsProcessed,
      batchesProcessed: metrics.batchesProcessed,
      incrementalUpdates: metrics.incrementalUpdates,
      fullRescans: metrics.fullRescans,
      skippedLargeFiles: metrics.skippedLargeFiles,
      queueMaxSize: metrics.queueMaxSize,
      lastBuildMs: metrics.lastBuildMs,
      avgBuildMs: metrics.avgBuildMs,
    },
    root
  )
}

export async function createEngine(rawOptions: EngineOptions = {}): Promise<TailwindStyledEngine> {
  // ── Boundary validation: validate options with Zod before entering domain logic ──
  const options = parseEngineOptions(rawOptions)

  const root = options.root ?? process.cwd()
  const resolvedRoot = path.resolve(root)

  const plugins = (rawOptions as EngineOptions).plugins ?? []

  const getTailwindConfig = async (): Promise<Record<string, unknown> | undefined> => {
    if (configState.isLoaded()) return configState.getConfig()
    const config = await loadTailwindConfigFromPath(resolvedRoot, options.tailwindConfigPath)
    configState.setLoaded(config)
    return config
  }

  const reportEngineError = async (error: unknown): Promise<Error> => {
    const normalized = error instanceof TwError
      ? error
      : wrapUnknownError("compile", "ENGINE_ERROR", error)
    const context = { root: resolvedRoot, timestamp: Date.now() }
    try {
      await runOnError(plugins, normalized, context)
    } catch (pluginError) {
      log.error(
        "plugin onError hook failed:",
        pluginError instanceof Error ? pluginError.message : String(pluginError)
      )
    }
    log.error(normalized.message)
    return normalized
  }

  const doScan = async (): Promise<ScanWorkspaceResult> => {
    try {
      const context = { root: resolvedRoot, timestamp: Date.now() }
      await runBeforeScan(plugins, context)
      const scan = await scanWorkspaceAsync(resolvedRoot, options.scanner)
      return await runAfterScan(plugins, scan, context)
    } catch (error) {
      throw await reportEngineError(error)
    }
  }

  const doAnalyze = async (): Promise<Awaited<ReturnType<typeof runWorkspaceAnalysis>>> => {
    try {
      return await runWorkspaceAnalysis(resolvedRoot, {
        scanner: options.scanner,
      })
    } catch (error) {
      throw await reportEngineError(error)
    }
  }

  const doGenerateSafelist = async (): Promise<string[]> => {
    const scan = await doScan()
    return [...scan.uniqueClasses]
  }

  return {
    scan: doScan,
    scanWorkspace: doScan,
    analyzeWorkspace: doAnalyze,
    generateSafelist: doGenerateSafelist,
    async build(): Promise<BuildResult> {
      const scanStartedAt = Date.now()
      const scan = await doScan()
      const scanMs = Date.now() - scanStartedAt
      try {
        const buildStartedAt = Date.now()
        const execution = await buildFromScan(
          scan,
          resolvedRoot,
          options,
          await getTailwindConfig()
        )
        const buildMs = Date.now() - buildStartedAt
        writeDashboardMetrics(resolvedRoot, "build", execution.result, {
          buildMs,
          scanMs,
          analyzeMs: execution.metrics.analyzeMs,
          compileMs: execution.metrics.compileMs,
        })
        return execution.result
      } catch (error) {
        const normalized = await reportEngineError(error)
        writeDashboardMetrics(resolvedRoot, "error", null, {
          scanMs,
          error: normalized.message,
        })
        throw normalized
      }
    },
    async watch(
      onEvent: (event: EngineWatchEvent) => void,
      rawWatchOptions: EngineWatchOptions = {}
    ): Promise<{ close(): void }> {
      // ── Boundary validation: validate watch options with Zod ──
      const watchOptions = parseEngineWatchOptions(rawWatchOptions)

      const flushDebounceMs = watchOptions.debounceMs ?? DEFAULT_FLUSH_DEBOUNCE_MS
      const maxEventsPerFlush = watchOptions.maxEventsPerFlush ?? DEFAULT_MAX_EVENTS_PER_FLUSH
      const largeFileThreshold =
        watchOptions.largeFileThreshold ?? DEFAULT_LARGE_FILE_THRESHOLD_BYTES

      const tailwindConfig = await getTailwindConfig()
      const watchContext = { root: resolvedRoot, timestamp: Date.now() }
      await runBeforeWatch(plugins, watchContext)

      const initialScanStartedAt = Date.now()
      const initialScan = await doScan()
      const initialScanMs = Date.now() - initialScanStartedAt

      const watchState = {
        currentScan: initialScan,
        timer: null as NodeJS.Timeout | null,
        setTimer(t: NodeJS.Timeout | null) {
          this.timer = t
        },
        clearTimer() {
          if (this.timer) {
            clearTimeout(this.timer)
            this.timer = null
          }
        },
      }

      try {
        const initialBuildStartedAt = Date.now()
        const execution = await buildFromScan(
          watchState.currentScan,
          resolvedRoot,
          options,
          tailwindConfig
        )
        const initialBuildMs = Date.now() - initialBuildStartedAt
        writeDashboardMetrics(resolvedRoot, "watch", execution.result, {
          buildMs: initialBuildMs,
          scanMs: initialScanMs,
          analyzeMs: execution.metrics.analyzeMs,
          compileMs: execution.metrics.compileMs,
          lastEventType: "initial",
        })
        onEvent({
          type: "initial",
          result: execution.result,
        })
      } catch (error) {
        const normalized = await reportEngineError(error)
        writeDashboardMetrics(resolvedRoot, "error", null, {
          scanMs: initialScanMs,
          error: normalized.message,
          lastEventType: "initial",
        })
        onEvent({ type: "error", error: normalized.message })
        throw normalized
      }

      const queue: Array<{ type: "change" | "unlink"; filePath: string }> = []
      const metrics = new EngineMetricsCollector()

      const scheduleFlush = (): void => {
        if (watchState.timer) return
        watchState.setTimer(
          setTimeout(() => {
            watchState.clearTimer()
            void flushBatch()
          }, flushDebounceMs)
        )
      }

      const shouldForceFullRescan = (event: {
        type: "change" | "unlink"
        filePath: string
      }): boolean => {
        if (event.type === "unlink") return false
        try {
          const stat = fs.statSync(event.filePath)
          if (stat.size > largeFileThreshold) {
            metrics.markSkippedLargeFile()
            return true
          }
        } catch {
          return false
        }
        return false
      }

      const flushBatch = async (): Promise<void> => {
        if (queue.length === 0) return

        const batch = queue.splice(0, maxEventsPerFlush)
        metrics.markBatchProcessed(batch.length)

        const forceRescan = batch.some((event) => shouldForceFullRescan(event))
        const lastEvent = batch[batch.length - 1]

        const eventTypeState = { emittedType: lastEvent.type as EngineBuildWatchEventType }
        const scanStartedAt = Date.now()

        try {
          if (forceRescan) {
            watchState.currentScan = await doScan()
            metrics.markFullRescan()
            eventTypeState.emittedType = "full-rescan"
          } else {
            for (const event of batch) {
              watchState.currentScan = applyIncrementalChange(
                watchState.currentScan,
                event.filePath,
                event.type,
                options.scanner
              )
              metrics.markIncremental()
            }
          }
        } catch (error) {
          const normalized = await reportEngineError(error)
          log.warn("incremental path failed, forcing full rescan:", normalized.message)
          watchState.currentScan = await doScan()
          metrics.markFullRescan()
          eventTypeState.emittedType = "full-rescan"
        }

        const scanMs = Date.now() - scanStartedAt

        try {
          const started = Date.now()
          const execution = await buildFromScan(
            watchState.currentScan,
            resolvedRoot,
            options,
            tailwindConfig
          )
          const buildMs = Date.now() - started
          metrics.markBuildDuration(buildMs)
          const snapshot = metrics.snapshot()
          writeDashboardMetrics(resolvedRoot, "watch", execution.result, {
            scanMs,
            buildMs,
            analyzeMs: execution.metrics.analyzeMs,
            compileMs: execution.metrics.compileMs,
            lastEventType: eventTypeState.emittedType,
            ...snapshot,
          })

          onEvent({
            type: eventTypeState.emittedType,
            filePath: lastEvent.filePath,
            result: execution.result,
            metrics: snapshot,
          })
        } catch (error) {
          const normalized = await reportEngineError(error)
          const snapshot = metrics.snapshot()
          writeDashboardMetrics(resolvedRoot, "error", null, {
            scanMs,
            error: normalized.message,
            lastEventType: eventTypeState.emittedType,
            ...snapshot,
          })
          onEvent({
            type: "error",
            filePath: lastEvent.filePath,
            error: normalized.message,
            metrics: snapshot,
          })
        }

        if (queue.length > 0) scheduleFlush()
      }

      const watcher: WorkspaceWatcher = watchWorkspace(
        resolvedRoot,
        (event) => {
          queue.push(event)
          metrics.markEventReceived(queue.length)
          scheduleFlush()
        },
        {
          ignoreDirectories: options.scanner?.ignoreDirectories,
          debounceMs: flushDebounceMs,
          onError: (error, directory) => {
            void reportEngineError(error)
            onEvent({
              type: "error",
              filePath: directory,
              error: error.message,
              metrics: metrics.snapshot(),
            })
          },
        }
      )

      return {
        async close() {
          watchState.clearTimer()
          watcher.close()
          await runAfterWatch(plugins, watchContext)
        },
      }
    },
  }
}

// Re-export internal API (including IR types)
export * from "./internal"
// Re-export schemas
export {
  type BuildResultInput,
  BuildResultSchema,
  type EngineOptionsInput,
  EngineOptionsSchema,
  type EngineWatchOptionsInput,
  EngineWatchOptionsSchema,
  parseEngineOptions,
  parseEngineWatchOptions,
} from "./schemas"

// ─────────────────────────────────────────────────────────────────────────────
// Standalone facade functions — tidak perlu createEngine()
// Berguna untuk CLI, adapter, dan tooling yang tidak butuh watch/lifecycle penuh
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Scan workspace dan return hasil scan.
 * Facade tipis di atas scanWorkspaceAsync dari @tailwind-styled/scanner.
 *
 * @example
 * const result = await scanWorkspace({ root: "./src" })
 * console.log(result.uniqueClasses)
 */
export async function scanWorkspace(
  opts: { root?: string; extensions?: string[]; ignoreDirectories?: string[] } = {}
): Promise<ScanWorkspaceResult> {
  const root = path.resolve(opts.root ?? process.cwd())
  return scanWorkspaceAsync(root, {
    includeExtensions: opts.extensions,
    ignoreDirectories: opts.ignoreDirectories,
  })
}

/**
 * Analyze workspace — scan + analyze classes.
 * Facade di atas runWorkspaceAnalysis.
 *
 * @example
 * const report = await analyzeWorkspace({ root: "./src" })
 * console.log(report.topClasses)
 */
export async function analyzeWorkspace(
  opts: { root?: string; top?: number } = {}
): Promise<Awaited<ReturnType<typeof runWorkspaceAnalysis>>> {
  const root = path.resolve(opts.root ?? process.cwd())
  return runWorkspaceAnalysis(root, {
    classStats: { top: opts.top ?? 20 },
  })
}

/**
 * Generate safelist dari scan result.
 * Berguna untuk Tailwind config safelist generation.
 *
 * @example
 * const safelist = await generateSafelist({ root: "./src" })
 * // Pakai di tailwind.config.ts: { safelist }
 */
export async function generateSafelist(
  opts: { root?: string } = {}
): Promise<string[]> {
  const scan = await scanWorkspace(opts)
  return scan.uniqueClasses
}

/**
 * Build CSS dari scan result.
 * One-shot build tanpa watch mode.
 *
 * @example
 * const result = await build({ root: "./src" })
 * fs.writeFileSync("dist/tailwind.css", result.css)
 */
export async function build(
  opts: EngineOptions = {}
): Promise<{ css: string; classes: string[]; totalFiles: number }> {
  const engine = await createEngine(opts)
  const result = await engine.build()
  await engine.close?.()
  return {
    css: result.css,
    classes: result.classes,
    totalFiles: result.metadata?.totalFiles ?? 0,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared trace/inspection surface — reusable across CLI, devtools, dashboard
// (dari monorepo checklist: "Tambahkan mode trace yang reusable")
// ─────────────────────────────────────────────────────────────────────────────

export type { TraceResult, RuleTrace, ConflictTrace, VariantTrace, FinalStyleProperty } from "./trace"
export { trace, buildProvenanceChain } from "./trace"

/**
 * High-level trace API — satu entry point untuk semua tooling.
 *
 * Dipakai oleh:
 * - CLI: `tw trace <class>`
 * - DevTools: TracePanel fetch
 * - Dashboard: trace endpoint
 *
 * @example
 * const result = await traceClass("flex", scanResult, cssString)
 * console.log(result.finalStyle)  // [{ property: "display", value: "flex" }]
 */
export async function traceClass(
  className: string,
  scanResult: ScanWorkspaceResult,
  css: string
): Promise<import("./trace").TraceResult | null> {
  if (!className || !css) return null

  try {
    const { parseCssToIr } = await import("./cssToIr")
    const { CascadeResolver } = await import("./resolver")
    const { trace } = await import("./trace")

    const { rules, classToRuleIds } = parseCssToIr(css)
    const resolver = new CascadeResolver(rules, classToRuleIds)

    return trace(className, resolver)
  } catch {
    return null
  }
}

/**
 * Trace multiple classes at once — for batch inspection.
 */
export async function traceClasses(
  classNames: string[],
  scanResult: ScanWorkspaceResult,
  css: string
): Promise<Map<string, import("./trace").TraceResult>> {
  const results = new Map<string, import("./trace").TraceResult>()

  for (const cls of classNames) {
    const result = await traceClass(cls, scanResult, css)
    if (result) results.set(cls, result)
  }

  return results
}

// ─────────────────────────────────────────────────────────────────────────────
// Surface Inspection — consistent API untuk CLI, devtools, dashboard
// (dari monorepo checklist: "Tambahkan surface inspection yang konsisten")
// ─────────────────────────────────────────────────────────────────────────────

export interface InspectionReport {
  className: string
  /** CSS rules yang dihasilkan */
  css: string
  /** Properties yang di-set */
  properties: Array<{ property: string; value: string }>
  /** Classes yang berkonflik dengan ini */
  conflicts: string[]
  /** Files yang menggunakan class ini */
  usedIn: string[]
  /** Risk level untuk removal */
  risk: "low" | "medium" | "high"
  /** Estimated bundle contribution */
  bundleBytes: number
}

/**
 * Inspect a single class — gabungan trace + impact + usage.
 * Reusable surface untuk CLI (`tw why`), DevTools panel, dashboard endpoint.
 *
 * @example
 * const report = await inspectClass("flex", scanResult, cssString)
 * console.log(report.properties)  // [{ property: "display", value: "flex" }]
 * console.log(report.usedIn)      // ["src/Button.tsx", "src/Card.tsx"]
 * console.log(report.risk)        // "low"
 */
export async function inspectClass(
  className: string,
  scanResult: ScanWorkspaceResult,
  css = ""
): Promise<InspectionReport> {
  const normalizedClass = className.startsWith(".") ? className.slice(1) : className

  // Usage: files yang menggunakan class ini
  const usedIn = (scanResult.files ?? [])
    .filter(f => f.classes?.includes(normalizedClass))
    .map(f => f.file)

  // Trace: get CSS properties
  const traceResult = await traceClass(normalizedClass, scanResult, css)
  const properties = traceResult?.finalStyle ?? []

  // Impact: risk level
  const tracker = new ImpactTracker()
  const dummyBundle = {
    className: normalizedClass,
    totalUsage: usedIn.length,
    files: usedIn,
    bundleSizeBytes: 0,
    variantChains: [],
    isDeadCode: usedIn.length === 0,
    dependencies: [],
  }
  const impact = tracker.calculateImpact(normalizedClass, dummyBundle, scanResult)

  return {
    className: normalizedClass,
    css,
    properties: properties.map(p => ({ property: p.property, value: p.value })),
    conflicts: [], // populated by trace conflicts if available
    usedIn,
    risk: impact.riskLevel,
    bundleBytes: impact.bundleSizeBytes,
  }
}
