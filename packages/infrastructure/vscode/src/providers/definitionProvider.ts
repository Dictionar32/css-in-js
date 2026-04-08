import * as vscode from "vscode"
import { getClassTokenContext } from "./classToken"

const SEARCH_GLOB = "**/*.{js,jsx,ts,tsx,vue,svelte}"
const EXCLUDE_GLOB = "**/{node_modules,dist,.next,coverage}/**"
const CLASS_ATTR_REGEX = /class(?:Name)?\s*=\s*["'`]([^"'`]*)["'`]/g

export function createDefinitionProvider(): vscode.DefinitionProvider {
  return {
    async provideDefinition(document, position) {
      const context = getClassTokenContext(document, position)
      if (!context) {
        return null
      }

      const files = await vscode.workspace.findFiles(SEARCH_GLOB, EXCLUDE_GLOB, 200)
      const locations: vscode.Location[] = []

      for (const uri of files) {
        const targetDoc = await vscode.workspace.openTextDocument(uri)

        for (let line = 0; line < targetDoc.lineCount; line++) {
          const text = targetDoc.lineAt(line).text
          for (const attrMatch of text.matchAll(CLASS_ATTR_REGEX)) {
            const classValue = attrMatch[1] ?? ""
            const rawMatch = attrMatch[0]
            const valueOffsetInMatch = rawMatch.indexOf(classValue)
            if (valueOffsetInMatch < 0 || attrMatch.index === undefined) {
              continue
            }
            const valueStart = attrMatch.index + valueOffsetInMatch
            let cursor = 0
            for (const token of classValue.split(/\s+/).filter(Boolean)) {
              const tokenStart = classValue.indexOf(token, cursor)
              const tokenEnd = tokenStart + token.length
              cursor = tokenEnd
              if (token !== context.token) {
                continue
              }
              const start = new vscode.Position(line, valueStart + tokenStart)
              const end = new vscode.Position(line, valueStart + tokenEnd)
              locations.push(new vscode.Location(uri, new vscode.Range(start, end)))
            }
          }
        }
      }

      return locations.length > 0 ? locations : null
    },
  }
}
