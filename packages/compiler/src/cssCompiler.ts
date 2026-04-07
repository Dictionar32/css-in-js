/**
 * tailwind-styled-v4 — CSS Compiler (Rust-backed LightningCSS-style)
 *
 * v5 CHANGE: Now requires native binding. Previously fell back to JS implementation.
 *
 * Compiles Tailwind class lists to atomic CSS using Rust native engine.
 */

import {
  TwError,
  loadNativeBinding,
  resolveNativeBindingCandidates,
  resolveRuntimeDir,
} from "@tailwind-styled/shared"

// ── Native binding - Factory Pattern (no let!)
// ─────────────────────────────────────────────────────────────────────────────

interface NativeCssBinding {
  compileCss?: (
    classes: string[],
    prefix: string | null
  ) => {
    css: string
    resolvedClasses: string[]
    unknownClasses: string[]
    sizeBytes: number
  }
}

const createBindingLoader = () => {
  const bindingState: { current: NativeCssBinding | null | undefined } = {
    current: undefined,
  }

  const loadBinding = (): NativeCssBinding => {
    if (bindingState.current !== undefined) {
      const existingBinding = bindingState.current
      if (existingBinding === null) {
        throw TwError.fromRust({
          code: "COMPILER_NATIVE_BINDING_UNAVAILABLE",
          message:
            "[tailwind-styled/compiler v5] Native CSS binding is required but not available. Please ensure the native module is properly built.",
        })
      }
      return existingBinding
    }

    const runtimeDir = resolveRuntimeDir(typeof __dirname === "string" ? __dirname : undefined, import.meta.url)
    const candidates = resolveNativeBindingCandidates({
      runtimeDir,
      envVarNames: ["TWS_NATIVE_PATH"],
    })
    const { binding, loadErrors } = loadNativeBinding<NativeCssBinding>({
      runtimeDir,
      candidates,
      isValid: (module: unknown): module is NativeCssBinding =>
        typeof (module as NativeCssBinding | null | undefined)?.compileCss === "function",
      invalidExportMessage: "Module loaded but missing `compileCss` export.",
    })
    if (binding) {
      bindingState.current = binding
      return binding
    }

    bindingState.current = null
    const lines = [
      "[tailwind-styled/compiler v5] Native CSS binding not found.",
      "Tried loading from:",
      ...candidates.map((candidate) => `  - ${candidate}`),
      "Please build the native module.",
    ]
    if (loadErrors.length > 0) {
      lines.push("Load errors:")
      for (const entry of loadErrors) lines.push(`  - ${entry.path}: ${entry.message}`)
    }
    throw TwError.fromRust({
      code: "COMPILER_NATIVE_BINDING_NOT_FOUND",
      message: lines.join("\n"),
    })
  }

  return {
    get: loadBinding,
    reset: (): void => {
      bindingState.current = undefined
    },
  }
}

const bindingLoader = createBindingLoader()

// ── Public API ────────────────────────────────────────────────────────────────

export interface CssCompileResult {
  /** Generated atomic CSS */
  css: string
  /** Classes successfully resolved to native CSS */
  resolvedClasses: string[]
  /** Classes with no native mapping */
  unknownClasses: string[]
  /** Byte size of generated CSS */
  sizeBytes: number
  /** Which engine produced this output */
  engine: "rust"
}

/**
 * Compile a list of Tailwind classes into atomic CSS.
 *
 * v5 CHANGE: Now THROWS if native binding is unavailable.
 * Previously fell back to JS implementation.
 *
 * Uses Rust LightningCSS-style engine when native binary is available.
 *
 * @example
 * const { css } = compileCssFromClasses(['flex', 'items-center', 'hover:bg-blue-600'])
 * // → ".flex { display: flex } .items-center { align-items: center } ..."
 *
 * @throws Error if native binding is not available
 */
export function compileCssFromClasses(
  classes: string[],
  options: { prefix?: string } = {}
): CssCompileResult {
  const binding = bindingLoader.get() // throws if unavailable
  const prefix = options.prefix ?? null

  // v5: Binding is guaranteed to have compileCss after getBinding() returns
  const r = binding.compileCss!(classes, prefix)
  return {
    css: r.css,
    resolvedClasses: r.resolvedClasses,
    unknownClasses: r.unknownClasses,
    sizeBytes: r.sizeBytes,
    engine: "rust",
  }
}

/**
 * Compile CSS for a set of classes and inject as a <style> block (SSR helper).
 */
export function buildStyleTag(classes: string[]): string {
  const { css } = compileCssFromClasses(classes)
  return css ? `<style data-tailwind-styled>${css}</style>` : ""
}
