import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const repo = fileURLToPath(new URL('..', import.meta.url))
const lint = message => spawnSync(`${repo}node_modules/.bin/commitlint`, [], { cwd: repo, input: message, encoding: 'utf8' }).status

test('commit messages use the studio types: product, site', () => {
  for (const ok of ['product: Wesualizer 추가', 'product(heuri-code): 썸네일 교체', 'site: 다크 모드 버튼',
    'site: 첫 공개\n\n본문.\n\nCo-Authored-By: Someone <x@example.com>']) assert.equal(lint(ok), 0, ok)
  for (const bad of ['feat: something', 'post: 글', 'Initial commit', 'site:', 'Site: 대문자', `site: ${'가'.repeat(100)}`]) assert.equal(lint(bad), 1, bad)
})
