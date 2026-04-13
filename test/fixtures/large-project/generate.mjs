#!/usr/bin/env node
/**
 * Generate large project fixture untuk stress testing scanner.
 * ESM-first — pakai import/export bukan require().
 *
 * Usage:
 *   node test/fixtures/large-project/generate.mjs --files=10000
 *   node test/fixtures/large-project/generate.mjs --files=100 --out=test/fixtures/custom
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const args = new Map(
  process.argv.slice(2).map((entry) => {
    const eqIdx = entry.replace(/^--/, "").indexOf("=")
    if (eqIdx === -1) return [entry.replace(/^--/, ""), "true"]
    const key = entry.replace(/^--/, "").slice(0, eqIdx)
    const val = entry.replace(/^--/, "").slice(eqIdx + 1)
    return [key, val]
  })
)

const totalFiles = Number(args.get("files") ?? 200)
const outputDir = path.resolve(args.get("out") ?? path.join(__dirname, "generated"))
const chunkSize = Number(args.get("chunk") ?? 50)

if (!Number.isFinite(totalFiles) || totalFiles <= 0) {
  console.error(`Invalid --files value: ${totalFiles}`)
  process.exit(1)
}

const CLASS_POOL = [
  "flex", "flex-col", "flex-row", "inline-flex", "grid", "block", "hidden",
  "items-center", "items-start", "items-end", "justify-between", "justify-center",
  "p-4", "p-2", "p-6", "px-4", "py-2", "m-auto", "mx-auto", "mt-4", "mb-4",
  "w-full", "h-full", "max-w-sm", "max-w-md", "max-w-lg", "min-h-screen",
  "bg-white", "bg-gray-100", "bg-blue-500", "bg-red-500", "bg-green-500",
  "text-white", "text-black", "text-gray-500", "text-sm", "text-base", "text-lg",
  "font-bold", "font-medium", "font-normal", "rounded", "rounded-lg", "rounded-full",
  "border", "border-gray-300", "shadow", "shadow-md", "shadow-lg",
  "hover:bg-blue-600", "hover:text-white", "focus:outline-none",
  "transition", "duration-200", "cursor-pointer", "opacity-75",
  "sm:flex", "md:grid", "lg:hidden", "dark:bg-gray-800",
  "gap-2", "gap-4", "space-x-2", "space-y-4", "overflow-hidden",
]

function pickClasses(count) {
  const picked = new Set()
  while (picked.size < count) {
    picked.add(CLASS_POOL[Math.floor(Math.random() * CLASS_POOL.length)])
  }
  return Array.from(picked)
}

function generateComponent(index) {
  const name = `Component${index}`
  const classes = pickClasses(Math.floor(Math.random() * 6) + 3)
  const variantClasses = pickClasses(Math.floor(Math.random() * 4) + 2)

  return `import { tw } from "tailwind-styled-v4"

export const ${name} = tw.div({
  base: "${classes.join(" ")}",
  variants: {
    size: {
      sm: "${variantClasses.slice(0, 2).join(" ")}",
      lg: "${variantClasses.slice(2).join(" ") || "text-lg"}",
    },
  },
  defaultVariants: { size: "sm" },
})

export default ${name}
`
}

// Bersihkan output dir
if (fs.existsSync(outputDir)) {
  fs.rmSync(outputDir, { recursive: true, force: true })
}

const totalChunks = Math.ceil(totalFiles / chunkSize)
let created = 0

for (let chunk = 0; chunk < totalChunks; chunk++) {
  const chunkDir = path.join(outputDir, `chunk-${String(chunk).padStart(4, "0")}`)
  fs.mkdirSync(chunkDir, { recursive: true })

  const filesInChunk = Math.min(chunkSize, totalFiles - chunk * chunkSize)
  for (let i = 0; i < filesInChunk; i++) {
    const idx = chunk * chunkSize + i
    const content = generateComponent(idx)
    fs.writeFileSync(path.join(chunkDir, `Component${idx}.tsx`), content, "utf-8")
    created++
  }
}

console.log(`Generated ${created} fixture files in ${outputDir}`)
console.log(`Run scanner: npx tw scan ${outputDir}`)
