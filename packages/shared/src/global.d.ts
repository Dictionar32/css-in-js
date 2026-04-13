/**
 * tailwind-styled-v4 — Shared Global Window Augmentations
 *
 * Centralized declarations untuk runtime globals yang di-set oleh core packages.
 * Tidak perlu di-edit manual — napi build akan generate .d.ts otomatis untuk
 * native binding types.
 *
 * QA: Tidak ada manual type override yang konflik dengan napi-generated types.
 */

declare global {
  interface Window {
    /** Atomic class registry — maps class names to source metadata */
    __TW_REGISTRY__?: Record<string, string>
    /** State engine registry — tracks state-enabled components */
    __TW_STATE_REGISTRY__?: Map<string, unknown>
    /** Container query registry */
    __TW_CONTAINER_REGISTRY__?: Map<string, {
      breakpoints: Array<{ minWidth: string; label?: string }>
    }>
    /** Live token engine bridge */
    __TW_TOKEN_ENGINE__?: {
      getToken(name: string): string | undefined
      getTokens(): Record<string, string>
      setToken(name: string, value: string): void
      setTokens(tokens: Record<string, string>): void
      applyTokenSet(tokens: Record<string, string>): void
      subscribeTokens(fn: (tokens: Record<string, string>) => void): () => void
      subscribe?(fn: (tokens: Record<string, string>) => void): () => void
    }
    /** DevTools inspector hook */
    __TW_DEVTOOLS__?: {
      version: string
      inspect: (className: string) => void
    }
  }
}

export {}
