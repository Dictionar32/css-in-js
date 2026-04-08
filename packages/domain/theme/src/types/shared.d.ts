declare module "@tailwind-styled/shared" {
  export type TokenMap = Record<string, string>

  export function createDebugLogger(namespace: string): (msg: string) => void

  export interface LoadNativeBindingOptions<T> {
    runtimeDir: string
    candidates: string[]
    isValid: (module: unknown) => module is T
    invalidExportMessage: string
  }

  export interface LoadNativeBindingResult<T> {
    binding: T | null
    loadErrors: Array<{ path: string; message: string }>
    loadedPath?: string
  }

  export function loadNativeBinding<T>(
    options: LoadNativeBindingOptions<T>
  ): LoadNativeBindingResult<T>

  export function resolveNativeBindingCandidates(options: {
    runtimeDir: string
    envVarNames?: string[]
    includeDefaultCandidates?: boolean
    enforceNodeExtensionForEnvPath?: boolean
  }): string[]
}
