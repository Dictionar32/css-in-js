/**
 * Strict type contracts untuk @tailwind-styled/scanner.
 * Perketat type: tidak ada implicit any, fallback type yang longgar.
 *
 * Dari monorepo checklist: "Perketat type contract pada `scanner`"
 */

/** Hasil scan satu file */
export interface ScanFileResult {
  /** Absolute path ke file */
  readonly file: string
  /** Daftar Tailwind class yang ditemukan (tanpa duplikat, sorted) */
  readonly classes: readonly string[]
  /** Hash isi file untuk cache invalidation */
  readonly hash?: string
  /** File size dalam bytes */
  readonly sizeBytes?: number
  /** Timestamp terakhir scan (ms epoch) */
  readonly scannedAt?: number
}

/** Opsi untuk scan workspace */
export interface ScanWorkspaceOptions {
  /** Extensions yang di-include (default: DEFAULT_EXTENSIONS) */
  readonly includeExtensions?: readonly string[]
  /** Directories yang di-skip (default: DEFAULT_IGNORES) */
  readonly ignoreDirectories?: readonly string[]
  /** Gunakan in-memory cache (default: true) */
  readonly useCache?: boolean
  /** Cache directory override */
  readonly cacheDir?: string
  /** Hash-based smart invalidation (default: true) */
  readonly smartInvalidation?: boolean
  /** Maximum files sebelum warning (default: 50_000) */
  readonly maxFiles?: number
}

/** Hasil scan seluruh workspace */
export interface ScanWorkspaceResult {
  /** Per-file scan results */
  readonly files: readonly ScanFileResult[]
  /** Total files yang di-scan */
  readonly totalFiles: number
  /** Sorted unique class names across semua files */
  readonly uniqueClasses: readonly string[]
  /** Duration scan dalam ms (jika ada) */
  readonly durationMs?: number
}

/** Native scan binary entry */
export interface NativeScanEntry {
  readonly file: string
  readonly classes: readonly string[]
  readonly hash: string
  readonly mtimeMs: number
  readonly size: number
  readonly hitCount: number
  readonly lastSeenMs?: number
}

/** Watch event dari scanner */
export interface ScanWatchEvent {
  readonly type: "change" | "unlink" | "create"
  readonly file: string
  readonly timestamp: number
}

/** Watch callback */
export type ScanWatchCallback = (
  event: ScanWatchEvent,
  result: Partial<ScanWorkspaceResult>
) => void
