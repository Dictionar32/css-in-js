#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const filesArg = process.argv.find((arg) => arg.startsWith("--files="))
const filesRequested = Number(filesArg?.split("=")[1] ?? "10000")
const fileCount = Number.isFinite(filesRequested) && filesRequested > 0 ? Math.floor(filesRequested) : 10000

const outDir = path.join(__dirname, "generated")
fs.mkdirSync(outDir, { recursive: true })

const palette = ["red", "blue", "green", "amber", "zinc", "purple", "rose", "sky"]
const shades = ["100", "200", "300", "400", "500", "600", "700"]
const spacings = ["1", "2", "3", "4", "5", "6", "8", "10", "12", "16"]

const pick = (arr, index) => arr[index % arr.length]

for (let i = 0; i < fileCount; i += 1) {
  const color = pick(palette, i)
  const shade = pick(shades, i * 7)
  const spacing = pick(spacings, i * 3)
  const width = 240 + (i % 5) * 20

  const content = `export const Component${i} = () => (
  <div className="p-${spacing} m-${spacing} bg-${color}-${shade} text-${color}-${pick(shades, i * 11)} rounded-lg w-[${width}px]">
    item-${i}
  </div>
)
`

  fs.writeFileSync(path.join(outDir, `component-${String(i).padStart(5, "0")}.tsx`), content)
}

console.log(`Generated ${fileCount} file(s) in ${outDir}`)
