import type {
  ComponentConfig,
  CvFn,
  TwComponentFactory,
  TwStyledComponent,
} from "@tailwind-styled/core"

import type { TailwindStyledEngine } from "@tailwind-styled/engine"

import type { TransformOptions, TransformResult } from "@tailwind-styled/compiler"

import type {
  ScanWorkspaceOptions,
  ScanWorkspaceResult,
} from "@tailwind-styled/scanner"

import type {
  LiveTokenSet,
  TokenMap,
  TokenSubscriber,
} from "@tailwind-styled/runtime"

import type {
  StyledComponent,
  SubComponentDef,
  SubComponentMap,
  ConditionalProps,
} from "@tailwind-styled/runtime"

declare module "tailwind-styled-v4" {
  export const tw: (strings: TemplateStringsArray, ...exprs: unknown[]) => TwStyledComponent
  export const cv: CvFn<ComponentConfig>
  export const cx: (...inputs: (string | number | false | null | undefined | (string | number | false | null | undefined)[])[]) => string
  export const cn: (cls1: string, cls2?: string) => string
  export const server: {
    tw: (strings: TemplateStringsArray, ...exprs: unknown[]) => TwStyledComponent
    cv: CvFn<ComponentConfig>
  }
}

declare module "tailwind-styled-v4/next" {
  import type { NextConfig } from "next"

  export interface TailwindStyledNextOptions {
    mode?: "zero-runtime"
    autoClientBoundary?: boolean
    addDataAttr?: boolean
    hoist?: boolean
    routeCss?: boolean
    incremental?: boolean
    verbose?: boolean
    include?: RegExp
    exclude?: RegExp
  }

  export function withTailwindStyled(options?: TailwindStyledNextOptions): (nextConfig?: NextConfig) => NextConfig
}

declare module "tailwind-styled-v4/runtime-css" {
  export interface TwCssInjectorOptions {
    id?: string
    useBatching?: boolean
  }

  export class TwCssInjector {
    constructor(options?: TwCssInjectorOptions)
    inject(css: string): void
    flush(): void
  }

  export function useTwClasses(classes: string[]): void
}

declare module "tailwind-styled-v4/compiler" {
  const compiler: {
    transformSource: (source: string, options?: TransformOptions) => Promise<TransformResult>
    transformSourceSync: (source: string, options?: TransformOptions) => TransformResult
  }
  export = compiler
}

declare module "tailwind-styled-v4/scanner" {
  const scanner: {
    scanWorkspace: (rootDir: string, options?: ScanWorkspaceOptions) => Promise<ScanWorkspaceResult>
    scanWorkspaceSync: (rootDir: string, options?: ScanWorkspaceOptions) => ScanWorkspaceResult
    scanFile: (filePath: string) => { file: string; classes: string[]; hash?: string }
    scanSource: (source: string) => string[]
  }
  export = scanner
}

declare module "tailwind-styled-v4/engine" {
  const engine: {
    createEngine: (options?: import("@tailwind-styled/engine").EngineOptions) => Promise<TailwindStyledEngine>
  }
  export = engine
}

declare module "tailwind-styled-v4/analyzer" {
  export interface AnalyzerReport {
    classes: Array<{ name: string; count: number }>
    files: string[]
    stats: {
      total: number
      used: number
      unused: number
    }
  }

  export interface AnalyzerSemanticReport {
    unusedClasses: Array<{ name: string; files: string[] }>
    conflicts: Array<{ className: string; classes: string[]; message: string }>
  }
}

declare module "tailwind-styled-v4/runtime" {
  export { createComponent, cx } from "@tailwind-styled/runtime"
  export type { StyledComponent, SubComponentDef, SubComponentMap, ConditionalProps }
}

declare module "tailwind-styled-v4/vite" {
  import type { Plugin } from "vite"

  export interface TailwindStyledViteOptions {
    mode?: "zero-runtime"
    autoClientBoundary?: boolean
    addDataAttr?: boolean
    hoist?: boolean
    routeCss?: boolean
    incremental?: boolean
    verbose?: boolean
  }

  export function tailwindStyledVite(options?: TailwindStyledViteOptions): Plugin
}

declare module "tailwind-styled-v4/rspack" {
  export interface TailwindStyledRspackOptions {
    mode?: "zero-runtime"
    autoClientBoundary?: boolean
    addDataAttr?: boolean
    hoist?: boolean
    routeCss?: boolean
    incremental?: boolean
    verbose?: boolean
  }

  export function tailwindStyledRspack(options?: TailwindStyledRspackOptions): import("@rspack/core").RspackPluginInstance
}

declare module "tailwind-styled-v4/vue" {
  import type { Plugin } from "vue"

  export interface TailwindStyledVueOptions {
    mode?: "zero-runtime"
  }

  export function tailwindStyledVue(options?: TailwindStyledVueOptions): Plugin
}

declare module "tailwind-styled-v4/svelte" {
  export interface TailwindStyledSvelteOptions {
    mode?: "zero-runtime"
  }

  export function tailwindStyledSvelte(options?: TailwindStyledSvelteOptions): { name: string }
}

declare module "tailwind-styled-v4/devtools" {
  import type { TailwindStyledEngine } from "@tailwind-styled/engine"

  export interface TwDevToolsOptions {
    engine: TailwindStyledEngine
    position?: "bottom" | "right" | "left"
    theme?: "light" | "dark"
  }

  export function TwDevTools(options: TwDevToolsOptions): {
    mount(container: HTMLElement): void
    unmount(): void
  }
}
