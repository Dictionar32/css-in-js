import * as vscode from "vscode"
import { getClassTokenContext, rewriteClassValue } from "./classToken"

export function createCodeActionProvider(): vscode.CodeActionProvider {
  return {
    provideCodeActions(document, range) {
      const context = getClassTokenContext(document, range.start)
      if (!context) {
        return []
      }

      const removeDuplicate = new vscode.CodeAction(
        "Tailwind Styled: Remove duplicate classes",
        vscode.CodeActionKind.QuickFix
      )
      removeDuplicate.edit = new vscode.WorkspaceEdit()
      removeDuplicate.edit.replace(
        document.uri,
        context.valueRange,
        rewriteClassValue(context.value, (tokens) => [...new Set(tokens)])
      )

      const sortClasses = new vscode.CodeAction(
        "Tailwind Styled: Sort classes",
        vscode.CodeActionKind.QuickFix
      )
      sortClasses.edit = new vscode.WorkspaceEdit()
      sortClasses.edit.replace(
        document.uri,
        context.valueRange,
        rewriteClassValue(context.value, (tokens) => [...tokens].sort())
      )

      return [removeDuplicate, sortClasses]
    },
  }
}
