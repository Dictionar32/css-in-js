/**
 * Vite HMR plugin untuk tailwind-styled-v4.
 * QA #15: Hot reload — class changes reflect tanpa full page reload.
 */
import fs from "node:fs"
import type { Plugin } from "vite"

const TW_USAGE_RE = /\btw(?:\.[a-z]+)?[`(]|cv\s*\(/

function hasTwUsage(content: string): boolean {
  return TW_USAGE_RE.test(content)
}

export interface HmrPluginOptions {
  /** Log HMR updates ke console (default: false) */
  verbose?: boolean
  /** Extensions yang di-watch untuk HMR (default: tsx, jsx, ts, js) */
  extensions?: string[]
}

/**
 * Tailwind Styled HMR plugin untuk Vite.
 * Aktifkan di `vite.config.ts`:
 *
 * ```typescript
 * import { tailwindStyledPlugin, tailwindStyledHmrPlugin } from "@tailwind-styled/vite"
 *
 * export default {
 *   plugins: [
 *     tailwindStyledPlugin(),
 *     tailwindStyledHmrPlugin({ verbose: true }),
 *   ]
 * }
 * ```
 */
export function tailwindStyledHmrPlugin(opts: HmrPluginOptions = {}): Plugin {
  const { verbose = false, extensions = ["tsx", "jsx", "ts", "js"] } = opts

  const extRe = new RegExp(`\\.(${extensions.join("|")})$`)

  return {
    name: "tailwind-styled-hmr",
    apply: "serve",

    handleHotUpdate({ file, server }) {
      if (!extRe.test(file)) return

      let content: string
      try {
        content = fs.readFileSync(file, "utf-8")
      } catch { /* intentionally silent — file may have been deleted */ return }

      if (!hasTwUsage(content)) return

      if (verbose) {
        console.log(`[tailwind-styled-hmr] HMR update: ${file}`)
      }

      // Invalidate module so Vite re-transforms it
      const mod = server.moduleGraph.getModuleById(file)
      if (!mod) return

      server.moduleGraph.invalidateModule(mod)
      server.hot.send({
        type: "update",
        updates: [{
          type: "js-update",
          path: mod.url,
          acceptedPath: mod.url,
          timestamp: Date.now(),
          isWithinCircularImport: false,
          explicitImportRequired: false,
        }],
      })

      // Return empty array to prevent default full-reload
      return []
    },
  }
}
