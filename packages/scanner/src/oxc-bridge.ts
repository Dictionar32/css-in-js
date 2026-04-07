/**
 * tailwind-styled-v4 — Oxc AST bridge untuk scanner.
 *
 * Native-only: Rust Oxc binding is required.
 * No JavaScript fallback — native Rust binding must be available.
 *
 * Mengekspos oxcExtractClasses sebagai pengganti astExtractClasses
 * yang berbasis regex. Lebih akurat karena pakai real AST parser.
 */

import {
  loadNativeBinding,
  resolveNativeBindingCandidates,
  resolveRuntimeDir,
} from "@tailwind-styled/shared"

interface NativeOxcBinding {
  oxcExtractClasses?: (
    source: string,
    filename: string
  ) => {
    classes: string[]
    componentNames: string[]
    hasTwUsage: boolean
    hasUseClient: boolean
    imports: string[]
    engine: string
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Native Oxc Binding - Factory Pattern (no let!)
// ─────────────────────────────────────────────────────────────────────────

const createOxcBindingLoader = () => {
  const _state = { binding: undefined as NativeOxcBinding | null | undefined }

  const getBinding = (): NativeOxcBinding => {
    if (_state.binding !== undefined) {
      if (_state.binding === null) {
        throw new Error(
          "FATAL: Native Oxc binding not found.\n" +
          "This package requires native Rust bindings.\n\n" +
          "Resolution steps:\n" +
          "1. Build the native Rust module: npm run build:rust"
        )
      }
      return _state.binding
    }

    const runtimeDir = resolveRuntimeDir(undefined, import.meta.url)
    const candidates = resolveNativeBindingCandidates({ runtimeDir })
    const loaded = loadNativeBinding<NativeOxcBinding>({
      runtimeDir,
      candidates,
      isValid: (module: unknown): module is NativeOxcBinding =>
        !!module && typeof (module as Partial<NativeOxcBinding>).oxcExtractClasses === "function",
      invalidExportMessage: "native module does not expose oxcExtractClasses",
    })

    if (loaded.binding) {
      _state.binding = loaded.binding
      return loaded.binding
    }
    _state.binding = null
    throw new Error(
      "FATAL: Native Oxc binding not found in any candidate path.\n" +
      "This package requires native Rust bindings.\n\n" +
      "Candidates checked:\n" +
      candidates.map((p) => `  - ${p}`).join("\n") +
      "\n\nResolution steps:\n" +
      "1. Build the native Rust module: npm run build:rust"
    )
  }

  return {
    get: getBinding,
    reset: (): void => {
      _state.binding = undefined
    },
  }
}

const oxcBindingLoader = createOxcBindingLoader()

export interface OxcExtractResult {
  classes: string[]
  componentNames: string[]
  hasTwUsage: boolean
  hasUseClient: boolean
  imports: string[]
  engine: "oxc"
}

/**
 * Ekstrak kelas Tailwind menggunakan Oxc AST parser (Rust).
 * Lebih akurat dari regex — memahami JSX, TypeScript, template literals.
 *
 * Mengembalikan format yang sama dengan astExtractClasses untuk kompatibilitas.
 */
export function oxcExtractClasses(source: string, filename: string): OxcExtractResult {
  const binding = oxcBindingLoader.get()

  if (!binding.oxcExtractClasses) {
    throw new Error(
      "FATAL: Native binding 'oxcExtractClasses' is required but not available.\n" +
      "This package requires native Rust bindings."
    )
  }

  const r = binding.oxcExtractClasses(source, filename)
  return {
    classes: r.classes,
    componentNames: r.componentNames,
    hasTwUsage: r.hasTwUsage,
    hasUseClient: r.hasUseClient,
    imports: r.imports,
    engine: "oxc",
  }
}
