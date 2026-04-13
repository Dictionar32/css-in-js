/**
 * ESM-safe runtime helpers untuk monorepo.
 *
 * Menggantikan pola fragile seperti:
 *   - `createRequire(import.meta.url)` → gunakan `createEsmRequire()`
 *   - `__dirname` → gunakan `getDirname(import.meta.url)`
 *   - `__filename` → gunakan `getFilename(import.meta.url)`
 *
 * Semua helper ini bekerja di ESM dan CJS.
 *
 * @module @tailwind-styled/shared/esmHelpers
 */
import { createRequire } from "node:module"
import path from "node:path"
import { fileURLToPath } from "node:url"

/**
 * Buat `require()` function yang relative terhadap sebuah ESM module.
 *
 * @example
 * // Ganti: createRequire(import.meta.url)("some-pkg")
 * const req = createEsmRequire(import.meta.url)
 * const mod = req("some-pkg")
 */
export function createEsmRequire(importMetaUrl: string): NodeRequire {
  return createRequire(importMetaUrl)
}

/**
 * Dapat `__dirname` dari `import.meta.url`.
 *
 * @example
 * // Ganti: const __dirname = ...
 * const dir = getDirname(import.meta.url)
 */
export function getDirname(importMetaUrl: string): string {
  return path.dirname(fileURLToPath(importMetaUrl))
}

/**
 * Dapat `__filename` dari `import.meta.url`.
 */
export function getFilename(importMetaUrl: string): string {
  return fileURLToPath(importMetaUrl)
}

/**
 * Resolve path dari root monorepo (bukan CWD).
 * Berguna untuk scripts dan tools yang dipanggil dari lokasi berbeda.
 *
 * @example
 * const root = resolveFromRoot("packages/shared/src")
 */
export function resolveFromRoot(...segments: string[]): string {
  // Cari monorepo root dengan cara mencari package.json dengan workspaces
  let dir = getDirname(import.meta.url)
  for (let i = 0; i < 10; i++) {
    const pkgPath = path.join(dir, "package.json")
    try {
      const pkg = JSON.parse(require("node:fs").readFileSync(pkgPath, "utf-8"))
      if (pkg.workspaces) {
        return path.resolve(dir, ...segments)
      }
    } catch { /* intentionally silent */ }
    dir = path.dirname(dir)
  }
  return path.resolve(process.cwd(), ...segments)
}

/**
 * Require sebuah module dengan fallback ke null jika tidak tersedia.
 * Berguna untuk optional dependencies.
 *
 * @example
 * const oxc = tryRequire("oxc-parser", import.meta.url)
 * if (!oxc) console.warn("oxc-parser not installed")
 */
export function tryRequire<T = unknown>(
  moduleName: string,
  importMetaUrl: string
): T | null {
  try {
    return createEsmRequire(importMetaUrl)(moduleName) as T
  } catch { /* intentionally silent — optional dep */ }
  return null
}

/**
 * Resolve .node binary path yang cross-platform dan ESM-safe.
 * Menggantikan pola `path.resolve(__dirname, "../native.node")`.
 */
export function resolveNativeNodePath(
  importMetaUrl: string,
  ...relativeSegments: string[]
): string {
  return path.resolve(getDirname(importMetaUrl), ...relativeSegments)
}
