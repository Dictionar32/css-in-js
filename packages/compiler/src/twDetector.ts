/**
 * tailwind-styled-v4 — twDetector
 *
 * Native-only detector utilities.
 */

import { getNativeBridge } from "./nativeBridge"

/** Transform already-applied marker — idempotency guard (#08) */
export const TRANSFORM_MARKER = "/* @tw-transformed */"

export function hasTwUsage(source: string): boolean {
  const native = getNativeBridge()
  if (!native?.hasTwUsageNative) {
    throw new Error("Native binding 'hasTwUsageNative' is required but not available.")
  }
  return native.hasTwUsageNative(source)
}

/** Check if file was already transformed — prevents double processing (#08) */
export function isAlreadyTransformed(source: string): boolean {
  const native = getNativeBridge()
  if (!native?.isAlreadyTransformedNative) {
    throw new Error("Native binding 'isAlreadyTransformedNative' is required but not available.")
  }
  return native.isAlreadyTransformedNative(source)
}

export function isTwTemplateLiteral(source: string, index: number): boolean {
  const before = source.slice(Math.max(0, index - 20), index)
  return /\btw\.\w+$/.test(before) || /\btw\(\w+\)$/.test(before)
}

export function isDynamic(content: string): boolean {
  return content.includes("${")
}

export function isServerComponent(source: string): boolean {
  return !source.includes('"use client"') && !source.includes("'use client'")
}

export function hasInteractiveFeatures(content: string): boolean {
  return /\b(hover:|focus:|active:|group-hover:|peer-|on[A-Z]|useState|useEffect|useRef)\b/.test(
    content
  )
}
