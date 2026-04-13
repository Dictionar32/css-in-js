/**
 * Auto-generated native binding type declarations.
 * DO NOT EDIT — regenerate with: cd native && npx @napi-rs/cli build
 *
 * Status: Placeholder — actual types generated after `npm run build:rust`
 */

export interface ParsedClass {
  name: string
  variants: string[]
  isValid: boolean
  specificity: number
}

export interface RscAnalysis {
  isServer: boolean
  needsClientDirective: boolean
  clientReasons: string[]
  /** QA #3: Detailed pattern detection */
  detectedPatterns: string[]
  /** QA #3: Confidence score 0-100 */
  confidence: number
}

export interface TransformResult {
  code: string
  classes: string[]
  changed: boolean
  rscJson?: string
  metadataJson?: string
}

export interface ScanResult {
  files: Array<{ file: string; classes: string[]; hash: string }>
  totalFiles: number
  uniqueClasses: string[]
}

export interface AnalyzerReport {
  root: string
  topClasses: Array<{ name: string; count: number; files: string[] }>
  safelist: string[]
  css: string
  conflicts: string[]
  deadCode: string[]
  durationMs: number
}

export interface CompiledAnimation {
  className: string
  keyframesName: string
  css: string
  animationProperty: string
}

export declare function parseClasses(input: string): ParsedClass[]
export declare function hasTwUsage(source: string): boolean | null
export declare function isAlreadyTransformed(source: string): boolean | null
export declare function analyzeRsc(source: string, filename: string): RscAnalysis
export declare function transformSource(source: string, opts?: Record<string, string>): TransformResult
export declare function analyzeClasses(filesJson: string, root: string, topN: number): AnalyzerReport
export declare function scanWorkspaceNative(root: string, extensions: string[], ignoreDirs: string[]): ScanResult
export declare function compileAnimation(name: string, optsJson: string): CompiledAnimation
export declare function compileCss(classes: string[], configJson?: string): { css: string; resolvedClasses: string[]; unresolvedClasses: string[] }
