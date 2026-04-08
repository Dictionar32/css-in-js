/**
 * tailwind-styled-v4 — classExtractor
 *
 * Ekstrak semua Tailwind class dari source untuk safelist generation.
 */

import {
  extractAllClasses as extractClassesFromSyntax,
  parseClasses,
} from "@tailwind-styled/syntax"
import { parseComponentConfig } from "./astParser"

/**
 * Extract all Tailwind classes from source code.
 *
 * v5 CHANGE: Now THROWS if native binding is unavailable.
 * Previously fell back to JS implementation.
 *
 * @param source - Source code to extract classes from
 * @returns Array of unique class names (sorted)
 * @throws Error if native binding is not available
 */
export function extractAllClasses(source: string): string[] {
  return extractClassesFromSyntax(source)
}

export { parseClasses }
// Re-export for backward compat — now use parseComponentConfig from astParser
export function extractBaseFromObject(objectStr: string): string {
  return parseComponentConfig(objectStr).base
}
export function extractVariantsFromObject(
  objectStr: string
): Record<string, Record<string, string>> {
  return parseComponentConfig(objectStr).variants
}
