import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const script = path.resolve(process.cwd(), 'scripts/v45/sync.mjs')

function run(args, cwd) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd,
    encoding: 'utf8',
  })
}

test('sync helper init -> pull(local) -> push(css)', () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'tws-sync-'))

  let res = run(['init'], cwd)
  assert.equal(res.status, 0)
  assert.ok(fs.existsSync(path.join(cwd, 'tokens.sync.json')))

  const sourcePath = path.join(cwd, 'incoming.json')
  fs.writeFileSync(
    sourcePath,
    JSON.stringify({
      tokens: {
        color: { accent: { $value: '#ff00aa', $type: 'color' } },
      },
    })
  )

  res = run(['pull', `--from=${sourcePath}`], cwd)
  assert.equal(res.status, 0)
  assert.match(res.stdout, /Pulled tokens/)

  const outCss = path.join(cwd, 'tokens.css')
  res = run(['push', '--to=css', `--out=${outCss}`], cwd)
  assert.equal(res.status, 0)
  const css = fs.readFileSync(outCss, 'utf8')
  assert.match(css, /--color-accent:\s*#ff00aa;/)
})
