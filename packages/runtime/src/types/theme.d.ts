declare module "@tailwind-styled/theme" {
  export type TokenMap = Record<string, string>
  export type TokenSubscriber = (tokens: TokenMap) => void

  export interface LiveTokenSet {
    vars: Record<string, string>
    get(name: string): string | undefined
    set(name: string, value: string): void
    setAll(tokens: TokenMap): void
    snapshot(): TokenMap
  }

  export interface LiveTokenEngineBridge {
    getToken(name: string): string | undefined
    getTokens(): TokenMap
    setToken(name: string, value: string): void
    setTokens(tokens: TokenMap): void
    applyTokenSet(tokens: TokenMap): void
    subscribeTokens(fn: TokenSubscriber): () => void
    subscribe?(fn: TokenSubscriber): () => void
  }
}

declare module "@tailwind-styled/theme/live-tokens" {
  import type { LiveTokenEngineBridge, LiveTokenSet, TokenMap, TokenSubscriber } from "@tailwind-styled/theme"

  export const liveTokenEngine: LiveTokenEngineBridge
  export function liveToken(tokens: TokenMap): LiveTokenSet
  export function getToken(name: string): string | undefined
  export function getTokens(): TokenMap
  export function setToken(name: string, value: string): void
  export function setTokens(tokens: TokenMap): void
  export function applyTokenSet(tokens: TokenMap): void
  export function subscribeTokens(fn: TokenSubscriber): () => void
  export function generateTokenCssString(): string
  export function createUseTokens(): () => TokenMap
  export function tokenVar(name: string): string
  export function tokenRef(name: string): string
}
