import fs from "node:fs"
import path from "node:path"
import { getDirname, resolveLoaderPath as sharedResolveLoaderPath } from "@tailwind-styled/shared"

import { parseNextAdapterOptions } from "./schemas"

interface TailwindStyledLoaderOptions {
  mode?: "zero-runtime"
  autoClientBoundary?: boolean
  addDataAttr?: boolean
  hoist?: boolean
  routeCss?: boolean
  incremental?: boolean
  verbose?: boolean
  preserveImports?: boolean
}

export interface TailwindStyledNextOptions
  extends Pick<
    TailwindStyledLoaderOptions,
    "mode" | "autoClientBoundary" | "addDataAttr" | "hoist" | "routeCss" | "incremental" | "verbose"
  > {
  include?: RegExp
  exclude?: RegExp
}

interface NextWebpackRule {
  test?: RegExp
  exclude?: RegExp
  use?: Array<{ loader: string; options: TailwindStyledLoaderOptions }>
}

interface NextWebpackConfig {
  module?: {
    rules?: NextWebpackRule[]
  }
  [key: string]: unknown
}

interface NextWebpackOptions {
  buildId: string
  dev: boolean
  isServer: boolean
  nextRuntime?: "nodejs" | "edge"
  defaultLoaders: { babel: unknown }
  webpack: unknown
}

interface NextConfigWithTurbopack {
  webpack?: ((config: NextWebpackConfig, options: NextWebpackOptions) => NextWebpackConfig) | null | undefined
  turbopack?: Record<string, unknown>
  [key: string]: unknown
}

const resolveRuntimeDir = (): string => {
  if (typeof __dirname !== "undefined" && __dirname.length > 0) {
    return __dirname
  }
  if (typeof import.meta !== "undefined" && import.meta.url) {
    return getDirname(import.meta.url)
  }
  return process.cwd()
}

const resolveLoaderPath = (basename: string): string => {
  try {
    return sharedResolveLoaderPath(basename, import.meta.url)
  } catch {
    // Fallback: check same dir
    const runtimeDir = resolveRuntimeDir()
    const exts = typeof __dirname !== "undefined" ? [".cjs", ".js"] : [".js", ".cjs"]
    for (const ext of exts) {
      const candidate = path.resolve(runtimeDir, `${basename}${ext}`)
      if (fs.existsSync(candidate)) return candidate
    }
    return path.resolve(runtimeDir, `${basename}.js`)
  }
}

function checkNextVersion(): void {
  try {
    const pkgPath = require.resolve("next/package.json")
    const { version } = require(pkgPath)
    const major = Number.parseInt(version.split(".")[0], 10)
    if (major < 15) {
      console.warn(
        `[tailwind-styled] Next.js ${version} detected. Recommended: 15+ for full Turbopack support.`
      )
    }
  } catch {
    // next not resolvable — skip check
  }
}

const DEFAULT_INCLUDE = /\.[jt]sx?$/
const DEFAULT_EXCLUDE = /node_modules/

const createLoaderOptions = (options: TailwindStyledNextOptions): TailwindStyledLoaderOptions => {
  const opts: TailwindStyledLoaderOptions = {
    mode: options.mode ?? "zero-runtime",
    autoClientBoundary: options.autoClientBoundary ?? true,
    preserveImports: true,
  }
  if (options.addDataAttr !== undefined) opts.addDataAttr = options.addDataAttr
  if (options.hoist !== undefined) opts.hoist = options.hoist
  if (options.routeCss !== undefined) opts.routeCss = options.routeCss
  if (options.incremental !== undefined) opts.incremental = options.incremental
  if (options.verbose !== undefined) opts.verbose = options.verbose
  return opts
}

const buildTurbopackRules = (
  loaderPath: string,
  loaderOptions: TailwindStyledLoaderOptions
): Record<string, unknown> => ({
  "*.js": { loaders: [{ loader: loaderPath, options: loaderOptions }] },
  "*.jsx": { loaders: [{ loader: loaderPath, options: loaderOptions }] },
  "*.ts": { loaders: [{ loader: loaderPath, options: loaderOptions }] },
  "*.tsx": { loaders: [{ loader: loaderPath, options: loaderOptions }] },
})

const applyWebpackRule = (
  config: NextWebpackConfig,
  options: TailwindStyledNextOptions,
  loaderPath: string
): NextWebpackConfig => {
  const loaderOptions = createLoaderOptions(options)
  const rules = config.module?.rules ?? []
  const alreadyRegistered = rules.some((rule) =>
    Array.isArray(rule?.use) && rule.use.some((entry) => entry.loader === loaderPath)
  )

  if (alreadyRegistered) return config

  const tailwindStyledRule: NextWebpackRule = {
    test: options.include ?? DEFAULT_INCLUDE,
    exclude: options.exclude ?? DEFAULT_EXCLUDE,
    use: [{ loader: loaderPath, options: loaderOptions }],
  }

  config.module = {
    ...(config.module ?? {}),
    rules: [tailwindStyledRule, ...rules],
  }

  return config
}

export function withTailwindStyled(options: TailwindStyledNextOptions = {}) {
  checkNextVersion()
  const normalizedOptions = parseNextAdapterOptions(options)
  const webpackLoaderPath = resolveLoaderPath("webpackLoader")
  const turbopackLoaderPath = resolveLoaderPath("turbopackLoader")

  return function wrap(nextConfig: NextConfigWithTurbopack = {}): NextConfigWithTurbopack {
    const previousWebpack = nextConfig.webpack
    const loaderOptions = createLoaderOptions(normalizedOptions)

    return {
      ...nextConfig,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      webpack(config: NextWebpackConfig, webpackOptions: NextWebpackOptions) {
        const apply = (resolvedConfig: NextWebpackConfig) =>
          applyWebpackRule(resolvedConfig, normalizedOptions, webpackLoaderPath)

        if (typeof previousWebpack !== "function") {
          return apply(config)
        }

        const result = previousWebpack(config, webpackOptions)
        return result instanceof Promise ? result.then(apply) : apply(result)
      },
      turbopack: {
        ...(nextConfig.turbopack ?? {}),
        rules: {
          ...(nextConfig.turbopack?.rules ?? {}),
          ...buildTurbopackRules(turbopackLoaderPath, loaderOptions),
        },
      },
    }
  }
}
