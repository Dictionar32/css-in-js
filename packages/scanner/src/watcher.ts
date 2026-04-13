/**
 * Scanner watcher — incremental file watching untuk tailwind-styled-v4.
 * QA #12: Scan ulang HANYA file yang berubah, bukan seluruh workspace.
 *
 * Dipakai oleh engine watch mode sebagai alternatif incremental yang lebih ringan.
 */
import fs from "node:fs"
import path from "node:path"
import type { ScanWorkspaceResult, ScanFileResult } from "./types"
import { scanFile } from "./scanFile"
import { isScannableFile, DEFAULT_EXTENSIONS, DEFAULT_IGNORES } from "./index"

export interface WatchOptions {
  rootDir: string
  extensions?: string[]
  ignoreDirs?: string[]
  debounceMs?: number
  onChange?: (changedFiles: string[], result: Partial<ScanWorkspaceResult>) => void
  onError?: (err: Error) => void
}

export interface WatchHandle {
  close(): void
  getLastResult(): Partial<ScanWorkspaceResult>
}

/**
 * Start incremental watcher on a directory.
 * Hanya scan ulang files yang benar-benar berubah — bukan full rescan.
 *
 * @example
 * const handle = watchScanner({
 *   rootDir: "./src",
 *   debounceMs: 150,
 *   onChange(changedFiles, result) {
 *     console.log("Changed:", changedFiles)
 *     console.log("Updated classes:", result.uniqueClasses)
 *   },
 * })
 *
 * // Later:
 * handle.close()
 */
export function watchScanner(opts: WatchOptions): WatchHandle {
  const {
    rootDir,
    extensions = DEFAULT_EXTENSIONS,
    ignoreDirs = DEFAULT_IGNORES,
    debounceMs = 150,
    onChange,
    onError,
  } = opts

  // File cache: filepath → last known classes
  const fileCache = new Map<string, ScanFileResult>()
  // Set of unique classes across all cached files
  const allClasses = new Set<string>()

  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  const pendingChanges = new Set<string>()

  function shouldIgnore(filepath: string): boolean {
    const rel = path.relative(rootDir, filepath)
    return ignoreDirs.some(d => rel.startsWith(d + path.sep) || rel === d)
  }

  function processChanges(): void {
    const changed = Array.from(pendingChanges)
    pendingChanges.clear()

    const scannable = changed.filter(f => isScannableFile(f, extensions) && !shouldIgnore(f))
    if (scannable.length === 0) return

    // Incremental: remove stale classes from changed files
    for (const filepath of scannable) {
      const prev = fileCache.get(filepath)
      if (prev) {
        // Remove old classes — will re-add if still present
        for (const cls of prev.classes) {
          // Only remove if no other file uses it
          let stillUsed = false
          for (const [fp, res] of fileCache) {
            if (fp !== filepath && res.classes.includes(cls)) {
              stillUsed = true
              break
            }
          }
          if (!stillUsed) allClasses.delete(cls)
        }
      }
    }

    // Re-scan changed files
    const updated: ScanFileResult[] = []
    for (const filepath of scannable) {
      try {
        if (!fs.existsSync(filepath)) {
          fileCache.delete(filepath)
          continue
        }
        const result = scanFile(filepath)
        fileCache.set(filepath, result)
        for (const cls of result.classes) allClasses.add(cls)
        updated.push(result)
      } catch (err) {
        onError?.(err instanceof Error ? err : new Error(String(err)))
      }
    }

    if (onChange && updated.length > 0) {
      onChange(scannable, {
        files: Array.from(fileCache.values()),
        totalFiles: fileCache.size,
        uniqueClasses: Array.from(allClasses).sort(),
      })
    }
  }

  function onFsEvent(_event: string, filename: string | null): void {
    if (!filename) return
    const filepath = path.resolve(rootDir, filename)
    pendingChanges.add(filepath)

    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(processChanges, debounceMs)
  }

  let watcher: fs.FSWatcher | null = null
  try {
    watcher = fs.watch(rootDir, { recursive: true }, onFsEvent)
    watcher.on("error", (err) => onError?.(err))
  } catch (err) {
    onError?.(err instanceof Error ? err : new Error(String(err)))
  }

  return {
    close(): void {
      if (debounceTimer) clearTimeout(debounceTimer)
      watcher?.close()
    },
    getLastResult(): Partial<ScanWorkspaceResult> {
      return {
        files: Array.from(fileCache.values()),
        totalFiles: fileCache.size,
        uniqueClasses: Array.from(allClasses).sort(),
      }
    },
  }
}
