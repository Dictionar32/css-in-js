/**
 * Strict type contracts untuk @tailwind-styled/analyzer.
 * Dari monorepo checklist: "Perketat type contract pada `analyzer`"
 */
import type { ScanWorkspaceResult } from "@tailwind-styled/scanner"

/** Class usage statistics */
export interface ClassUsageStat {
  readonly name: string
  readonly count: number
  readonly files: readonly string[]
  readonly isDeadCode: boolean
}

/** Conflict antara dua atau lebih classes */
export interface ClassConflict {
  readonly classes: readonly string[]
  readonly property: string
  readonly description: string
}

/** Laporan analisis workspace */
export interface AnalyzerReport {
  readonly root: string
  readonly totalFiles: number
  readonly uniqueClassCount: number
  readonly topClasses: readonly ClassUsageStat[]
  readonly frequentClasses: readonly ClassUsageStat[]
  readonly unusedClasses: readonly string[]
  readonly conflicts: readonly ClassConflict[]
  readonly durationMs: number
  readonly generatedAt: number
}

/** Opsi untuk analisis workspace */
export interface AnalyzerOptions {
  readonly scanner?: {
    readonly includeExtensions?: readonly string[]
    readonly ignoreDirectories?: readonly string[]
  }
  readonly classStats?: {
    readonly top?: number
    readonly frequentThreshold?: number
  }
  readonly includeClass?: (className: string) => boolean
  readonly semantic?: {
    readonly tailwindConfigPath?: string
  }
}

/** Hasil analisis satu class */
export interface ClassAnalysisResult {
  readonly className: string
  readonly css: string
  readonly property: string
  readonly value: string
  readonly isValid: boolean
  readonly variants: readonly string[]
}

/** Input untuk classToCss */
export interface ClassToCssOptions {
  readonly tailwindConfigPath?: string
  readonly unknownClassBehavior?: "skip" | "throw"
}
