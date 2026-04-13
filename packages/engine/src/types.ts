/**
 * Strict type contracts untuk @tailwind-styled/engine.
 * Dari monorepo checklist: "Perketat type contract pada `engine`"
 */
import type { ScanWorkspaceResult } from "@tailwind-styled/scanner"

/** Engine build result */
export interface BuildResult {
  readonly css: string
  readonly classes: readonly string[]
  readonly scan: ScanWorkspaceResult
  readonly metadata: BuildMetadata
}

/** Build metadata */
export interface BuildMetadata {
  readonly totalFiles: number
  readonly totalClasses: number
  readonly duration: number
  readonly cacheHit: boolean
  readonly nativeVersion?: string
  readonly mode?: "build" | "watch" | "incremental"
}

/** Watch event dari engine */
export type WatchEventType = "initial" | "change" | "unlink" | "full-rescan" | "error"

export interface WatchEvent {
  readonly type: WatchEventType
  readonly css: string
  readonly classes: readonly string[]
  readonly changedFile?: string
  readonly metadata?: BuildMetadata
  readonly error?: Error
}

/** Engine watch callback */
export type WatchCallback = (event: WatchEvent) => void | Promise<void>

/** Engine watch options */
export interface EngineWatchOptions {
  readonly debounceMs?: number
  readonly maxEventsPerFlush?: number
  readonly largeFileThreshold?: number
  readonly onError?: (err: Error) => void
}

/** Engine watch handle */
export interface WatchHandle {
  close(): Promise<void> | void
}

/** Engine lifecycle plugin */
export interface EnginePlugin {
  readonly name: string
  setup(ctx: EnginePluginContext): void | Promise<void>
}

/** Plugin context (hooks) */
export interface EnginePluginContext {
  onBeforeScan(hook: (ctx: EngineHookContext) => void | Promise<void>): void
  onAfterScan(hook: (scan: ScanWorkspaceResult, ctx: EngineHookContext) => void | Promise<void>): void
  onTransformClasses(hook: (classes: string[], ctx: EngineHookContext) => string[] | Promise<string[]>): void
  onBeforeBuild(hook: (scan: ScanWorkspaceResult, ctx: EngineHookContext) => void | Promise<void>): void
  onAfterBuild(hook: (result: BuildResult, ctx: EngineHookContext) => void | Promise<void>): void
  onError(hook: (err: Error, ctx: EngineHookContext) => void | Promise<void>): void
}

/** Hook context */
export interface EngineHookContext {
  readonly root: string
  readonly mode?: string
  readonly timestamp: number
}
