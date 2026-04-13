import * as vscode from "vscode"
import { registerDoctorCommand } from "./commands/doctorCommand"
import { registerTraceCommand } from "./commands/traceCommand"
import { registerWhyCommand } from "./commands/whyCommand"
import { createCompletionProvider } from "./providers/completionProvider"
import { createHoverProvider } from "./providers/hoverProvider"
import { registerInlineDecorationProvider } from "./providers/inlineDecorationProvider"
import { EngineService } from "./services/engineService"

const SUPPORTED_LANGUAGES = [
  "javascript",
  "javascriptreact",
  "typescript",
  "typescriptreact",
  "vue",
  "svelte",
  "html",
]

export function activate(context: vscode.ExtensionContext) {
  console.log("Tailwind Styled VS Code extension is now active!")

  const config = vscode.workspace.getConfiguration("tailwindStyled")
  const enableTraceHover = config.get<boolean>("enableTraceHover", true)
  const enableAutocomplete = config.get<boolean>("enableAutocomplete", true)
  const enableInlineDecorations = config.get<boolean>("enableInlineDecorations", false)
  const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || ""

  const engineService = new EngineService(workspacePath)

  // Commands
  context.subscriptions.push(registerTraceCommand(engineService))
  context.subscriptions.push(registerWhyCommand(engineService))
  context.subscriptions.push(registerDoctorCommand(engineService))

  // Hover provider — pakai providers/hoverProvider.ts yang terhubung ke engineService
  if (enableTraceHover) {
    const hoverProvider = createHoverProvider(engineService)
    context.subscriptions.push(
      vscode.languages.registerHoverProvider(SUPPORTED_LANGUAGES, hoverProvider)
    )
  }

  // Completion provider — pakai providers/completionProvider.ts yang terhubung ke engineService
  if (enableAutocomplete) {
    const completionProvider = createCompletionProvider(engineService)
    context.subscriptions.push(
      vscode.languages.registerCompletionItemProvider(
        SUPPORTED_LANGUAGES,
        completionProvider,
        '"',
        "'",
        " ",
        ":"
      )
    )
  }

  // Inline decoration provider (opt-in, default off untuk performa)
  if (enableInlineDecorations) {
    const disposable = registerInlineDecorationProvider(context, engineService)
    context.subscriptions.push(disposable)
  }

  // Auto-scan workspace saat extension aktif jika scan cache belum ada
  autoScanIfNeeded(workspacePath)
}

export function deactivate() {}

/**
 * Jalankan `tw scan --save` otomatis jika .tailwind-styled/scan-cache.json belum ada.
 * Ini memastikan hover/completion bekerja tanpa user perlu jalankan manual.
 */
async function autoScanIfNeeded(workspacePath: string): Promise<void> {
  if (!workspacePath) return
  const fs = await import("node:fs")
  const path = await import("node:path")
  const cachePath = path.join(workspacePath, ".tailwind-styled", "scan-cache.json")
  if (fs.existsSync(cachePath)) return

  const { exec } = await import("node:child_process")
  const cwd = workspacePath

  // Coba jalankan `tw scan --save` di background
  const proc = exec("npx tw scan --save", { cwd, timeout: 30_000 })
  proc.on("error", () => {
    // Silent fail — user bisa jalankan manual
  })
}
