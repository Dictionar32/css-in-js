import fs from "node:fs"
import path from "node:path"
import { Worker } from "node:worker_threads"
import {
  createLogger,
  getNativeDisableEnvVar,
  loadNativeBinding,
  resolveNativeBindingCandidates,
  resolveRuntimeDir,
} from "@tailwind-styled/shared"
import { filePriority, type NativeCacheEntry, readCache, writeCache } from "./cache-native"
import { hashContentNative, isRustCacheAvailable } from "./native-bridge"
import {
  parseScannerWorkerMessage,
  parseScanWorkspaceOptions,
  parseScanWorkspaceResult,
  type ScanFileResult,
  type ScanWorkspaceOptions,
  type ScanWorkspaceResult,
} from "./schemas"

const log = createLogger("scanner")

const SCAN_WORKER_TIMEOUT_MS = 120_000

type NativeParsedClass = { raw?: string }
type NativeParserBinding = {
  parse_classes?: (input: string) => NativeParsedClass[]
  parseClasses?: (input: string) => NativeParsedClass[]
  extractClassesFromSource?: (source: string) => string[] | null
  batchExtractClassesNative?: (filePaths: string[]) => Array<{
    file: string; classes: string[]; contentHash: string; ok: boolean; error?: string
  }>
}

function getRuntimeDir(): string {
  return resolveRuntimeDir(undefined, import.meta.url)
}

// ─────────────────────────────────────────────────────────────────────────
// Native Parser Binding - Factory Pattern (no let!)
// ─────────────────────────────────────────────────────────────────────────

const createNativeParserLoader = () => {
  const _state = {
    binding: undefined as NativeParserBinding | null | undefined,
    initError: null as string | null,
  }

  const debugNative = (message: string): void => {
    log.debug(`[native] ${message}`)
  }

  const loadNativeParserBinding = (): NativeParserBinding | null => {
    if (_state.binding !== undefined) return _state.binding
    const disabledByEnv = getNativeDisableEnvVar()
    if (disabledByEnv) {
      _state.binding = null
      _state.initError = `native parser disabled by ${disabledByEnv}`
      debugNative(_state.initError)
      return _state.binding
    }

    const runtimeDir = getRuntimeDir()
    const candidates = resolveNativeBindingCandidates({
      runtimeDir,
      includeDefaultCandidates: true,
    })
    const releaseBuildCandidate = path.resolve(
      process.cwd(),
      "native/build/Release/tailwind_styled_parser.node"
    )
    candidates.unshift(releaseBuildCandidate)

    const { binding, loadErrors } = loadNativeBinding<NativeParserBinding>({
      runtimeDir,
      candidates,
      isValid: (required): required is NativeParserBinding =>
        !!required &&
        (typeof required === "object" || typeof required === "function") &&
        (typeof (required as NativeParserBinding).extractClassesFromSource === "function" ||
          typeof (required as NativeParserBinding).parseClasses === "function" ||
          typeof (required as NativeParserBinding).parse_classes === "function"),
      invalidExportMessage:
        "Module loaded but missing expected parser functions (extractClassesFromSource/parseClasses/parse_classes)",
    })

    if (binding) {
      _state.binding = binding
      debugNative("using native parser binding")
      return _state.binding
    }

    _state.binding = null
    _state.initError =
      loadErrors[0]?.message ?? _state.initError ?? "native .node binding not found"
    debugNative(`native binding not available: ${_state.initError}`)
    return _state.binding
  }

  return {
    get: loadNativeParserBinding,
    reset: (): void => {
      _state.binding = undefined
      _state.initError = null
    },
  }
}

const nativeParserLoader = createNativeParserLoader()

function normalizeWithNativeParser(tokens: string[]): string[] {
  const binding = nativeParserLoader.get()
  const parseClasses = binding?.parseClasses ?? binding?.parse_classes
  if (!binding || typeof parseClasses !== "function") {
    throw new Error(
      "Native parser binding is required but not available. Run 'npm run build:rust' to build it."
    )
  }

  try {
    const parsed = parseClasses(tokens.join(" "))
    const normalized = parsed.map((item) => item.raw?.trim() ?? "").filter(Boolean)
    return Array.from(new Set(normalized))
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(`Native parser failed: ${errorMessage}. Run 'npm run build:rust' to rebuild.`)
  }
}

export type { ScanFileResult, ScanWorkspaceOptions, ScanWorkspaceResult } from "./schemas"
export {
  parseScannerWorkerMessage,
  parseScanWorkspaceOptions,
  parseScanWorkspaceResult,
} from "./schemas"

export const DEFAULT_EXTENSIONS = [".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"]
export const DEFAULT_IGNORES = ["node_modules", ".git", ".next", "dist", "out", ".turbo", ".cache"]

function resolveScannerWorkerModulePath(): string | null {
  const runtimeDir = resolveRuntimeDir(
    undefined,
    import.meta.url
  )

  const candidates = [
    path.resolve(runtimeDir, "worker.cjs"),
    path.resolve(runtimeDir, "worker.js"),
    path.resolve(runtimeDir, "worker.ts"),
  ]

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate
  }

  return null
}

function scanWorkspaceInWorker(
  rootDir: string,
  options: ScanWorkspaceOptions
): Promise<ScanWorkspaceResult> {
  const normalizedOptions = parseScanWorkspaceOptions(options)
  const modulePath = resolveScannerWorkerModulePath()
  if (!modulePath) {
    return Promise.reject(new Error("scanner worker module path could not be resolved"))
  }

  return new Promise((resolve, reject) => {
    const settleState = { settled: false }

    const worker = new Worker(modulePath, { workerData: { rootDir, options: normalizedOptions } })

    const timeout = setTimeout(() => {
      if (!settleState.settled) {
        settleState.settled = true
        void worker.terminate()
        reject(new Error(`scanner worker timed out after ${SCAN_WORKER_TIMEOUT_MS}ms`))
      }
    }, SCAN_WORKER_TIMEOUT_MS)

    const finish = (callback: () => void) => {
      if (settleState.settled) return
      settleState.settled = true
      clearTimeout(timeout)
      callback()
    }

    worker.once("message", (payload: unknown) => {
      const message = parseScannerWorkerMessage(payload)
      finish(() => {
        if (message?.ok) {
          resolve(parseScanWorkspaceResult(message.result))
          return
        }
        reject(new Error(message?.error ?? "scanner worker failed without an error message"))
      })
    })

    worker.once("error", (error) => {
      finish(() => reject(error))
    })

    worker.once("exit", (code) => {
      if (code !== 0) {
        finish(() => reject(new Error(`scanner worker exited with code ${code}`)))
      }
    })
  })
}

function buildExtensionSet(includeExtensions: string[]): Set<string> {
  return new Set(includeExtensions)
}

function collectCandidates(
  rootDir: string,
  ignoreDirectories: Set<string>,
  extensionSet: Set<string>
): string[] {
  const candidates: string[] = []
  const directories = [rootDir]

  while (directories.length > 0) {
    const currentDir = directories.pop()
    if (!currentDir) continue

    const entries = (() => {
      try {
        return fs.readdirSync(currentDir, { withFileTypes: true })
      } catch {
        return [] as fs.Dirent[]
      }
    })()

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name)

      if (entry.isDirectory()) {
        if (!ignoreDirectories.has(entry.name)) directories.push(fullPath)
        continue
      }

      if (!entry.isFile()) continue
      if (!extensionSet.has(path.extname(entry.name))) continue
      candidates.push(fullPath)
    }
  }

  return candidates
}

function toCacheSize(size: number): number {
  if (!Number.isFinite(size)) return 0
  const normalized = Math.max(0, Math.trunc(size))
  return Math.min(normalized, 0xffffffff)
}

export function scanSource(source: string): string[] {
  const nativeBinding = nativeParserLoader.get()
  if (nativeBinding?.extractClassesFromSource) {
    const classes = nativeBinding.extractClassesFromSource(source)
    if (Array.isArray(classes)) {
      return Array.from(new Set(classes.filter(Boolean)))
    }
  }

  throw new Error(
    "FATAL: Native parser binding is required but not available.\n" +
    "This package requires native Rust bindings.\n\n" +
    "Resolution steps:\n" +
    "1. Build the native Rust module: npm run build:rust"
  )
}

export function isScannableFile(filePath: string, includeExtensions = DEFAULT_EXTENSIONS): boolean {
  return includeExtensions.includes(path.extname(filePath))
}

export function scanFile(filePath: string): ScanFileResult {
  const source = fs.readFileSync(filePath, "utf8")
  const hash = hashContentNative(source) ?? undefined
  return {
    file: filePath,
    classes: scanSource(source),
    ...(hash ? { hash } : {}),
  }
}

export function scanWorkspace(
  rootDir: string,
  options: ScanWorkspaceOptions = {}
): ScanWorkspaceResult {
  const normalizedOptions = parseScanWorkspaceOptions(options)
  const includeExtensions = normalizedOptions.includeExtensions ?? DEFAULT_EXTENSIONS
  const extensionSet = buildExtensionSet(includeExtensions)
  const ignoreDirectories = new Set(normalizedOptions.ignoreDirectories ?? DEFAULT_IGNORES)
  const useCache = normalizedOptions.useCache ?? true
  const _smartInvalidation = normalizedOptions.smartInvalidation ?? true

  const files: ScanFileResult[] = []
  const unique = new Set<string>()
  const candidates = collectCandidates(rootDir, ignoreDirectories, extensionSet)

  const processResult = (result: ScanFileResult) => {
    files.push(result)
    for (const cls of result.classes) unique.add(cls)
  }

  
  const { scanWorkspaceNative } = require("./native-bridge")

  if (!normalizedOptions.cacheDir && !useCache) {
    const nativeResult = scanWorkspaceNative(rootDir, includeExtensions)
    if (nativeResult) {
      return parseScanWorkspaceResult({
        files: nativeResult.files.map((f: { file: string; classes: string[]; hash?: string }) => ({
          file: f.file,
          classes: f.classes,
          ...(f.hash ? { hash: f.hash } : {}),
        })),
        totalFiles: nativeResult.totalFiles,
        uniqueClasses: nativeResult.uniqueClasses,
      })
    }
  }

  if (useCache && isRustCacheAvailable()) {
    const cacheEntries: NativeCacheEntry[] = (() => {
      try {
        return readCache(rootDir, normalizedOptions.cacheDir)
      } catch (error) {
        log.debug(
          `cache read failed, continuing without persisted cache: ${
            error instanceof Error ? error.message : String(error)
          }`
        )
        return []
      }
    })()

    const cacheMap = new Map(cacheEntries.map((entry) => [entry.file, entry]))
    const nowMs = Date.now()
    const ranked: Array<{
      filePath: string
      stat: fs.Stats
      size: number
      cached?: NativeCacheEntry
      priority: number
    }> = []

    for (const filePath of candidates) {
      const stat = (() => {
        try {
          return fs.statSync(filePath)
        } catch {
          return null
        }
      })()
      if (!stat) continue

      const size = toCacheSize(stat.size)
      const cached = cacheMap.get(filePath)
      const priority = filePriority(
        stat.mtimeMs,
        size,
        cached
          ? {
              mtimeMs: cached.mtimeMs,
              size: cached.size,
              hitCount: cached.hitCount,
              lastSeenMs: 0,
            }
          : undefined,
        nowMs
      )

      ranked.push({ filePath, stat, size, cached, priority })
    }

    ranked.sort((a, b) => b.priority - a.priority)

    const updatedEntries: NativeCacheEntry[] = []

    for (const { filePath, stat, size, cached } of ranked) {
      const content = (() => {
        try {
          return fs.readFileSync(filePath, "utf8")
        } catch {
          return null
        }
      })()
      if (!content) continue

      const hash = hashContentNative(content)
      if (
        cached &&
        cached.hash === hash &&
        cached.mtimeMs === stat.mtimeMs &&
        cached.size === size
      ) {
        log.debug(`cache HIT ${filePath}`)
        processResult({ file: filePath, classes: cached.classes })
        updatedEntries.push({
          file: filePath,
          classes: cached.classes,
          hash: cached.hash,
          mtimeMs: stat.mtimeMs,
          size,
          hitCount: (cached.hitCount ?? 0) + 1,
        })
        continue
      }

      log.debug(`cache MISS ${filePath}`)
      const classes = scanSource(content)
      processResult({ file: filePath, classes })
      updatedEntries.push({
        file: filePath,
        classes,
        hash,
        mtimeMs: stat.mtimeMs,
        size,
        hitCount: 1,
      })
    }

    try {
      writeCache(rootDir, updatedEntries, normalizedOptions.cacheDir)
    } catch (error) {
      log.debug(`cache write failed: ${error instanceof Error ? error.message : String(error)}`)
    }

    return parseScanWorkspaceResult({
      files,
      totalFiles: files.length,
      uniqueClasses: Array.from(unique).sort(),
    })
  }

  // Fast path: gunakan Rust batch extraction jika tersedia (parallel, tanpa GC)
  const batchNative = nativeParserLoader.get()?.batchExtractClassesNative
  if (batchNative) {
    const batchResults = batchNative(candidates)
    for (const r of batchResults ?? []) {
      if (r.ok) processResult({ file: r.file, classes: r.classes })
    }
  } else {
    for (const filePath of candidates) {
      processResult(scanFile(filePath))
    }
  }

  return parseScanWorkspaceResult({
    files,
    totalFiles: files.length,
    uniqueClasses: Array.from(unique).sort(),
  })
}

export async function scanWorkspaceAsync(
  rootDir: string,
  options: ScanWorkspaceOptions = {}
): Promise<ScanWorkspaceResult> {
  const normalizedOptions = parseScanWorkspaceOptions(options)
  if (process.env.TWS_DISABLE_SCANNER_WORKER === "1") {
    return scanWorkspace(rootDir, normalizedOptions)
  }

  try {
    return await scanWorkspaceInWorker(rootDir, normalizedOptions)
  } catch (error) {
    log.debug(
      `worker scan failed, falling back to sync scanner: ${
        error instanceof Error ? error.message : String(error)
      }`
    )
    return scanWorkspace(rootDir, normalizedOptions)
  }
}
