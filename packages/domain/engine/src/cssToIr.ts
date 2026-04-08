import {
  ConditionId,
  ConditionResult,
  createFingerprint,
  Importance,
  LayerId,
  Origin,
  PropertyId,
  RuleId,
  type RuleIR,
  SelectorId,
  ValueId,
  VariantChainId,
} from "./ir"

export interface ParseCssToIrOptions {
  prefix?: string
}

interface ParsedSelector {
  className: string
  variants: string[]
  pseudoClasses: string[]
  mediaQuery: string | null
}

interface ParsedRule {
  selector: ParsedSelector
  property: string
  value: string
  important: boolean
}

// ─────────────────────────────────────────────────────────────────────────
// ID Generator - Factory Pattern (no let!)
// ─────────────────────────────────────────────────────────────────────────

interface GeneratorState {
  ruleIdCounter: number
  selectorIdCounter: number
  propertyIdCounter: number
  valueIdCounter: number
  layerIdCounter: number
  conditionIdCounter: number
  insertionOrderCounter: number
  layerMap: Map<string, LayerId>
  layerOrderMap: Map<string, number>
}

function createGeneratorState(): GeneratorState {
  return {
    ruleIdCounter: 0,
    selectorIdCounter: 0,
    propertyIdCounter: 0,
    valueIdCounter: 0,
    layerIdCounter: 0,
    conditionIdCounter: 0,
    insertionOrderCounter: 0,
    layerMap: new Map<string, LayerId>(),
    layerOrderMap: new Map<string, number>(),
  }
}

const generateRuleId = (state: GeneratorState): RuleId => new RuleId(state.ruleIdCounter++)
const generateSelectorId = (state: GeneratorState): SelectorId => new SelectorId(state.selectorIdCounter++)
const generatePropertyId = (state: GeneratorState, propertyName: string): PropertyId => {
  return new PropertyId(state.propertyIdCounter++, propertyName)
}
const generateValueId = (state: GeneratorState, valueName: string): ValueId => {
  return new ValueId(state.valueIdCounter++, valueName)
}
const generateLayerId = (state: GeneratorState): LayerId => new LayerId(state.layerIdCounter++)
const generateConditionId = (state: GeneratorState): ConditionId =>
  new ConditionId(state.conditionIdCounter++)
const getNextInsertionOrder = (state: GeneratorState): number => state.insertionOrderCounter++

const LAYER_ORDER: Record<string, number> = {
  base: 0,
  components: 1,
  utilities: 2,
  tailwind: 3,
}

function getOrCreateLayerId(state: GeneratorState, layerName: string): LayerId | null {
  const existing = state.layerMap.get(layerName)
  if (existing) return existing

  const order = LAYER_ORDER[layerName] ?? 4
  const layerId = generateLayerId(state)
  state.layerMap.set(layerName, layerId)
  state.layerOrderMap.set(layerName, order)
  return layerId
}

function calculateSpecificity(selector: ParsedSelector): number {
  const classCount = selector.className.split(":").length * 10
  const pseudoCount = selector.pseudoClasses.length * 10
  const mediaCount = selector.mediaQuery ? 1000 : 0
  return classCount + pseudoCount + mediaCount
}

function parseSelector(selectorText: string): ParsedSelector {
  const mediaMatch = selectorText.match(/^@media[^{]+\{(.+)$/)
  const mediaQuery = mediaMatch ? mediaMatch[0] : null
  const baseClassRaw = mediaMatch ? mediaMatch[1].trim() : selectorText
  const baseClassNoDot = baseClassRaw.startsWith(".") ? baseClassRaw.slice(1) : baseClassRaw
  const escapedColon = /\\:/g
  const baseClassClean = baseClassNoDot.replace(escapedColon, "\x00")
  // biome-ignore lint/suspicious/noControlCharactersInRegex: null byte used as temporary placeholder
  const baseClass = baseClassClean.split(":")[0].replace(/\x00/g, ":")

  const parts = baseClassClean.split(":")
  const variants: string[] = []
  const pseudoClasses: string[] = []

  const variantRegex =
    /^(hover|focus|active|visited|checked|disabled|required|optional|first|last|odd|even|before|after|placeholder|file|selection|backdrop|group|peer)/i
  const pseudoRegex = /^:([a-zA-Z-]+)$/

  for (const [index, part] of parts.entries()) {
    if (index === 0) continue

    if (variantRegex.test(part)) {
      variants.push(part)
    } else if (pseudoRegex.test(`:${part}`)) {
      pseudoClasses.push(`:${part}`)
    } else {
      variants.push(part)
    }
  }

  return {
    className: baseClass,
    variants,
    pseudoClasses,
    mediaQuery,
  }
}

function parseDeclaration(
  block: string
): Array<{ property: string; value: string; important: boolean }> {
  const declarations: Array<{ property: string; value: string; important: boolean }> = []

  const propertyRegex = /([a-zA-Z-]+)\s*:\s*([^;!]+)(!important)?/g

  // Use for...of + matchAll instead of while loop with let match
  for (const match of block.matchAll(propertyRegex)) {
    const property = match[1].trim()
    const value = match[2].trim()
    const important = match[3] !== undefined

    declarations.push({ property, value, important })
  }

  return declarations
}

function parseRules(css: string): ParsedRule[] {
  const rules: ParsedRule[] = []

  const ruleRegex = /([^{}]+)\s*\{([^{}]*)\}/g

  // Use for...of + matchAll instead of while loop with let match
  for (const match of css.matchAll(ruleRegex)) {
    const selectorText = match[1].trim()
    const declarationBlock = match[2].trim()

    if (selectorText.startsWith("@")) {
      continue
    }

    const parsedSelector = parseSelector(selectorText)
    const declarations = parseDeclaration(declarationBlock)

    for (const decl of declarations) {
      rules.push({
        selector: parsedSelector,
        property: decl.property,
        value: decl.value,
        important: decl.important,
      })
    }
  }

  return rules
}

function detectLayerFromSelector(className: string): string | null {
  const layerPrefixes = ["tw-", "tailwind-"]

  for (const prefix of layerPrefixes) {
    if (className.startsWith(prefix)) {
      return "tailwind"
    }
  }

  return null
}

export function parseCssToIr(
  css: string,
  options: ParseCssToIrOptions = {}
): { rules: RuleIR[]; classToRuleIds: Map<string, RuleId[]> } {
  const state = createGeneratorState()

  const prefix = options.prefix ?? ""
  const rules: RuleIR[] = []
  const classToRuleIds: Map<string, RuleId[]> = new Map()

  const parsedRules = parseRules(css)

  for (const parsedRule of parsedRules) {
    const className = prefix + parsedRule.selector.className
    const specificity = calculateSpecificity(parsedRule.selector)

    const layerName = detectLayerFromSelector(className)
    const layer = layerName ? getOrCreateLayerId(state, layerName) : null
    const layerOrder = layerName ? (state.layerOrderMap.get(layerName) ?? 4) : 4

    const selectorId = generateSelectorId(state)
    const propertyId = generatePropertyId(state, parsedRule.property)
    const valueId = generateValueId(state, parsedRule.value)

    const hasMediaQuery = parsedRule.selector.mediaQuery
    const conditionId = hasMediaQuery ? generateConditionId(state) : null
    const conditionResult = hasMediaQuery ? ConditionResult.Unknown : ConditionResult.Unknown

    const fingerprint = createFingerprint([className, parsedRule.property, parsedRule.value])

    const ruleId = generateRuleId(state)

    const rule: RuleIR = {
      id: ruleId,
      selector: selectorId,
      variantChain: new VariantChainId(0),
      property: propertyId,
      value: valueId,
      origin: Origin.AuthorNormal,
      importance: parsedRule.important ? Importance.Important : Importance.Normal,
      layer,
      layerOrder,
      specificity,
      condition: conditionId,
      conditionResult,
      insertionOrder: getNextInsertionOrder(state),
      fingerprint,
      source: {
        file: "",
        line: 1,
        column: 1,
      },
    }

    rules.push(rule)

    const existingRuleIds = classToRuleIds.get(className) || []
    existingRuleIds.push(ruleId)
    classToRuleIds.set(className, existingRuleIds)
  }

  return { rules, classToRuleIds }
}
