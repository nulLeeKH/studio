import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { build, parseProduct } from '../build.mjs'
import { parseDocument } from '../documents.mjs'

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'studio-products-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  mkdirSync(join(root, 'static'))
  writeFileSync(join(root, 'static', 'style.css'), '')
  const put = (path, text) => {
    mkdirSync(join(root, ...path.split('/').slice(0, -1)), { recursive: true })
    writeFileSync(join(root, path), text)
  }
  const product = (folder, extra = '') => put(`products/${folder}/index.md`, `---\nname: ${folder}\n${extra}---\n`)
  return { root, out: join(root, 'dist'), put, product }
}
const doc = (title, lang = 'ko') => `---\ntitle: ${title}\nlang: ${lang}\n---\n\n## Content\n\nText with **emphasis**.\n`

test('product index, nested documents and assets share one URL tree', t => {
  const { root, out, put, product } = fixture(t)
  product('01-wesualizer')
  put('products/01-wesualizer/privacy/ko.md', doc('개인정보처리방침'))
  put('products/01-wesualizer/privacy/en.md', doc('Privacy policy', 'en'))
  put('products/01-wesualizer/privacy/pt_BR.md', doc('Política de Privacidade', 'pt_BR'))
  put('products/01-wesualizer/help/index.md', '# Help\n\nIntroduction.')
  put('products/01-wesualizer/privacy/diagram.png', Buffer.from([137, 80, 78, 71]))
  put('products/01-wesualizer/files/policy.pdf', '%PDF-1.7')
  build(root, out)
  const ko = readFileSync(join(out, 'wesualizer/privacy/ko/index.html'), 'utf8')
  const en = readFileSync(join(out, 'wesualizer/privacy/en/index.html'), 'utf8')
  const ptBR = readFileSync(join(out, 'wesualizer/privacy/pt_BR/index.html'), 'utf8')
  assert.ok(existsSync(join(out, 'wesualizer/index.html')))
  assert.ok(existsSync(join(out, 'wesualizer/help/index.html')))
  assert.ok(!existsSync(join(out, 'wesualizer/help/index/index.html')))
  assert.ok(!existsSync(join(out, 'wesualizer/privacy/ko.md')))
  assert.ok(existsSync(join(out, 'wesualizer/privacy/pt_BR/index.html')))
  assert.ok(ptBR.includes('<html lang="pt_BR">') && ptBR.includes('<h1>Política de Privacidade</h1>'))
  assert.deepEqual(readFileSync(join(out, 'wesualizer/privacy/diagram.png')), Buffer.from([137, 80, 78, 71]))
  assert.equal(readFileSync(join(out, 'wesualizer/files/policy.pdf'), 'utf8'), '%PDF-1.7')
  assert.ok(ko.includes('<html lang="ko">') && ko.includes('<h1>개인정보처리방침</h1>'))
  assert.ok(ko.includes('<h2>Content</h2>') && ko.includes('<strong>emphasis</strong>'))
  assert.ok(ko.includes('class="theme-toggle"'))
  assert.ok(ko.includes('<link rel="canonical" href="https://studio.nulleekh.com/wesualizer/privacy/ko/">'))
  assert.ok(en.includes('<html lang="en">') && en.includes('property="og:locale" content="en_US"'))
  assert.ok(!en.includes('hreflang='), 'no invented translation links')
  assert.ok(!readFileSync(join(out, 'index.html'), 'utf8').includes('wesualizer/privacy'))
})

test('product index body renders at its root without duplicating its heading', t => {
  const { root, out, put } = fixture(t)
  put('products/app/index.md', '---\nname: App\n---\n# Welcome\n\n[Policy](privacy/ko.md)\n\n![Logo](logo.svg)')
  put('products/app/privacy/ko.md', '# Policy')
  put('products/app/logo.svg', '<svg/>')
  build(root, out)
  const html = readFileSync(join(out, 'app/index.html'), 'utf8')
  assert.equal((html.match(/<h1>/g) ?? []).length, 1)
  assert.ok(html.includes('href="/app/privacy/ko/"'))
  assert.ok(html.includes('src="/app/logo.svg"'))
})

test('product index renders cover banner with or without body', t => {
  const { root, out, put } = fixture(t)
  put('products/01-empty/index.md', '---\nname: Empty App\nurl: https://empty.example\nsummary_ko: 설명\nsummary_en: Description\n---\n')
  put('products/01-empty/thumbnail.png', 'img')
  put('products/02-with-body/index.md', '---\nname: Body App\n---\n# Headline\n\nContent here.')
  build(root, out)

  const emptyHtml = readFileSync(join(out, 'empty/index.html'), 'utf8')
  assert.ok(emptyHtml.includes('class="cover"'))
  assert.ok(emptyHtml.includes('class="cover-shot"'))
  assert.ok(emptyHtml.includes('src="/empty/thumbnail.png"'))
  assert.ok(emptyHtml.includes('<h1 class="cover-title">Empty App</h1>'))
  assert.ok(emptyHtml.includes('<p class="summary">설명</p>'))
  assert.ok(emptyHtml.includes('href="https://empty.example"'))
  assert.equal((emptyHtml.match(/<h1\b/g) ?? []).length, 1)

  const bodyHtml = readFileSync(join(out, 'with-body/index.html'), 'utf8')
  assert.ok(bodyHtml.includes('class="cover has-body"'))
  assert.ok(bodyHtml.includes('class="cover-shot-empty"'))
  assert.ok(bodyHtml.includes('<p class="cover-title">Body App</p>'))
  assert.ok(bodyHtml.includes('<h1>Headline</h1>'))
  assert.equal((bodyHtml.match(/<h1\b/g) ?? []).length, 1)
  assert.ok(bodyHtml.includes('Content here.'))
})

test('plain Markdown and optional metadata both work', () => {
  const parsed = parseDocument('# A & B\n\nText', 'policy.md')
  assert.equal(parsed.title, 'A & B')
  assert.equal(parsed.lang, 'ko')
  assert.equal(parsed.hasHeading, true)
  assert.equal(parseDocument('Plain text', 'policy.md').title, 'policy')
  assert.equal(parseDocument('---\n\nText', 'policy.md').html.includes('<hr />'), true)
  assert.equal(parseDocument(doc('A').replaceAll('\n', '\r\n'), 'policy.md').title, 'A')
  assert.throws(() => parseDocument('---\ntitle: A\n', 'policy.md'), /policy.md: front-matter/)
  assert.throws(() => parseDocument(doc('A', 'invalid'), 'policy.md'), /policy.md: lang must/)
  assert.throws(() => parseDocument('---\ntitle: A\ntitle: B\n---\nText', 'policy.md'), /policy.md: duplicate/)
  assert.throws(() => parseDocument('---\ntitle: A\nunknown: B\n---\nText', 'policy.md'), /policy.md: unknown/)
})

test('relative images, files, document links and footnotes resolve from the source location', () => {
  const { html } = parseDocument('# Policy\n\n![Diagram](./diagram.png "Title")\n\n[English](en.md?print=1#details) [Home](../index.md) [File](../files/policy.pdf) [Anchor](#details)\n\nNote[^1]\n\n[^1]: Footnote', 'ko.md', { sourcePath: '/wesualizer/privacy/ko.md' })
  assert.ok(html.includes('src="/wesualizer/privacy/diagram.png" alt="Diagram"'))
  assert.ok(html.includes('<figcaption>Title</figcaption>'))
  assert.ok(html.includes('href="/wesualizer/privacy/en/?print=1#details"'))
  assert.ok(html.includes('href="/wesualizer/"'))
  assert.ok(html.includes('href="/wesualizer/files/policy.pdf"'))
  assert.ok(html.includes('href="#details"'))
  assert.ok(html.includes('href="#user-content-fn-1"'))
})

test('CommonMark blocks and inline syntax, GFM tables and task lists render', () => {
  const markdown = '# H1\n\n## H2\n\n### H3\n\n#### H4\n\n##### H5\n\n###### H6\n\nSetext\n======\n\n*em* **strong** `inline` \\*literal\\*\n\n> Quote\n\n- Item\n  - Nested\n\n1. Numbered\n\n---\n\n```js\nconst x = 1\n```\n\n    indented code\n\n[Reference][ref]\n\n[ref]: https://example.com\n\n<https://example.com>\n\nLine  \nbreak\n\n| A | B |\n| - | - |\n| 1 | 2 |\n\n- [x] Done\n\n~~gone~~'
  const { html } = parseDocument(markdown, 'test.md')
  for (const token of ['<h1>', '<h2>', '<h3>', '<h4>', '<h5>', '<h6>', '<em>', '<strong>', '<code>', '<blockquote>', '<ul>', '<ol>', '<hr />', '<pre>', 'language-js', '<br />', '<table>', 'type="checkbox"', '<del>']) assert.ok(html.includes(token), token)
  assert.ok(html.includes('href="https://example.com" target="_blank" rel="noopener"'))
})

test('raw HTML and dangerous links stay inert', () => {
  const { html } = parseDocument('<script>alert(1)</script>\n\n[bad](javascript:alert%281%29)\n\n![bad](data:text/html,test)', 'test.md')
  assert.ok(!html.includes('<script>'))
  assert.ok(!html.includes('href="javascript:'))
  assert.ok(!html.includes('src="data:'))
})

test('draft hides only listings; its root, documents, thumbnail and files still publish', t => {
  const { root, out, put, product } = fixture(t)
  product('01-hidden', 'draft: true\n')
  product('02-public', 'draft: false\n')
  put('products/01-hidden/thumbnail.png', 'image')
  put('products/01-hidden/privacy/ko.md', '# Privacy')
  assert.equal(build(root, out).length, 1)
  for (const path of ['index.html', 'en/index.html']) {
    const html = readFileSync(join(out, path), 'utf8')
    assert.ok(!html.includes('01-hidden'))
    assert.ok(html.includes('02-public') && html.includes('(1)'))
  }
  assert.ok(existsSync(join(out, 'hidden/index.html')))
  assert.ok(existsSync(join(out, 'hidden/thumbnail.png')))
  assert.ok(existsSync(join(out, 'hidden/privacy/ko/index.html')))
  product('01-hidden')
  assert.equal(build(root, out).length, 2)
  product('01-hidden', 'draft: true\n')
  assert.equal(build(root, out).length, 1)
  rmSync(join(root, 'products/01-hidden'), { recursive: true })
  build(root, out)
  assert.ok(!existsSync(join(out, 'hidden')))
  assert.throws(() => parseProduct('---\nname: A\ndraft: yes\n---\n', 'product.md'), /product.md: draft must/)
})

test('route and output collisions fail before replacing the existing build', t => {
  const { root, out, put, product } = fixture(t)
  put('static/assets/keep.txt', 'keep')
  build(root, out)
  for (const folder of ['en', 'assets']) {
    product(folder)
    assert.throws(() => build(root, out), /product path .* conflicts/)
    assert.equal(readFileSync(join(out, 'assets/keep.txt'), 'utf8'), 'keep')
    rmSync(join(root, 'products', folder), { recursive: true })
  }
  product('01-app'); product('02-app')
  assert.throws(() => build(root, out), /product path .* conflicts/)
  rmSync(join(root, 'products/02-app'), { recursive: true })
  put('products/01-app/guide.md', '# Guide')
  put('products/01-app/guide/index.md', '# Another guide')
  assert.throws(() => build(root, out), /output path conflicts/)
  rmSync(join(root, 'products/01-app/guide'), { recursive: true })
  put('products/01-app/guide/index.html', '<p>Conflict</p>')
  assert.throws(() => build(root, out), /output path conflicts/)
  rmSync(join(root, 'products/01-app/guide'), { recursive: true })
  put('products/01-app/guide', 'file blocks document directory')
  assert.throws(() => build(root, out), /output path conflicts/)
})

test('dot files stay private and symbolic links fail the build', t => {
  const { root, out, put, product } = fixture(t)
  product('app')
  put('products/app/.env', 'secret')
  put('products/app/.draft/notes.md', '# Private')
  build(root, out)
  assert.ok(!existsSync(join(out, 'app/.env')))
  assert.ok(!existsSync(join(out, 'app/.draft')))
  symlinkSync(join(root, 'static/style.css'), join(root, 'products/app/link.css'))
  assert.throws(() => build(root, out), /symbolic links/)
})


test('standalone images keep accessible alt text and show titles as captions', () => {
  const { html } = parseDocument('![A useful description](photo.png "A visible caption")', 'test.md')
  assert.ok(html.startsWith('<figure><img '))
  assert.ok(html.includes('alt="A useful description"'))
  assert.ok(html.includes('<figcaption>A visible caption</figcaption>'))
  assert.ok(html.includes('loading="lazy" decoding="async"'))
  assert.ok(!html.includes(' title='), 'caption is not repeated as a tooltip')
  const noCaption = parseDocument('![Description](photo.png)', 'test.md').html
  assert.ok(noCaption.includes('<figure>') && !noCaption.includes('<figcaption>'))
  const inline = parseDocument('Text ![Description](photo.png "Tooltip") in a paragraph.', 'test.md').html
  assert.ok(inline.startsWith('<p>') && inline.includes('title="Tooltip"') && !inline.includes('<figure>'))
})

test('captions and metadata remain text when given injection payloads', () => {
  const { html } = parseDocument('![Description](photo.png "&lt;img src=x onerror=alert(1)&gt; &quot;quoted&quot;")', 'test.md')
  assert.ok(html.includes('<figcaption>&lt;img src=x onerror=alert(1)&gt; &quot;quoted&quot;</figcaption>'))
  assert.equal((html.match(/<img\b/g) ?? []).length, 1)
  assert.ok(!html.includes(' onerror="'))
})
