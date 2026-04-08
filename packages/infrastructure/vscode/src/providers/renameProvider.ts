import * as vscode from "vscode"
import { getClassTokenContext } from "./classToken"
import { RenameProviderError } from "./renameProviderError"

const SEARCH_GLOB = "**/*.{js,jsx,ts,tsx,vue,svelte}"
const EXCLUDE_GLOB = "**/{node_modules,dist,.next,coverage}/**"
const CLASS_ATTR_REGEX = /class(?:Name)?\s*=\s*["'`]([^"'`]*)["'`]/g

export function createRenameProvider(): vscode.RenameProvider {
  return {
    prepareRename(document, position) {
      const context = getClassTokenContext(document, position)
      if (!context) {
        throw new RenameProviderError(
          "RENAME_NOT_IN_CLASS_TOKEN",
          "Rename is only available on class tokens inside class/className attributes."
        )
      }
      return context.tokenRange
    },

    async provideRenameEdits(document, position, newName) {
      const context = getClassTokenContext(document, position)
      if (!context) {
        return null
      }

      const normalizedName = newName.trim()
      if (!normalizedName) {
        return null
      }

      const edit = new vscode.WorkspaceEdit()
      const files = await vscode.workspace.findFiles(SEARCH_GLOB, EXCLUDE_GLOB, 200)

      for (const uri of files) {
        const targetDoc = await vscode.workspace.openTextDocument(uri)
        for (let line = 0; line < targetDoc.lineCount; line++) {
          const lineText = targetDoc.lineAt(line).text
          for (const attrMatch of lineText.matchAll(CLASS_ATTR_REGEX)) {
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
              const range = new vscode.Range(
                new vscode.Position(line, valueStart + tokenStart),
                new vscode.Position(line, valueStart + tokenEnd)
              )
              edit.replace(uri, range, normalizedName)
            }
          }
        }
      }

      return edit
    },
  }
}
