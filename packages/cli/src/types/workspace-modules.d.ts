declare module "@tailwind-styled/analyzer" {
  export interface ClassUsage {
    name: string
    count: number
  }

  export interface AnalyzerReport {
    totalFiles: number
    uniqueClassCount: number
    totalClassOccurrences: number
    safelist: string[]
    classStats: {
      frequent: ClassUsage[]
      top: ClassUsage[]
    }
    semantic?: {
      unusedClasses: Array<{ name: string; count: number }>
      conflicts: Array<{
        className?: string
        reason?: string
        message?: string
        classes?: string[]
        variants?: string[]
      }>
      unknownClasses?: Array<{ name: string; count: number }>
      tailwindConfig?: { path?: string; loaded?: boolean }
    }
  }

  export function analyzeWorkspace(
    root: string,
    options?: {
      classStats?: { top?: number; frequentThreshold?: number }
      semantic?: { enabled?: boolean; maxWarnings?: number }
    }
  ): Promise<AnalyzerReport>
}

declare module "@tailwind-styled/scanner" {
  export interface ScanFileEntry {
    file: string
    classes: string[]
  }

  export interface ScanResult {
    totalFiles: number
    uniqueClasses: string[]
    files: ScanFileEntry[]
  }

  export function scanWorkspace(root: string, options?: Record<string, unknown>): ScanResult
  export function scanWorkspaceAsync(root: string, options?: Record<string, unknown>): Promise<ScanResult>
  export const DEFAULT_EXTENSIONS: string[]
  export const DEFAULT_IGNORES: string[]
  export function isScannableFile(file: string, includeExtensions: readonly string[]): boolean
  export function scanSource(source: string): string[]
}

declare module "@tailwind-styled/compiler/internal" {
  export interface CssCompileResult {
    css: string
    classes: string[]
    ignored: string[]
    sizeBytes?: number
    resolvedClasses?: string[]
    unknownClasses?: string[]
  }

  export function compileCssFromClasses(classes: string[], options?: unknown): CssCompileResult
}

declare module "@tailwind-styled/engine/internal" {
  export type ConditionId = string
  export type ConditionResult = string
  export type Importance = string
  export type LayerId = string
  export type Origin = string
  export type PropertyId = string
  export type RuleId = string
  export type ValueId = string
  export type VariantChainId = string
  export type SourceLocation = { file?: string; line?: number; column?: number }
  export type RuleIR = Record<string, unknown>
  export function createFingerprint(input: unknown): string

  export class ImpactTracker {
    update(classes: string[]): void
    summary(): { changed: number; unchanged: number }
    analyzeBundleClass(className: string): Record<string, unknown>
    calculateImpact(className: string): Record<string, unknown>
  }

  export class ReverseLookup {
    constructor(css?: string)
    find(className: string): Array<{ selector: string; declarations: string[] }>
    findDependents(className: string): string[]
  }
}

declare module "@tailwind-styled/shared" {
  export class TwError extends Error {
    constructor(source: "rust" | "validation" | "compile" | "io", code: string, message: string, cause?: unknown)
    readonly code: string
    readonly source: string
    static fromCompile(code: string, message: string): TwError
  }

  export function wrapUnknownError(domain: string, code: string, error: unknown, context?: unknown): TwError

  export interface TraceSnapshot {
    mode: string
    root: string
  }

  export interface TraceSummary {
    health: string
  }

  export function getHealthColor(value: string): string
  export function getModeColor(value: string): string
  export function formatMemory(bytes: number): string
  export function formatDuration(ms: number): string
  export function calculateHealth(input: unknown): string
  export function getBuildTimeColor(ms: number): string
  export function getMemoryColor(bytes: number): string
  export function createTraceSnapshot(input: unknown): TraceSnapshot
  export function getPipelinePercentages(input: unknown): Record<string, number>
}
