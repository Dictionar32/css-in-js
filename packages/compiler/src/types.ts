/**
 * Strict type contracts untuk @tailwind-styled/compiler.
 * Dari monorepo checklist: "Perketat type contract pada `compiler`"
 */

/** Source location untuk error reporting */
export interface SourceLocation {
  readonly file: string
  readonly line: number
  readonly column: number
  readonly endLine?: number
  readonly endColumn?: number
}

/** RSC analysis result */
export interface RscAnalysis {
  readonly isServer: boolean
  readonly needsClientDirective: boolean
  readonly clientReasons: readonly string[]
  readonly hasUseClient: boolean
}

/** Transform result dari compiler */
export interface TransformResult {
  readonly code: string
  readonly classes: readonly string[]
  readonly rsc?: RscAnalysis
  readonly changed: boolean
  readonly sourceMap?: string
}

/** Opsi untuk transform */
export interface TransformOptions {
  /** @deprecated v5 only supports zero-runtime */
  readonly mode?: "zero-runtime"
  readonly autoClientBoundary?: boolean
  readonly addDataAttr?: boolean
  readonly hoist?: boolean
  readonly filename?: string
  readonly preserveImports?: boolean
  readonly deadStyleElimination?: boolean
}

/** Compile result dari CSS compiler */
export interface CssCompileResult {
  readonly css: string
  readonly resolvedClasses: readonly string[]
  readonly unresolvedClasses: readonly string[]
  readonly sizeBytes: number
}

/** Error dari transform dengan source location */
export interface TransformError {
  readonly message: string
  readonly file: string
  readonly line: number
  readonly column: number
  readonly code: string
  readonly snippet?: string
}

/** Parsed component config dari AST */
export interface ParsedComponentConfig {
  readonly base: string
  readonly variants: Readonly<Record<string, Readonly<Record<string, string>>>>
  readonly compounds: readonly Array<Readonly<{ class: string } & Record<string, string>>>
  readonly defaults: Readonly<Record<string, string>>
}

/** Core compile result */
export interface CoreCompileResult {
  readonly result: TransformResult
  readonly cacheHit: boolean
  readonly css?: string
  readonly metadata?: {
    readonly duration?: number
    readonly nativeVersion?: string
  }
}
