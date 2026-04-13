/**
 * Codegen helpers untuk tailwind-styled-v4.
 * Dari monorepo checklist: "Tambahkan helper codegen bila memang relevan"
 *
 * Berguna untuk:
 * - Generate component boilerplate dari config
 * - Generate type definitions dari variant schemas
 * - Generate Storybook stories dari cv() configs
 * - Generate migration codemods
 *
 * Design: tidak ada coupling ke compiler — hanya string manipulation.
 */

export interface ComponentCodegenOptions {
  /** Nama komponen (PascalCase) */
  name: string
  /** HTML tag */
  tag?: string
  /** Base classes */
  base?: string
  /** Variant definitions */
  variants?: Record<string, Record<string, string>>
  /** Default variants */
  defaultVariants?: Record<string, string>
  /** Compound variants */
  compoundVariants?: Array<{ class: string; [key: string]: string }>
  /** Framework target */
  framework?: "react" | "vue" | "svelte" | "vanilla"
  /** Include TypeScript types */
  withTypes?: boolean
  /** Include Storybook story */
  withStory?: boolean
}

/**
 * Generate cv() component boilerplate.
 *
 * @example
 * const code = generateComponentCode({
 *   name: "Button",
 *   tag: "button",
 *   base: "px-4 py-2 rounded font-medium",
 *   variants: {
 *     intent: { primary: "bg-blue-500 text-white", danger: "bg-red-500 text-white" },
 *     size: { sm: "h-8 text-sm", lg: "h-12 text-lg" },
 *   },
 *   defaultVariants: { intent: "primary", size: "sm" },
 * })
 */
export function generateComponentCode(opts: ComponentCodegenOptions): string {
  const {
    name,
    tag = "div",
    base = "",
    variants = {},
    defaultVariants = {},
    compoundVariants = [],
    framework = "react",
    withTypes = true,
  } = opts

  const variantKeys = Object.keys(variants)
  const lines: string[] = []

  // Imports
  if (framework === "react") {
    lines.push(`import { tw } from "tailwind-styled-v4"`)
    if (withTypes && variantKeys.length > 0) {
      lines.push(`import type { InferVariantProps } from "tailwind-styled-v4"`)
    }
  } else if (framework === "vue") {
    lines.push(`import { tw } from "@tailwind-styled/vue"`)
  } else if (framework === "svelte") {
    lines.push(`import { tw } from "@tailwind-styled/svelte"`)
  }

  lines.push("")

  // Config object
  const configLines: string[] = [`export const ${name} = tw.${tag}({`]
  if (base) configLines.push(`  base: "${base}",`)

  if (variantKeys.length > 0) {
    configLines.push(`  variants: {`)
    for (const [key, values] of Object.entries(variants)) {
      configLines.push(`    ${key}: {`)
      for (const [val, cls] of Object.entries(values)) {
        configLines.push(`      ${val}: "${cls}",`)
      }
      configLines.push(`    },`)
    }
    configLines.push(`  },`)
  }

  if (compoundVariants.length > 0) {
    configLines.push(`  compoundVariants: [`)
    for (const cv of compoundVariants) {
      const { class: cls, ...conditions } = cv
      const condStr = Object.entries(conditions)
        .map(([k, v]) => `${k}: "${v}"`)
        .join(", ")
      configLines.push(`    { ${condStr}, class: "${cls}" },`)
    }
    configLines.push(`  ],`)
  }

  if (Object.keys(defaultVariants).length > 0) {
    configLines.push(`  defaultVariants: {`)
    for (const [k, v] of Object.entries(defaultVariants)) {
      configLines.push(`    ${k}: "${v}",`)
    }
    configLines.push(`  },`)
  }

  configLines.push(`})`)
  lines.push(...configLines)

  // TypeScript type alias
  if (withTypes && variantKeys.length > 0 && framework === "react") {
    lines.push("")
    lines.push(`export type ${name}Props = InferVariantProps<typeof ${name}> & {`)
    lines.push(`  children?: React.ReactNode`)
    lines.push(`  className?: string`)
    lines.push(`}`)
  }

  return lines.join("\n")
}

/**
 * Generate Storybook stories dari component config.
 *
 * @example
 * const stories = generateStorybookStory({ name: "Button", ... })
 */
export function generateStorybookStory(opts: ComponentCodegenOptions): string {
  const { name, variants = {}, defaultVariants = {} } = opts
  const lines: string[] = []

  lines.push(`import type { Meta, StoryObj } from "@storybook/react"`)
  lines.push(`import { ${name} } from "./${name}"`)
  lines.push(`import { generateArgTypes, generateDefaultArgs } from "tailwind-styled-v4"`)
  lines.push(``)
  lines.push(`const config = {`)
  if (Object.keys(variants).length > 0) {
    lines.push(`  variants: ${JSON.stringify(variants, null, 2).replace(/^/gm, "  ")},`)
  }
  if (Object.keys(defaultVariants).length > 0) {
    lines.push(`  defaultVariants: ${JSON.stringify(defaultVariants)},`)
  }
  lines.push(`}`)
  lines.push(``)
  lines.push(`const meta: Meta<typeof ${name}> = {`)
  lines.push(`  title: "Components/${name}",`)
  lines.push(`  component: ${name},`)
  lines.push(`  argTypes: generateArgTypes(config),`)
  lines.push(`  args: generateDefaultArgs(config),`)
  lines.push(`}`)
  lines.push(``)
  lines.push(`export default meta`)
  lines.push(`type Story = StoryObj<typeof ${name}>`)
  lines.push(``)
  lines.push(`export const Default: Story = {}`)

  // Generate one story per variant combo (up to 6)
  const variantEntries = Object.entries(variants)
  if (variantEntries.length > 0) {
    const [firstKey, firstValues] = variantEntries[0]
    const valueKeys = Object.keys(firstValues).slice(0, 4)
    for (const val of valueKeys) {
      const storyName = `${firstKey.charAt(0).toUpperCase()}${firstKey.slice(1)}${val.charAt(0).toUpperCase()}${val.slice(1)}`
      lines.push(``)
      lines.push(`export const ${storyName}: Story = {`)
      lines.push(`  args: { ${firstKey}: "${val}" },`)
      lines.push(`}`)
    }
  }

  return lines.join("\n")
}

/**
 * Generate migration codemod untuk class renames.
 * Berguna saat ada class yang deprecated atau diganti nama.
 *
 * @example
 * const codemod = generateClassRenameCodemod({
 *   "btn-primary": "bg-blue-500 text-white",
 *   "btn-danger": "bg-red-500 text-white",
 * })
 */
export function generateClassRenameCodemod(
  renames: Record<string, string>,
  opts: { format?: "jscodeshift" | "regex"; filename?: string } = {}
): string {
  const { format = "regex", filename = "rename-classes.mjs" } = opts
  const lines: string[] = []

  if (format === "regex") {
    lines.push(`#!/usr/bin/env node`)
    lines.push(`/**`)
    lines.push(` * Auto-generated class rename codemod`)
    lines.push(` * Usage: node ${filename} ./src`)
    lines.push(` */`)
    lines.push(`import fs from "node:fs"`)
    lines.push(`import path from "node:path"`)
    lines.push(`import { execSync } from "node:child_process"`)
    lines.push(``)
    lines.push(`const RENAMES = {`)
    for (const [from, to] of Object.entries(renames)) {
      lines.push(`  "${from}": "${to}",`)
    }
    lines.push(`}`)
    lines.push(``)
    lines.push(`const dir = process.argv[2] ?? "."`)
    lines.push(`const files = execSync(\`find \${dir} -name "*.tsx" -o -name "*.ts" -o -name "*.jsx"\`, { encoding: "utf-8" }).split("\\n").filter(Boolean)`)
    lines.push(``)
    lines.push(`let total = 0`)
    lines.push(`for (const file of files) {`)
    lines.push(`  let content = fs.readFileSync(file, "utf-8")`)
    lines.push(`  let changed = false`)
    lines.push(`  for (const [from, to] of Object.entries(RENAMES)) {`)
    lines.push(`    const re = new RegExp(\`\\\\b\${from.replace(/[.*+?^${}()|[\\\\]\\\\\\\\]/g, "\\\\\\\\$&")}\\\\b\`, "g")`)
    lines.push(`    if (re.test(content)) { content = content.replace(re, to); changed = true; total++ }`)
    lines.push(`  }`)
    lines.push(`  if (changed) fs.writeFileSync(file, content)`)
    lines.push(`}`)
    lines.push(`console.log(\`Renamed \${total} occurrences in \${files.length} files\`)`)
  }

  return lines.join("\n")
}

/**
 * Generate index barrel file untuk sebuah directory.
 *
 * @example
 * const barrel = generateBarrelFile(["Button", "Card", "Input"], "src/components")
 */
export function generateBarrelFile(
  exports: string[],
  dir: string,
  opts: { includeTypes?: boolean } = {}
): string {
  const { includeTypes = true } = opts
  const lines: string[] = []
  lines.push(`// Auto-generated barrel file for ${dir}`)
  lines.push(`// Run: npx tsx scripts/generate-barrel.ts to regenerate`)
  lines.push(``)
  for (const name of exports) {
    lines.push(`export { default as ${name}, type ${name}Props } from "./${name}"`)
    if (includeTypes) {
      lines.push(`export type * from "./${name}"`)
    }
  }
  return lines.join("\n")
}
