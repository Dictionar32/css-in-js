#!/usr/bin/env node
/**
 * tw cache <enable|disable|status>
 * Remote cache configuration helper (S3/Redis).
 */
import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'

const cmd = process.argv[2]
const mode = process.argv[3]
const rawArgs = (cmd === 'enable' || cmd === 'disable') ? process.argv.slice(4) : process.argv.slice(3)
const argMap = new Map(
  rawArgs
    .filter((a) => a.startsWith('--'))
    .map((a) => {
      const [k, ...rest] = a.replace(/^--/, '').split('=')
      return [k, rest.length ? rest.join('=') : 'true']
    })
)

const CACHE_DIR = path.join(process.cwd(), '.tw-cache')
const CACHE_CONFIG_FILE = path.join(CACHE_DIR, 'config.json')

function usage() {
  console.log('Usage: tw cache <enable|disable|status>')
  console.log('  tw cache enable remote --provider=s3 --url=s3://bucket/path')
  console.log('  tw cache enable remote --provider=redis --url=redis://localhost:6379')
  console.log('  tw cache disable remote')
  console.log('  tw cache status')
  console.log('  tw cache doctor')
  console.log('  tw cache export [--format=env|json]')
  console.log('  tw cache push remote [--from=.tw-cache/cache-data.json]')
  console.log('  tw cache pull remote [--out=.tw-cache/cache-data.json]')
}

function readConfig() {
  if (!fs.existsSync(CACHE_CONFIG_FILE)) {
    return { version: 1, local: { enabled: true, dir: '.tw-cache' }, remote: { enabled: false } }
  }
  try {
    return JSON.parse(fs.readFileSync(CACHE_CONFIG_FILE, 'utf8'))
  } catch {
    return { version: 1, local: { enabled: true, dir: '.tw-cache' }, remote: { enabled: false } }
  }
}

function writeConfig(config) {
  fs.mkdirSync(CACHE_DIR, { recursive: true })
  fs.writeFileSync(CACHE_CONFIG_FILE, JSON.stringify(config, null, 2) + '\n')
}

function ensureValidProvider(provider) {
  return provider === 's3' || provider === 'redis'
}

function getRemoteStorePath(config) {
  const remote = config?.remote ?? {}
  const provider = remote.provider ?? 'unknown'
  const url = remote.url ?? 'none'
  const hash = createHash('sha1').update(`${provider}:${url}`).digest('hex')
  return path.join(CACHE_DIR, 'remote-store', `${provider}-${hash}.json`)
}

function validateRemoteConfig(config) {
  const remote = config?.remote ?? {}
  if (!remote.enabled) {
    return { ok: true, detail: 'remote cache disabled' }
  }
  if (!ensureValidProvider(remote.provider)) {
    return { ok: false, detail: `invalid provider: ${String(remote.provider)}` }
  }
  if (typeof remote.url !== 'string' || remote.url.length === 0) {
    return { ok: false, detail: 'missing remote url' }
  }
  if (remote.provider === 's3' && !remote.url.startsWith('s3://')) {
    return { ok: false, detail: 's3 provider requires s3:// URL' }
  }
  if (remote.provider === 'redis' && !remote.url.startsWith('redis://')) {
    return { ok: false, detail: 'redis provider requires redis:// URL' }
  }
  return { ok: true, detail: `${remote.provider} -> ${remote.url}` }
}

if (!cmd) {
  usage()
  process.exit(1)
}

if (cmd === 'status') {
  const config = readConfig()
  console.log(JSON.stringify(config, null, 2))
  process.exit(0)
}

if (cmd === 'doctor') {
  const config = readConfig()
  const validation = validateRemoteConfig(config)
  if (!validation.ok) {
    console.error(`[cache] doctor failed: ${validation.detail}`)
    process.exit(1)
  }
  console.log(`[cache] doctor ok: ${validation.detail}`)
  process.exit(0)
}

if (cmd === 'export') {
  const format = argMap.get('format') || 'env'
  const config = readConfig()
  const remote = config?.remote ?? { enabled: false }

  if (format === 'json') {
    console.log(JSON.stringify({ remote }, null, 2))
    process.exit(0)
  }

  if (format !== 'env') {
    console.error('Unsupported --format. Use env|json')
    process.exit(1)
  }

  console.log(`TW_CACHE_REMOTE_ENABLED=${remote.enabled ? '1' : '0'}`)
  console.log(`TW_CACHE_REMOTE_PROVIDER=${remote.provider ?? ''}`)
  console.log(`TW_CACHE_REMOTE_URL=${remote.url ?? ''}`)
  process.exit(0)
}

if (cmd === 'push') {
  if (mode !== 'remote') {
    usage()
    process.exit(1)
  }
  const config = readConfig()
  const validation = validateRemoteConfig(config)
  if (!validation.ok) {
    console.error(`[cache] push failed: ${validation.detail}`)
    process.exit(1)
  }

  const fromArg = argMap.get('from')
  const fromPath = path.resolve(process.cwd(), fromArg && fromArg !== 'true' ? fromArg : '.tw-cache/cache-data.json')
  if (!fs.existsSync(fromPath)) {
    console.error(`[cache] push failed: source file not found: ${fromPath}`)
    process.exit(1)
  }

  let payload
  try {
    payload = JSON.parse(fs.readFileSync(fromPath, 'utf8'))
  } catch {
    console.error(`[cache] push failed: invalid JSON in ${fromPath}`)
    process.exit(1)
  }

  const remotePath = getRemoteStorePath(config)
  fs.mkdirSync(path.dirname(remotePath), { recursive: true })
  fs.writeFileSync(
    remotePath,
    JSON.stringify(
      {
        pushedAt: new Date().toISOString(),
        remote: config.remote,
        payload,
      },
      null,
      2
    ) + '\n'
  )
  console.log(`[cache] Remote payload updated -> ${remotePath}`)
  process.exit(0)
}

if (cmd === 'pull') {
  if (mode !== 'remote') {
    usage()
    process.exit(1)
  }
  const config = readConfig()
  const validation = validateRemoteConfig(config)
  if (!validation.ok) {
    console.error(`[cache] pull failed: ${validation.detail}`)
    process.exit(1)
  }

  const remotePath = getRemoteStorePath(config)
  if (!fs.existsSync(remotePath)) {
    console.error(`[cache] pull failed: remote payload not found: ${remotePath}`)
    process.exit(1)
  }

  const outArg = argMap.get('out')
  const outPath = path.resolve(process.cwd(), outArg && outArg !== 'true' ? outArg : '.tw-cache/cache-data.json')
  const remotePayload = JSON.parse(fs.readFileSync(remotePath, 'utf8'))
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, JSON.stringify(remotePayload.payload ?? {}, null, 2) + '\n')
  console.log(`[cache] Remote payload pulled -> ${outPath}`)
  process.exit(0)
}

if (cmd === 'enable') {
  if (mode !== 'remote') {
    usage()
    process.exit(1)
  }

  const provider = argMap.get('provider')
  const url = argMap.get('url')
  if (!provider || !url || provider === 'true' || url === 'true') {
    console.error('Missing required flags: --provider and --url')
    process.exit(1)
  }

  if (!ensureValidProvider(provider)) {
    console.error('Unsupported provider. Use --provider=s3|redis')
    process.exit(1)
  }

  const config = readConfig()
  config.remote = {
    enabled: true,
    provider,
    url,
    updatedAt: new Date().toISOString(),
  }
  writeConfig(config)
  console.log(`[cache] Remote cache enabled (${provider}) -> ${url}`)
  process.exit(0)
}

if (cmd === 'disable') {
  if (mode !== 'remote') {
    usage()
    process.exit(1)
  }
  const config = readConfig()
  config.remote = {
    enabled: false,
    updatedAt: new Date().toISOString(),
  }
  writeConfig(config)
  console.log('[cache] Remote cache disabled')
  process.exit(0)
}

usage()
process.exit(1)
