declare module "@tailwind-styled/plugin-api" {
  export type TokenMap = Record<string, string>

  export interface TwPluginOptions {
    classProcessor?: (classes: string[]) => { css: string; classes: string[] }
    tokens?: Record<string, string | number | Record<string, unknown>>
    debug?: boolean
    minify?: boolean
  }

  export interface TwContext {
    addVariant(name: string, resolver: (selector: string) => string): void
    addUtility(name: string, styles: Record<string, string>): void
    addToken(name: string, value: string): void
    addTransform(fn: (config: unknown, meta: unknown) => unknown): void
    onGenerateCSS(hook: (css: string) => string): void
    onBuildEnd(hook: () => void | Promise<void>): void
    getToken(name: string): string | undefined
    subscribeTokens(callback: (tokens: TokenMap) => void): () => void
    readonly config: Record<string, unknown>
  }

  export interface TwPlugin {
    name: string
    setup(ctx: TwContext): void
  }

  export interface PluginRegistry {
    variants: Map<string, (selector: string) => string>
    utilities: Map<string, Record<string, string>>
    tokens: Map<string, string>
    transforms: Array<(config: unknown, meta: unknown) => unknown>
    cssHooks: Array<(css: string) => string>
    buildHooks: Array<() => void | Promise<void>>
    plugins: Set<string>
  }

  export interface TokenEngineAPI {
    getToken?: (name: string) => string | undefined
    getTokens?: () => Record<string, string> | undefined
    subscribeTokens?: (callback: (tokens: Record<string, string>) => void) => () => void
    subscribe?: (callback: (tokens: Record<string, string>) => void) => () => void
  }

  export function parseTwPluginOptions(options: TwPluginOptions): TwPluginOptions
  export function resolveTokenEngine(): TokenEngineAPI | undefined
  export function readToken(engine: TokenEngineAPI | undefined, name: string): string | undefined
  export function presetVariants(): TwPlugin
  export function presetTokens(tokens: Record<string, string>): TwPlugin
  export function presetScrollbar(): TwPlugin
  export function createTw(config?: Record<string, unknown>): TwContext & {
    registry: PluginRegistry
    use: (plugin: TwPlugin) => void
  }
  export function use(plugin: TwPlugin): void
}
