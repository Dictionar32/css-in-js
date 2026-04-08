export interface ClassAttributeMatch {
  value: string
  valueStartCol: number
  valueEndCol: number
}

export interface TokenBounds {
  token: string
  startCol: number
  endCol: number
}

const CLASS_ATTR_REGEX = /class(?:Name)?\s*=\s*["'`]([^"'`]*)["'`]/g

export function findClassAttributesInLine(line: string): ClassAttributeMatch[] {
  const result: ClassAttributeMatch[] = []
  for (const match of line.matchAll(CLASS_ATTR_REGEX)) {
    const rawMatch = match[0]
    const classValue = match[1] ?? ""
    const valueOffsetInMatch = rawMatch.indexOf(classValue)
    if (valueOffsetInMatch < 0 || match.index === undefined) {
      continue
    }
    const valueStartCol = match.index + valueOffsetInMatch
    result.push({
      value: classValue,
      valueStartCol,
      valueEndCol: valueStartCol + classValue.length,
    })
  }
  return result
}

export function findTokenAtColumn(value: string, relativeCol: number): TokenBounds | null {
  const tokens = value.split(/\s+/).filter(Boolean)
  let cursor = 0
  for (const token of tokens) {
    const tokenStart = value.indexOf(token, cursor)
    const tokenEnd = tokenStart + token.length
    cursor = tokenEnd
    if (relativeCol >= tokenStart && relativeCol <= tokenEnd) {
      return { token, startCol: tokenStart, endCol: tokenEnd }
    }
  }
  return null
}

export function rewriteClassValue(value: string, rewriter: (tokens: string[]) => string[]): string {
  const tokens = value.split(/\s+/).filter(Boolean)
  const next = rewriter(tokens)
  return next.join(" ")
}
