import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const script = path.resolve(process.cwd(), 'scripts/v45/cache.mjs')
const scriptTs = path.resolve(process.cwd(), 'scripts/v45/cache.ts')
const tsxBin = path.resolve(process.cwd(), 'node_modules/.bin/tsx')

function run(args, cwd) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd,
    encoding: 'utf8',
  })
}

function runTs(args, cwd) {
  return spawnSync(tsxBin, [scriptTs, ...args], {
    cwd,
    encoding: 'utf8',
  })
}

test('cache helper enable/doctor/export/disable flow', () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'tws-cache-'))

  let res = run(['enable', 'remote', '--provider=s3', '--url=s3://bucket/key'], cwd)
  assert.equal(res.status, 0)
  assert.match(res.stdout, /Remote cache enabled/)

  res = run(['doctor'], cwd)
  assert.equal(res.status, 0)
  assert.match(res.stdout, /doctor ok/)

  res = run(['export', '--format=env'], cwd)
  assert.equal(res.status, 0)
  assert.match(res.stdout, /TW_CACHE_REMOTE_ENABLED=1/)

  res = run(['disable', 'remote'], cwd)
  assert.equal(res.status, 0)

  res = run(['doctor'], cwd)
  assert.equal(res.status, 0)
  assert.match(res.stdout, /remote cache disabled/)
})

test('cache helper export json uses json format', () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'tws-cache-'))
  const res = run(['export', '--format=json'], cwd)
  assert.equal(res.status, 0)
  const parsed = JSON.parse(res.stdout)
  assert.equal(typeof parsed, 'object')
  assert.ok(parsed.remote)
})

test('cache helper rejects unsupported provider', () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'tws-cache-'))
  const res = run(['enable', 'remote', '--provider=memcached', '--url=mem://demo'], cwd)
  assert.notEqual(res.status, 0)
  assert.match(res.stderr, /Unsupported provider/)
})

test('cache helper validates redis URL scheme', () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'tws-cache-'))

  let res = run(['enable', 'remote', '--provider=redis', '--url=http://localhost:6379'], cwd)
  assert.equal(res.status, 0)

  res = run(['doctor'], cwd)
  assert.notEqual(res.status, 0)
  assert.match(res.stderr, /redis provider requires redis:\/\//)

  res = run(['enable', 'remote', '--provider=redis', '--url=redis://localhost:6379'], cwd)
  assert.equal(res.status, 0)

  res = run(['doctor'], cwd)
  assert.equal(res.status, 0)
  assert.match(res.stdout, /doctor ok/)
})

test('cache helper ts entrypoint parity (export json)', () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'tws-cache-'))
  const res = runTs(['export', '--format=json'], cwd)
  assert.equal(res.status, 0)
  const parsed = JSON.parse(res.stdout)
  assert.equal(typeof parsed, 'object')
  assert.ok(parsed.remote)
})

test('cache helper push/pull remote roundtrip', () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'tws-cache-'))

  let res = run(['enable', 'remote', '--provider=s3', '--url=s3://bucket/cache'], cwd)
  assert.equal(res.status, 0)

  const source = path.join(cwd, 'cache-source.json')
  fs.writeFileSync(source, JSON.stringify({ entries: [{ key: 'a', value: 1 }] }))

  res = run(['push', 'remote', `--from=${source}`], cwd)
  assert.equal(res.status, 0)
  assert.match(res.stdout, /Remote payload updated/)

  const output = path.join(cwd, 'cache-out.json')
  res = run(['pull', 'remote', `--out=${output}`], cwd)
  assert.equal(res.status, 0)
  assert.match(res.stdout, /Remote payload pulled/)

  const pulled = JSON.parse(fs.readFileSync(output, 'utf8'))
  assert.deepEqual(pulled, { entries: [{ key: 'a', value: 1 }] })
})
