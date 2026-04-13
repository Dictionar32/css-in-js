export {
  defaultGlobalCss,
  defaultPreset,
  defaultThemeCss,
  designTokens,
  generateTailwindConfig,
  generateTailwindCss,
} from "./defaultPreset"

// ── Preset Extension API (jalur ekspansi tanpa compiler changes) ──────────────
export {
  createPreset,
  extendPreset,
  mergePresets,
  type PresetExtension,
  type PresetOptions,
} from "./presetExtension"
