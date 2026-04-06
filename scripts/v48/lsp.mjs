#!/usr/bin/env node
/**
 * tw lsp - Language Server Protocol server for tailwind-styled.
 *
 * Features:
 * - Hover and completion for known classes
 * - Diagnostics for unknown classes
 * - Basic go-to-definition, rename, and code actions
 */

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("Usage: tw lsp [--stdio]")
  console.log("Run with --stdio to start the LSP transport.")
  process.exit(0)
}

const wantsStdio = process.argv.includes("--stdio") || process.argv.includes("--node-ipc")
if (!wantsStdio) {
  console.log("tw lsp: stub mode (pass --stdio to run full LSP server)")
  process.exit(0)
}

let lsp
let lspTextDocument
try {
  lsp = await import("vscode-languageserver/node.js")
  lspTextDocument = await import("vscode-languageserver-textdocument")
} catch {
  console.error("[tw lsp] Missing dependency: vscode-languageserver")
  console.error(
    "[tw lsp] Install with: npm install vscode-languageserver vscode-languageserver-textdocument"
  )

  if (!process.stdin.isTTY) {
    console.log("tw lsp: stub mode (no deps)")
    process.exit(0)
  }

  console.log("tw lsp: running in stub mode (install deps for full support)")
  process.stdin.resume()
  process.on("SIGTERM", () => process.exit(0))
  process.on("SIGINT", () => process.exit(0))
  setInterval(() => {}, 60_000)
}

const {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  TextDocumentSyncKind,
  CompletionItemKind,
  DiagnosticSeverity,
  CodeActionKind,
} = lsp
const { TextDocument } = lspTextDocument

const COMMON_CLASSES = [
  "flex",
  "grid",
  "block",
  "inline-block",
  "hidden",
  "relative",
  "absolute",
  "fixed",
  "sticky",
  "w-full",
  "h-full",
  "p-2",
  "p-4",
  "m-2",
  "m-4",
  "text-sm",
  "text-base",
  "text-lg",
  "font-medium",
  "font-semibold",
  "font-bold",
  "bg-blue-500",
  "bg-green-500",
  "bg-red-500",
  "text-white",
  "rounded",
  "rounded-md",
  "shadow",
  "hover:opacity-75",
  "focus:outline-none",
  "focus:ring-2",
  "dark:bg-gray-900",
  "dark:text-white",
]

const classSet = new Set(COMMON_CLASSES)

function readWordAtPosition(doc, position) {
  const text = doc.getText()
  const offset = doc.offsetAt(position)
  let start = offset
  let end = offset

  while (start > 0 && /[a-zA-Z0-9_:/-]/.test(text[start - 1])) start--
  while (end < text.length && /[a-zA-Z0-9_:/-]/.test(text[end])) end++

  const word = text.slice(start, end)
  if (!word) return null

  return {
    word,
    range: {
      start: doc.positionAt(start),
      end: doc.positionAt(end),
    },
  }
}

function validateDocument(doc) {
  const diagnostics = []
  const text = doc.getText()
  const re = /class(?:Name)?\s*=\s*["'`]([^"'`]+)["'`]/g

  for (const match of text.matchAll(re)) {
    const fullClassAttr = match[1] ?? ""
    const classStartInDoc = (match.index ?? 0) + match[0].indexOf(fullClassAttr)
    const classes = fullClassAttr.split(/\s+/).filter(Boolean)

    let cursor = classStartInDoc
    for (const cls of classes) {
      const idx = text.indexOf(cls, cursor)
      if (idx >= 0) {
        cursor = idx + cls.length
      }

      const base = cls.replace(/^(?:[a-z]+:)+/, "")
      if (base && !classSet.has(cls) && !classSet.has(base)) {
        diagnostics.push({
          severity: DiagnosticSeverity.Information,
          range: {
            start: doc.positionAt(idx >= 0 ? idx : classStartInDoc),
            end: doc.positionAt((idx >= 0 ? idx : classStartInDoc) + cls.length),
          },
          message: `'${cls}' - not in known Tailwind classes (may be custom or dynamic)`,
          source: "tailwind-styled",
        })
      }
    }
  }

  return diagnostics
}

const connection = createConnection(ProposedFeatures.all)
const documents = new TextDocuments(TextDocument)

connection.onInitialize(() => {
  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      completionProvider: {
        resolveProvider: false,
        triggerCharacters: ['"', "'", "`", " "],
      },
      hoverProvider: true,
      definitionProvider: true,
      renameProvider: true,
      codeActionProvider: true,
    },
    serverInfo: { name: "tailwind-styled-lsp", version: "5.0.4" },
  }
})

connection.onCompletion((params) => {
  const doc = documents.get(params.textDocument.uri)
  if (!doc) return []

  const text = doc.getText()
  const offset = doc.offsetAt(params.position)
  const before = text.slice(0, offset)
  const classMatch = before.match(/class(?:Name)?\s*=\s*["'`]([^"'`]*)$/)
  if (!classMatch) return []

  const partial = classMatch[1].split(/\s+/).pop() ?? ""
  return COMMON_CLASSES.filter((name) => name.startsWith(partial)).slice(0, 100).map((name) => ({
    label: name,
    kind: CompletionItemKind.Value,
    detail: "Tailwind CSS class",
    insertText: name,
  }))
})

connection.onHover((params) => {
  const doc = documents.get(params.textDocument.uri)
  if (!doc) return null

  const token = readWordAtPosition(doc, params.position)
  if (!token) return null

  if (!classSet.has(token.word)) return null

  return {
    contents: {
      kind: "markdown",
      value: `**${token.word}** - Tailwind CSS class`,
    },
  }
})

connection.onDefinition((params) => {
  const doc = documents.get(params.textDocument.uri)
  if (!doc) return null

  const token = readWordAtPosition(doc, params.position)
  if (!token) return null

  const text = doc.getText()
  const firstIndex = text.indexOf(token.word)
  if (firstIndex < 0) return null

  return {
    uri: params.textDocument.uri,
    range: {
      start: doc.positionAt(firstIndex),
      end: doc.positionAt(firstIndex + token.word.length),
    },
  }
})

connection.onRenameRequest((params) => {
  const doc = documents.get(params.textDocument.uri)
  if (!doc) return null

  const token = readWordAtPosition(doc, params.position)
  if (!token) return null

  const escaped = token.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const re = new RegExp(`(?<![a-zA-Z0-9_:/-])${escaped}(?![a-zA-Z0-9_:/-])`, "g")
  const text = doc.getText()
  const edits = []

  for (const match of text.matchAll(re)) {
    const matchIndex = match.index
    if (typeof matchIndex !== "number") continue

    edits.push({
      range: {
        start: doc.positionAt(matchIndex),
        end: doc.positionAt(matchIndex + token.word.length),
      },
      newText: params.newName,
    })
  }

  if (edits.length === 0) return null

  return {
    changes: {
      [params.textDocument.uri]: edits,
    },
  }
})

connection.onCodeAction((params) => {
  const actions = []

  for (const diagnostic of params.context.diagnostics) {
    const message = String(diagnostic.message ?? "")
    if (!message.includes("not in known Tailwind classes")) continue

    const unknownClass = message.match(/'([^']+)'/)?.[1]
    if (!unknownClass) continue

    actions.push({
      title: `Remove unknown class '${unknownClass}'`,
      kind: CodeActionKind.QuickFix,
      diagnostics: [diagnostic],
      edit: {
        changes: {
          [params.textDocument.uri]: [
            {
              range: diagnostic.range,
              newText: "",
            },
          ],
        },
      },
    })
  }

  return actions
})

documents.onDidChangeContent((change) => {
  const diagnostics = validateDocument(change.document)
  connection.sendDiagnostics({ uri: change.document.uri, diagnostics })
})

documents.listen(connection)
connection.listen()

console.error("[tw lsp] tailwind-styled LSP server running on stdio")