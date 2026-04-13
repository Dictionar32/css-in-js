/**
 * Preset extension API — jalur ekspansi untuk custom presets.
 * Dari monorepo checklist: "Siapkan jalur ekspansi preset tanpa memaksa perubahan compiler besar"
 *
 * Pattern: buat preset custom dengan extend/merge tanpa menyentuh compiler.
 */
import type { ComponentConfig } from "@tailwind-styled/shared"
import { defaultPreset, designTokens } from "./defaultPreset"

export interface PresetExtension {
  /** Token tambahan (akan di-merge dengan defaultPreset tokens) */
  tokens?: Record<string, string>
  /** Component configs default yang bisa di-override */
  components?: Record<string, ComponentConfig>
  /** CSS tambahan yang di-inject setelah @theme default */
  additionalCss?: string
  /** Override dark mode strategy */
  darkMode?: "class" | "media"
  /** Plugin tambahan untuk Tailwind config */
  plugins?: unknown[]
  /** Extend content paths */
  content?: string[]
}

export interface PresetOptions {
  /** Nama preset (untuk debugging) */
  name?: string
  /** Override dark mode dari default */
  darkMode?: "class" | "media"
  /** Custom content paths (merged dengan default) */
  content?: string[]
}

/** Buat preset custom dari scratch */
export function createPreset(
  extension: PresetExtension,
  opts: PresetOptions = {}
): typeof defaultPreset {
  const { name = "custom-preset", darkMode, content = [] } = opts

  const mergedTokens = {
    ...designTokens,
    ...extension.tokens,
  }

  const base = defaultPreset as Record<string, unknown>
  const baseTheme = (base.theme as Record<string, unknown>) ?? {}
  const baseExtend = (baseTheme.extend as Record<string, unknown>) ?? {}

  return {
    ...defaultPreset,
    darkMode: darkMode ?? defaultPreset.darkMode,
    content: [...(defaultPreset.content as string[]), ...content],
    theme: {
      ...baseTheme,
      extend: {
        ...baseExtend,
        colors: {
          ...(baseExtend.colors as Record<string, unknown>),
          ...(extension.tokens
            ? Object.fromEntries(
                Object.entries(extension.tokens).map(([k, v]) => [k, v])
              )
            : {}),
        },
      },
    },
    plugins: [...((defaultPreset.plugins as unknown[]) ?? []), ...(extension.plugins ?? [])],
  } as typeof defaultPreset
}

/**
 * Extend existing preset dengan tokens/components tambahan.
 * Tidak memerlukan perubahan compiler — semua di Tailwind config layer.
 *
 * @example
 * const myPreset = extendPreset(defaultPreset, {
 *   tokens: { "brand-blue": "#1d4ed8", "brand-red": "#dc2626" },
 *   additionalCss: ".btn { @apply px-4 py-2 rounded; }",
 * })
 */
export function extendPreset(
  base: typeof defaultPreset,
  extension: PresetExtension
): typeof defaultPreset {
  const baseObj = base as Record<string, unknown>
  const baseTheme = (baseObj.theme as Record<string, unknown>) ?? {}
  const baseExtend = (baseTheme.extend as Record<string, unknown>) ?? {}

  return {
    ...base,
    content: [
      ...((base.content as string[]) ?? []),
      ...(extension.content ?? []),
    ],
    darkMode: extension.darkMode ?? base.darkMode,
    theme: {
      ...baseTheme,
      extend: {
        ...baseExtend,
        colors: {
          ...(baseExtend.colors as Record<string, unknown>),
          ...(extension.tokens ?? {}),
        },
      },
    },
    plugins: [...((base.plugins as unknown[]) ?? []), ...(extension.plugins ?? [])],
  } as typeof defaultPreset
}

/**
 * Merge dua atau lebih presets — tokens, plugins, dan content di-merge.
 * Preset terakhir menang untuk keys yang konflik.
 */
export function mergePresets(...presets: Array<typeof defaultPreset>): typeof defaultPreset {
  return presets.reduce((acc, preset) => extendPreset(acc, {
    content: (preset.content as string[]) ?? [],
    plugins: (preset.plugins as unknown[]) ?? [],
  }))
}
