#!/usr/bin/env node
/**
 * tw split [root] [outDir] — Route-based CSS splitting via Rust scanner.
 * Extracts classes per route file and generates separate CSS chunks.
 */
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const [,, rootArg = '.', outDirArg = 'artifacts/route-css'] = process.argv
const root   = path.resolve(process.cwd(), rootArg)
const outDir = path.resolve(process.cwd(), outDirArg)

function escapeClassForSelector(className) {
  return className.replace(/([^a-zA-Z0-9_-])/g, "\\$1")
}

function utilityToDeclaration(className) {
  const arbitraryMatch = className.match(/^(w|h|min-w|min-h|max-w|max-h)-\[(.+)\]$/)
  if (arbitraryMatch) {
    const [, prop, value] = arbitraryMatch
    const propMap = {
      w: "width",
      h: "height",
      "min-w": "min-width",
      "min-h": "min-height",
      "max-w": "max-width",
      "max-h": "max-height",
    }
    const cssProp = propMap[prop]
    return cssProp ? `${cssProp}:${value};` : null
  }

  const spacingArbitrary = className.match(/^(p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml)-\[(.+)\]$/)
  if (spacingArbitrary) {
    const [, prop, value] = spacingArbitrary
    const map = {
      p: ["padding"],
      px: ["padding-left", "padding-right"],
      py: ["padding-top", "padding-bottom"],
      pt: ["padding-top"],
      pr: ["padding-right"],
      pb: ["padding-bottom"],
      pl: ["padding-left"],
      m: ["margin"],
      mx: ["margin-left", "margin-right"],
      my: ["margin-top", "margin-bottom"],
      mt: ["margin-top"],
      mr: ["margin-right"],
      mb: ["margin-bottom"],
      ml: ["margin-left"],
    }
    const cssProps = map[prop]
    if (!cssProps) return null
    return cssProps.map((cssProp) => `${cssProp}:${value};`).join("")
  }

  const insetArbitrary = className.match(/^(inset|inset-x|inset-y|top|right|bottom|left)-\[(.+)\]$/)
  if (insetArbitrary) {
    const [, prop, value] = insetArbitrary
    const map = {
      inset: ["top", "right", "bottom", "left"],
      "inset-x": ["left", "right"],
      "inset-y": ["top", "bottom"],
      top: ["top"],
      right: ["right"],
      bottom: ["bottom"],
      left: ["left"],
    }
    const cssProps = map[prop]
    if (!cssProps) return null
    return cssProps.map((cssProp) => `${cssProp}:${value};`).join("")
  }

  const gridColsMatch = className.match(/^grid-cols-(\d+)$/)
  if (gridColsMatch) {
    const count = Number(gridColsMatch[1])
    if (count > 0) return `grid-template-columns:repeat(${count},minmax(0,1fr));`
  }

  const gridRowsMatch = className.match(/^grid-rows-(\d+)$/)
  if (gridRowsMatch) {
    const count = Number(gridRowsMatch[1])
    if (count > 0) return `grid-template-rows:repeat(${count},minmax(0,1fr));`
  }

  const gridArbitrary = className.match(/^(grid-cols|grid-rows)-\[(.+)\]$/)
  if (gridArbitrary) {
    const [, prop, value] = gridArbitrary
    return prop === "grid-cols"
      ? `grid-template-columns:${value};`
      : `grid-template-rows:${value};`
  }

  const spanMatch = className.match(/^(col|row)-span-(\d+)$/)
  if (spanMatch) {
    const [, axis, countRaw] = spanMatch
    const count = Number(countRaw)
    if (count > 0) {
      return axis === "col"
        ? `grid-column:span ${count}/span ${count};`
        : `grid-row:span ${count}/span ${count};`
    }
  }

  const gapArbitrary = className.match(/^(gap|gap-x|gap-y)-\[(.+)\]$/)
  if (gapArbitrary) {
    const [, prop, value] = gapArbitrary
    const map = {
      gap: ["gap"],
      "gap-x": ["column-gap"],
      "gap-y": ["row-gap"],
    }
    const cssProps = map[prop]
    if (!cssProps) return null
    return cssProps.map((cssProp) => `${cssProp}:${value};`).join("")
  }

  const transformArbitrary = className.match(/^(translate-x|translate-y)-\[(.+)\]$/)
  if (transformArbitrary) {
    const [, axis, value] = transformArbitrary
    return axis === "translate-x"
      ? `--tw-translate-x:${value};transform:translate(var(--tw-translate-x),var(--tw-translate-y,0));`
      : `--tw-translate-y:${value};transform:translate(var(--tw-translate-x,0),var(--tw-translate-y));`
  }

  const zArbitrary = className.match(/^z-\[(.+)\]$/)
  if (zArbitrary) return `z-index:${zArbitrary[1]};`

  const opacityArbitrary = className.match(/^opacity-\[(.+)\]$/)
  if (opacityArbitrary) return `opacity:${opacityArbitrary[1]};`

  const roundedArbitrary = className.match(/^rounded-\[(.+)\]$/)
  if (roundedArbitrary) return `border-radius:${roundedArbitrary[1]};`

  return null
}

if (!fs.existsSync(root)) { console.error(`Root not found: ${root}`); process.exit(1) }
fs.mkdirSync(outDir, { recursive: true })

// Load Rust scanner
let scanWorkspace
try {
  scanWorkspace = require('@tailwind-styled/scanner').scanWorkspace
} catch {
  try {
    scanWorkspace = require(path.resolve(__dirname, '../../packages/scanner/dist/index.cjs')).scanWorkspace
  } catch { scanWorkspace = null }
}

if (!scanWorkspace) {
  console.error('[split] scanner not available — build packages/scanner first')
  process.exit(1)
}

console.log(`[split] Scanning ${root} (Rust scanner)...`)
const scan = scanWorkspace(root)
console.log(`[split] ${scan.totalFiles} files, ${scan.uniqueClasses.length} unique classes`)

// Group files by route (Next.js pages/app pattern, or just top-level dir)
const routeMap = new Map()
for (const f of scan.files) {
  const rel = path.relative(root, f.file)
  // Determine route key from file path
  const parts = rel.split(path.sep)
  let routeKey = 'global'
  if (parts[0] === 'pages' || parts[0] === 'app') {
    routeKey = parts.slice(0, 2).join('/').replace(/\.(tsx?|jsx?)$/, '')
  } else if (parts[0] === 'src' && (parts[1] === 'pages' || parts[1] === 'app')) {
    routeKey = parts.slice(1, 3).join('/').replace(/\.(tsx?|jsx?)$/, '')
  }
  if (!routeMap.has(routeKey)) routeMap.set(routeKey, new Set())
  for (const cls of f.classes) routeMap.get(routeKey).add(cls)
}

// Write one manifest file per route
const manifest = {}
for (const [route, classes] of routeMap) {
  const safeName = route.replace(/[/\\:*?"<>|]/g, '_')
  const outFile  = path.join(outDir, `${safeName}.classes.json`)
  const classList = Array.from(classes).sort()
  fs.writeFileSync(outFile, JSON.stringify({ route, classes: classList }, null, 2))
  const cssRules = classList
    .map((cls) => {
      const declaration = utilityToDeclaration(cls)
      if (!declaration) return null
      return `.${escapeClassForSelector(cls)}{${declaration}}`
    })
    .filter(Boolean)
    .join('\n')
  if (cssRules.length > 0) {
    fs.writeFileSync(path.join(outDir, `${safeName}.css`), `${cssRules}\n`)
  }
  manifest[route] = classList.length
}

// Write summary manifest
fs.writeFileSync(
  path.join(outDir, '_manifest.json'),
  JSON.stringify({ root, routes: Object.fromEntries(routeMap.entries().map(([r,s]) => [r, s.size])) }, null, 2)
)

console.log(`[split] ${routeMap.size} routes written to ${outDir}`)
for (const [route, count] of Object.entries(manifest)) {
  console.log(`  ${route.padEnd(40)} ${count} classes`)
}
