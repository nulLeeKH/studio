import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { build, parseProduct, render, site } from '../build.mjs'

const fixture = products => {
  const root = mkdtempSync(join(tmpdir(), 'studio-'))
  mkdirSync(join(root, 'static'))
  writeFileSync(join(root, 'static', 'style.css'), '')
  for (const [folder, md, image] of products) {
    mkdirSync(join(root, 'products', folder), { recursive: true })
    writeFileSync(join(root, 'products', folder, 'index.md'), md)
    if (image) writeFileSync(join(root, 'products', folder, image), 'png')
  }
  return root
}

test('front-matter fields', () => {
  const p = parseProduct('---\nname: "A & B"\nurl: https://a.example/x\nsummary_ko: 한 줄\nsummary_en: One line\n---\n', 'x')
  assert.deepEqual(p, { name: 'A & B', url: 'https://a.example/x', summary_ko: '한 줄', summary_en: 'One line' })
})

test('bad input names the file', () => {
  assert.throws(() => parseProduct('name: x', 'p/index.md'), /p\/index\.md: front-matter/)
  assert.throws(() => parseProduct('---\nsummary_ko: x\n---\n', 'p'), /name is required/)
  assert.throws(() => parseProduct('---\nname: x\ntitle: y\n---\n', 'p'), /unknown line "title: y"/)
  assert.throws(() => parseProduct('---\nname: x\nurl: javascript:alert(1)\n---\n', 'p'), /url must start with http/)
  assert.throws(() => parseProduct('---\nname: x\n---\n긴 설명', 'p'), /one line in summary_ko/)
  assert.throws(() => parseProduct('---\nname: x\nsummary_ko: 한 줄\n---\n', 'p'), /summary_ko and summary_en go together/)
  assert.throws(() => parseProduct('---\nname: x\nimage: a.png\n---\n', 'p'), /unknown line "image: a.png"/)
})

test('products in folder order, escaped, linked, with the studio footer', () => {
  const root = fixture([
    ['02-b', '---\nname: B\n---\n', null],
    ['01-a', '---\nname: <A>\nurl: https://a.example\n---\n', 'thumbnail.png'],
  ])
  const out = join(root, 'dist')
  build(root, out)
  const html = readFileSync(join(out, 'index.html'), 'utf8')
  assert.ok(html.indexOf('&#60;A&#62;') < html.indexOf('<h3>B</h3>'))
  assert.ok(html.includes('<span class="shot-empty">B</span>'), 'no thumbnail.png: the name stands in')
  assert.ok(html.includes('<h3>&#60;A&#62;</h3>'), 'the name is plain text; the address below is the link')
  assert.ok(html.includes('<img src="/products/01-a/thumbnail.png"'))
  assert.ok(html.includes('<p class="link"><a href="https://a.example" target="_blank" rel="noopener">a.example</a></p>'))
  assert.ok(html.includes('<p class="link">준비 중</p>'), 'no url: no link')
  assert.ok(existsSync(join(out, 'products', '01-a', 'thumbnail.png')))
  assert.ok(existsSync(join(out, 'style.css')))
  assert.ok(html.includes('A studio by <a href="https://blog.nulleekh.com" target="_blank" rel="noopener">nulLeeKH</a>'))
  assert.ok(html.includes('<a href="/en/" hreflang="en" lang="en">English</a>'))
})

test('Korean at /, English at /en/, each pointing at the other', () => {
  const root = fixture([['01-a', '---\nname: A\nsummary_ko: 한 줄\nsummary_en: One line\n---\n', null]])
  const out = join(root, 'dist')
  build(root, out)
  const ko = readFileSync(join(out, 'index.html'), 'utf8'), en = readFileSync(join(out, 'en', 'index.html'), 'utf8')
  assert.ok(ko.includes('<html lang="ko">') && ko.includes('<p class="summary">한 줄</p>') && ko.includes('만든 것들 (1)') && ko.includes('준비 중'))
  assert.ok(en.includes('<html lang="en">') && en.includes('<p class="summary">One line</p>') && en.includes('Works (1)') && en.includes('Coming soon'))
  assert.ok(en.includes('<a href="/" hreflang="ko" lang="ko">한국어</a>'))
  assert.ok(ko.includes('title="다크 모드 전환"') && en.includes('title="Toggle dark mode"'), 'theme button in both languages')
  for (const html of [ko, en]) assert.ok(html.includes('<link rel="alternate" hreflang="en" href="https://studio.nulleekh.com/en/">'))
})

test('no products yet', () => {
  assert.ok(render(site, []).includes('<p>아직 없습니다.</p>'))
})
