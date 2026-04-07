import * as vscode from "vscode"
import { findClassAttributesInLine, findTokenAtColumn, rewriteClassValue } from "./classTokenCore"

export interface ClassTokenContext {
  token: string
  tokenRange: vscode.Range
  valueRange: vscode.Range
  value: string
}

export { findClassAttributesInLine, findTokenAtColumn, rewriteClassValue } from "./classTokenCore"

export function getClassTokenContext(
  document: vscode.TextDocument,
  position: vscode.Position
): ClassTokenContext | null {
  const line = document.lineAt(position.line).text

  for (const attr of findClassAttributesInLine(line)) {
    const valueRange = new vscode.Range(
      new vscode.Position(position.line, attr.valueStartCol),
      new vscode.Position(position.line, attr.valueEndCol)
    )

    if (!valueRange.contains(position)) {
      continue
    }

    const tokenMatch = findTokenAtColumn(attr.value, position.character - attr.valueStartCol)
    if (tokenMatch) {
      const tokenRange = new vscode.Range(
        new vscode.Position(position.line, attr.valueStartCol + tokenMatch.startCol),
        new vscode.Position(position.line, attr.valueStartCol + tokenMatch.endCol)
      )
      return {
        token: tokenMatch.token,
        tokenRange,
        valueRange,
        value: attr.value,
      }
    }
  }

  return null
}
