#!/usr/bin/env node
/**
 * tw cluster build [root] [--workers=N] — Distributed build via worker_threads.
 * Each worker uses Rust compiler via runLoaderTransform.
 */
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads'
import { cpus } from 'node:os'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

if (!isMainThread) {
  // Worker: compile a batch of files via Rust-first pipeline
  const { files } = workerData
  let runLoaderTransform
  try {
    runLoaderTransform = require('@tailwind-styled/compiler').runLoaderTransform
  } catch {
    try {
      runLoaderTransform = require(
        path.resolve(__dirname, '../../packages/compiler/dist/index.cjs')
      ).runLoaderTransform
    } catch { parentPort.postMessage({ error: 'compiler unavailable' }); process.exit(1) }
  }

  const results = []
  for (const file of files) {
    try {
      const source = fs.readFileSync(file, 'utf8')
      const output = runLoaderTransform({
        filepath: file,
        source,
        options: { hoist: false, incremental: false },
      })
      if (output.changed) {
        results.push({ file, classes: output.classes.length, engine: output.engine })
      }
    } catch (e) {
      results.push({ file, error: e.message })
    }
  }
  parentPort.postMessage({ results })
  process.exit(0)
}

function usage() {
  console.log('Usage: tw cluster <build|init> [root] [--workers=N] [--remote=URL] [--token=TOKEN]')
}

function parseFlag(args, name) {
  const match = args.find((arg) => arg.startsWith(`--${name}=`))
  return match ? match.split("=")[1] : null
}

function collectFiles(root) {
  const discoveredFiles = []
  try {
    const scanner = require('@tailwind-styled/scanner')
    const result = scanner.scanWorkspace(root)
    return result.files.map((f) => f.file)
  } catch {
    try {
      const scanner = require(path.resolve(__dirname, '../../packages/scanner/dist/index.cjs'))
      return scanner.scanWorkspace(root).files.map((f) => f.file)
    } catch {
      const walk = (directory) => {
        for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
          if (entry.isDirectory() && !['node_modules', '.next', 'dist'].includes(entry.name)) {
            walk(path.join(directory, entry.name))
          } else if (/\.[jt]sx?$/.test(entry.name)) {
            discoveredFiles.push(path.join(directory, entry.name))
          }
        }
      }
      walk(root)
      return discoveredFiles
    }
  }
}

function runLocalBuild(files, nWorkers) {
  const t0 = Date.now()
  console.log(`[cluster] ${files.length} files, ${nWorkers} workers`)

  const batchSize = Math.ceil(files.length / Math.max(1, nWorkers))
  const batches = []
  for (let i = 0; i < files.length; i += batchSize) batches.push(files.slice(i, i + batchSize))

  let totalChanged = 0
  let totalClasses = 0
  let done = 0

  for (const batch of batches) {
    const worker = new Worker(fileURLToPath(import.meta.url), { workerData: { files: batch } })
    worker.on('message', msg => {
      if (msg.error) {
        console.error('[cluster] Worker error:', msg.error)
        return
      }
      for (const result of msg.results) {
        if (!result.error) {
          totalChanged++
          totalClasses += result.classes
        }
      }
      if (++done === batches.length) {
        const elapsed = ((Date.now() - t0) / 1000).toFixed(2)
        console.log(
          `[cluster] Done: ${totalChanged}/${files.length} files changed | ${totalClasses} total classes | ${elapsed}s`
        )
      }
    })
    worker.on('error', () => {
      if (++done === batches.length) {
        console.log('[cluster] Done (with errors)')
      }
    })
  }
}

async function runRemoteBuild(remote, token, files) {
  const remoteBase = remote.replace(/\/+$/u, "")
  const endpoint = `${remoteBase}/build`
  const headers = {
    "content-type": "application/json",
  }
  if (token) {
    headers.authorization = `Bearer ${token}`
  }

  const startedAt = Date.now()
  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({ files }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`remote cluster error (${response.status}): ${errorBody}`)
  }

  const payload = await response.json()

  const filesProcessed = Number(payload.filesProcessed ?? files.length)
  const totalClasses = Number(payload.totalClasses ?? 0)
  const durationMs = Number(payload.durationMs ?? Date.now() - startedAt)
  const seconds = Math.max(durationMs / 1000, 0.001)
  const throughput = Math.round(filesProcessed / seconds)

  console.log(
    `[cluster] Remote done: ${filesProcessed}/${files.length} files | ${totalClasses} total classes | ${durationMs}ms (${throughput} files/s)`
  )
}

// Main thread
const args = process.argv.slice(2)
const sub = args[0]
const positionals = args.slice(1).filter((arg) => !arg.startsWith("--"))
const rootArg = positionals[0] ?? '.'
const workersRaw = parseFlag(args, "workers")
const nWorkers = workersRaw ? parseInt(workersRaw, 10) : Math.max(1, cpus().length - 1)
const remote = parseFlag(args, "remote")
const token = parseFlag(args, "token")

if (sub === 'init') {
  console.log(`[cluster] initialized (${nWorkers} worker(s))`)
  process.exit(0)
}

if (sub !== 'build') {
  usage()
  process.exit(0)
}

const root = path.resolve(process.cwd(), rootArg)
if (!fs.existsSync(root)) {
  console.error(`Root not found: ${root}`)
  process.exit(1)
}

const files = collectFiles(root)

if (remote) {
  try {
    await runRemoteBuild(remote, token, files)
  } catch (error) {
    console.error(`[cluster] Remote build failed: ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  }
} else {
  runLocalBuild(files, nWorkers)
}
