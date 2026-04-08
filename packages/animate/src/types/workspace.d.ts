declare module "@tailwind-styled/shared" {
  export class LRUCache<K, V> {
    constructor(capacity: number)
    get(key: K): V | undefined
    set(key: K, value: V): void
    delete(key: K): boolean
    has(key: K): boolean
    clear(): void
    entries(): IterableIterator<[K, V]>
  }

  export function formatErrorMessage(error: unknown): string
  export function resolveRuntimeDir(dir: string | undefined, importMetaUrl: string): string
  export function createDebugLogger(namespace: string, label?: string): (msg: string) => void
  export function resolveNativeBindingCandidates(options: {
    runtimeDir: string
    envVarNames?: string[]
    includeDefaultCandidates?: boolean
    enforceNodeExtensionForEnvPath?: boolean
  }): string[]
  export function loadNativeBinding<T>(options: {
    runtimeDir: string
    candidates: string[]
    isValid: (module: unknown) => module is T
    invalidExportMessage: string
  }): {
    binding: T | null
    loadErrors: Array<{ path: string; message: string }>
    loadedPath?: string
  }
}

declare module "@tailwind-styled/analyzer" {
  export function classToCss(
    classes: string[],
    options?: { strict?: boolean }
  ): Promise<{ unknownClasses: string[] }>
}
