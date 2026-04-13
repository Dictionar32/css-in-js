/**
 * Structured error types untuk tailwind-styled-v4.
 * Diimport juga dari packages/shared/src/index.ts.
 *
 * QA #8: Error System improvements
 */

export type ErrorSource = "rust" | "validation" | "compile" | "io" | "config" | "unknown"

export interface SourceLocation {
  file: string
  line: number
  column: number
}

export interface TransformErrorInfo {
  message: string
  file: string
  line: number
  column: number
  code: string
  snippet?: string
}

/**
 * Unified error class untuk semua domain di tailwind-styled.
 *
 * @example
 * throw new TwError("compile", "TRANSFORM_FAILED", "Could not transform Button.tsx")
 * TwError.fromRust({ code: "SCAN_ERR", message: "scan failed" })
 * TwError.fromZod(zodError)
 */
export class TwError extends Error {
  /** @deprecated Gunakan source */
  public readonly domain: string
  public readonly source: ErrorSource
  public readonly code: string
  public readonly originalCause?: unknown
  /** Source location (untuk compiler/transform errors) */
  public readonly location?: SourceLocation

  constructor(
    domainOrSource: string,
    code: string,
    message: string,
    cause?: unknown,
    location?: SourceLocation
  ) {
    super(message)
    this.name = "TwError"
    this.domain = domainOrSource
    this.source = domainOrSource as ErrorSource
    this.code = code
    this.originalCause = cause
    this.location = location
    if (Error.captureStackTrace) Error.captureStackTrace(this, TwError)
  }

  static fromIo(code: string, message: string): TwError {
    return new TwError("io", code, message)
  }

  static fromCompile(
    code: string,
    message: string,
    location?: SourceLocation
  ): TwError {
    return new TwError("compile", code, message, undefined, location)
  }

  /** QA #8a: Transform error dengan source location */
  static fromTransformError(info: TransformErrorInfo): TwError {
    return new TwError(
      "compile",
      info.code,
      `${info.file}:${info.line}:${info.column} — ${info.message}`,
      undefined,
      { file: info.file, line: info.line, column: info.column }
    )
  }

  static fromRust(err: { code?: string; message?: string } | Error | unknown): TwError {
    if (err instanceof TwError) return err
    if (err instanceof Error) return new TwError("rust", "RUST_ERROR", err.message, err)
    if (err && typeof err === "object") {
      const e = err as { code?: string; message?: string }
      return new TwError("rust", e.code ?? "RUST_ERROR", e.message ?? String(err), err)
    }
    return new TwError("rust", "RUST_ERROR", String(err), err)
  }

  static fromZod(err: { errors?: Array<{ path?: (string | number)[]; message?: string }> }): TwError {
    const first = err.errors?.[0]
    const path = first?.path?.join(".") ?? "(root)"
    const message = first ? `${path}: ${first.message}` : "Schema validation failed"
    return new TwError("validation", "SCHEMA_VALIDATION_FAILED", message, err)
  }

  static wrap(source: string, code: string, err: unknown): TwError {
    if (err instanceof TwError) return err
    if (err instanceof Error) return new TwError(source, code, err.message, err)
    return new TwError(source, code, String(err), err)
  }

  override toString(): string {
    const loc = this.location
      ? ` (${this.location.file}:${this.location.line}:${this.location.column})`
      : ""
    return `TwError [${this.source}:${this.code}]${loc} ${this.message}`
  }

  toJSON(): { name: string; source: string; code: string; message: string; location?: SourceLocation } {
    return {
      name: this.name,
      source: this.source,
      code: this.code,
      message: this.message,
      ...(this.location ? { location: this.location } : {}),
    }
  }

  toCliMessage(): string {
    const loc = this.location
      ? ` at ${this.location.file}:${this.location.line}`
      : ""
    return `[${this.source.toUpperCase()}:${this.code}]${loc} ${this.message}`
  }
}

export function wrapUnknownError(domain: string, code: string, error: unknown): TwError {
  return TwError.wrap(domain, code, error)
}

export function isTwError(err: unknown): err is TwError {
  return err instanceof TwError
}
