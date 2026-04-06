import * as vscode from "vscode"
import { registerDoctorCommand } from "./commands/doctorCommand"
import { registerTraceCommand } from "./commands/traceCommand"
import { registerWhyCommand } from "./commands/whyCommand"
import { createCompletionProvider } from "./providers/completionProvider"
import { createHoverProvider } from "./providers/hoverProvider"
import { createInlineDecorationProvider } from "./providers/inlineDecorationProvider"
import { EngineService } from "./services/engineService"

export function activate(context: vscode.ExtensionContext) {
  console.log("Tailwind Styled VS Code extension is now active!")

  const config = vscode.workspace.getConfiguration("tailwindStyled")
  const enableTraceHover = config.get<boolean>("enableTraceHover", true)
  const enableAutocomplete = config.get<boolean>("enableAutocomplete", true)
  const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || ""
  const engineService = new EngineService(workspacePath)

  context.subscriptions.push(registerTraceCommand(engineService))
  context.subscriptions.push(registerWhyCommand(engineService))
  context.subscriptions.push(registerDoctorCommand(engineService))

  const languageSelector: vscode.DocumentSelector = [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact",
    "vue",
    "svelte",
  ]

  if (enableTraceHover) {
    const hoverProvider = createHoverProvider(engineService)
    context.subscriptions.push(
      vscode.languages.registerHoverProvider(
        languageSelector,
        hoverProvider
      )
    )
  }

  if (enableAutocomplete) {
    const completionProvider = createCompletionProvider(engineService)
    context.subscriptions.push(
      vscode.languages.registerCompletionItemProvider(
        languageSelector,
        completionProvider,
        '"',
        "'",
        " "
      )
    )
  }

  context.subscriptions.push(...createInlineDecorationProvider(engineService))
}

export function deactivate() {}
