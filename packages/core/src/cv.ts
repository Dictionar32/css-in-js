/**
 * tailwind-styled-v4 v2 — cv()
 *
 * UPGRADE #3: cv() now infers exact variant values from config.
 *
 * Standalone class variant function — no React needed.
 * Compatible with shadcn/ui, Radix, Headless UI.
 *
 * @example
 * const button = cv({
 *   base: "px-4 py-2 rounded-lg",
 *   variants: { size: { sm: "text-sm", lg: "text-lg" } },
 *   defaultVariants: { size: "sm" }
 * })
 *
 * // BEFORE: button({ size: "xl" }) — no error (size was string)
 * // AFTER:  button({ size: "xl" }) — TypeScript ERROR: "xl" not in "sm" | "lg" ✓
 *
 * button({ size: "lg" }) → "px-4 py-2 rounded-lg text-lg"
 */

import { twMerge } from "tailwind-merge"
import type { ComponentConfig, CvFn, InferVariantProps } from "./types"

export function cv<C extends ComponentConfig>(config: C): CvFn<C> {
  const { base = "", variants = {}, compoundVariants = [], defaultVariants = {} } = config

  // Dev-mode: validate defaultVariants keys exist in variants
  if (process.env.NODE_ENV !== "production") {
    for (const dk of Object.keys(defaultVariants)) {
      if (!(dk in variants)) {
        console.warn(`[tailwind-styled] defaultVariants["${dk}"] not defined in variants`)
      }
    }
  }

  // Dev-mode: pre-build valid value sets for runtime validation
  const validValues: Record<string, Set<string>> | null =
    process.env.NODE_ENV !== "production"
      ? Object.fromEntries(
          Object.entries(variants).map(([k, v]) => [k, new Set(Object.keys(v))])
        )
      : null

  return (
    props: InferVariantProps<C> & { className?: string } & Readonly<
        Record<string, unknown>
      > = {} as never
  ): string => {
    const classes = [base]

    // Process single-value variants
    for (const key in variants) {
      const val = (props as Record<string, unknown>)[key] ?? defaultVariants[key]

      // Dev-mode: warn on invalid variant value
      if (process.env.NODE_ENV !== "production" && validValues && val !== undefined) {
        const strVal = String(val)
        if (!validValues[key]!.has(strVal)) {
          console.warn(
            `[tailwind-styled] Invalid variant: ${key}="${strVal}". ` +
              `Valid: ${Array.from(validValues[key]!).join(", ")}`
          )
        }
      }

      if (
        val !== undefined &&
        (variants as Record<string, Record<string, string>>)[key]?.[String(val)]
      ) {
        classes.push((variants as Record<string, Record<string, string>>)[key]![String(val)])
      }
    }

    // Process compound variants
    for (const compound of compoundVariants) {
      const { class: cls, ...conditions } = compound
      const match = Object.entries(conditions).every(
        ([k, v]) => (props as Record<string, unknown>)[k] === v
      )
      if (match) classes.push(cls)
    }

    if (props.className) classes.push(props.className)

    return twMerge(...classes)
  }
}

// ── Variant Config Validation (QA #6) ────────────────────────────────────────

export interface VariantValidationError {
  type: "unknown_key" | "unknown_value" | "missing_default" | "compound_condition_missing"
  key: string
  value?: string
  message: string
}

export interface VariantValidationResult {
  valid: boolean
  errors: VariantValidationError[]
  warnings: string[]
}

/**
 * Validate a component config for correctness.
 * Panggil saat development untuk mendeteksi typos dan invalid configs.
 *
 * @example
 * const result = validateVariantConfig({
 *   base: "px-4",
 *   variants: { size: { sm: "h-8", lg: "h-12" } },
 *   defaultVariants: { size: "md" }, // typo: "md" tidak ada
 * })
 * console.log(result.errors) // [{ type: "unknown_value", key: "size", value: "md", ... }]
 */
export function validateVariantConfig(config: ComponentConfig): VariantValidationResult {
  const errors: VariantValidationError[] = []
  const warnings: string[] = []
  const { variants = {}, defaultVariants = {}, compoundVariants = [] } = config

  // 1. Check defaultVariants keys exist in variants
  for (const [key, val] of Object.entries(defaultVariants)) {
    if (!(key in variants)) {
      errors.push({
        type: "unknown_key",
        key,
        message: `defaultVariants["${key}"] tidak ada di variants. Keys yang valid: ${Object.keys(variants).join(", ")}`,
      })
    } else if (val && !((variants[key] ?? {})[val])) {
      errors.push({
        type: "unknown_value",
        key,
        value: val,
        message: `defaultVariants["${key}"] = "${val}" tidak ada. Values yang valid: ${Object.keys(variants[key] ?? {}).join(", ")}`,
      })
    }
  }

  // 2. Check compound variants reference valid keys and values
  for (const [i, compound] of compoundVariants.entries()) {
    const { class: _cls, ...conditions } = compound
    for (const [key, val] of Object.entries(conditions)) {
      if (!(key in variants)) {
        errors.push({
          type: "unknown_key",
          key,
          message: `compoundVariants[${i}]: key "${key}" tidak ada di variants`,
        })
      } else if (!((variants[key] ?? {})[val])) {
        warnings.push(
          `compoundVariants[${i}]: ${key}="${val}" tidak ada di variants. Values yang valid: ${Object.keys(variants[key] ?? {}).join(", ")}`
        )
      }
    }
  }

  // 3. Warn if variants defined but no defaultVariants
  const variantKeys = Object.keys(variants)
  const defaultKeys = Object.keys(defaultVariants)
  const missingDefaults = variantKeys.filter(k => !defaultKeys.includes(k))
  if (missingDefaults.length > 0) {
    warnings.push(
      `Variant keys tanpa defaultVariants: ${missingDefaults.join(", ")}. Props akan jadi undefined jika tidak di-pass.`
    )
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}
