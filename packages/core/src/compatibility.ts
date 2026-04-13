/**
 * Tailwind version compatibility detection. QA #2.
 */
import { createRequire } from "node:module"

const _req = createRequire(import.meta.url)

export interface TailwindInfo {
  version: string
  major: number
  minor: number
  patch: number
  supported: boolean
  isV4: boolean
  isV3: boolean
  path: string | null
  warning?: string
}

export function detectTailwind(): TailwindInfo {
  try {
    const pkgPath = _req.resolve("tailwindcss/package.json")
    const pkg = _req(pkgPath) as { version: string }
    const [mj="0", mi="0", pa="0"] = pkg.version.split(".")
    const major = parseInt(mj, 10)
    const minor = parseInt(mi, 10)
    const patch = parseInt(pa.split("-")[0], 10)
    const isV4 = major === 4
    const isV3 = major === 3
    const supported = isV4
    const warning = !supported
      ? isV3
        ? `[tailwind-styled] Tailwind v3 is partially supported — upgrade to v4 for full features.`
        : `[tailwind-styled] Tailwind v${major} not supported. Requires v4.x (found: ${pkg.version})`
      : undefined
    return { version: pkg.version, major, minor, patch, supported, isV4, isV3, path: pkgPath, warning }
  } catch {
    return { version: "not-installed", major: 0, minor: 0, patch: 0, supported: false, isV4: false, isV3: false, path: null,
      warning: "[tailwind-styled] tailwindcss not installed. Run: npm install tailwindcss" }
  }
}

export function assertTailwindCompatibility(opts: { strict?: boolean } = {}): TailwindInfo {
  const info = detectTailwind()
  if (info.warning) {
    if (opts.strict && !info.supported) throw new Error(info.warning)
    console.warn(info.warning)
  }
  return info
}
