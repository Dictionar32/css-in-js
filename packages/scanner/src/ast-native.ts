/**
 * tailwind-styled-v4 — AST-native class extractor (Rust-backed)
 *
 * Native-only: Rust AST binding is required.
 * No JavaScript fallback — native Rust binding must be available.
 *
 * Uses ast_extract_classes() N-API function.
 */

import {
  loadNativeBinding,
  resolveNativeBindingCandidates,
  resolveRuntimeDir,
} from "@tailwind-styled/shared"

// ── Native binding ────────────────────────────────────────────────────────────

interface NativeAstBinding {
  astExtractClasses?: (
    source: string,
    filename: string
  ) => {
    classes: string[]
    componentNames: string[]
    hasTwUsage: boolean
    hasUseClient: boolean
    imports: string[]
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Native AST Binding - Factory Pattern (no let!)
// ─────────────────────────────────────────────────────────────────────────

const createAstBindingLoader = () => {
  const _state = { binding: undefined as NativeAstBinding | null | undefined }

  const getBinding = (): NativeAstBinding => {
    if (_state.binding !== undefined) {
      if (_state.binding === null) {
        throw new Error(
          "FATAL: Native AST binding not found.\n" +
          "This package requires native Rust bindings.\n\n" +
          "Resolution steps:\n" +
          "1. Build the native Rust module: npm run build:rust"
        )
      }
      return _state.binding
    }

    const runtimeDir = resolveRuntimeDir(undefined, import.meta.url)
    const candidates = resolveNativeBindingCandidates({ runtimeDir })
    const loaded = loadNativeBinding<NativeAstBinding>({
      runtimeDir,
      candidates,
      isValid: (module: unknown): module is NativeAstBinding =>
        !!module && typeof (module as Partial<NativeAstBinding>).astExtractClasses === "function",
      invalidExportMessage: "native module does not expose astExtractClasses",
    })

    if (loaded.binding) {
      _state.binding = loaded.binding
      return loaded.binding
    }
    _state.binding = null
    throw new Error(
      "FATAL: Native AST binding not found in any candidate path.\n" +
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

const astBindingLoader = createAstBindingLoader()

// ── Public API ────────────────────────────────────────────────────────────────

export interface AstExtractResult {
  classes: string[]
  componentNames: string[]
  hasTwUsage: boolean
  hasUseClient: boolean
  imports: string[]
  engine: "rust" | "oxc"
}

/**
 * Extract Tailwind classes using AST-level analysis.
 * More accurate than pure regex — handles JSX, template literals, object configs.
 *
 * Uses Rust engine — native binding is required.
 */
export function astExtractClasses(source: string, filename: string): AstExtractResult {
  const binding = astBindingLoader.get()

  if (!binding.astExtractClasses) {
    throw new Error(
      "FATAL: Native binding 'astExtractClasses' is required but not available.\n" +
      "This package requires native Rust bindings."
    )
  }

  const r = binding.astExtractClasses(source, filename)
  return {
    classes: r.classes,
    componentNames: r.componentNames,
    hasTwUsage: r.hasTwUsage,
    hasUseClient: r.hasUseClient,
    imports: r.imports,
    engine: "rust",
  }
}
