// BURGESS1977™ studio site: products/<folder>/index.md (+ thumbnail.png) -> dist/index.html. No dependencies.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const site = {
  title: 'BURGESS1977™',
  tagline: 'Strange ideas, made real.',
  url: 'https://studio.nulleekh.com',
  author: { name: 'nulLeeKH', url: 'https://blog.nulleekh.com' },
}

const FIELDS = ['name', 'url', 'summary_ko', 'summary_en']
const THUMBNAIL = 'thumbnail.png' // optional, next to index.md
const esc = s => String(s).replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`)
const OUT = 'target="_blank" rel="noopener"' // every link that leaves the site opens a new tab

// "---\nkey: value\n---". Front-matter only: a product is a name and a one-line summary in Korean and English.
export function parseProduct(text, file) {
  const m = text.replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!m) throw new Error(`${file}: front-matter (--- ... ---) is missing`)
  const meta = {}
  for (const line of m[1].split('\n').filter(l => l.trim())) {
    const [, key, value] = line.match(/^(\w+):\s*(.*)$/) ?? []
    if (!FIELDS.includes(key)) throw new Error(`${file}: unknown line "${line}" (allowed: ${FIELDS.join(', ')})`)
    meta[key] = value.trim().replace(/^(["'])(.*)\1$/, '$2')
  }
  if (!meta.name) throw new Error(`${file}: name is required`)
  if (meta.url && !/^https?:\/\//.test(meta.url)) throw new Error(`${file}: url must start with http:// or https://`)
  if (m[2].trim()) throw new Error(`${file}: text after the front-matter is not shown; put one line in summary_ko: and summary_en:`)
  if (!meta.summary_ko !== !meta.summary_en) throw new Error(`${file}: summary_ko and summary_en go together (Korean and English pages)`)
  return meta
}

// Folders in name order (prefix them 01-, 02-, ... to set the order); dot folders are skipped.
function loadProducts(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith('.'))
    .map(d => d.name)
    .sort()
    .map(folder => {
      const file = join(dir, folder, 'index.md')
      if (!existsSync(file)) throw new Error(`products/${folder}: index.md is missing`)
      const product = { folder, ...parseProduct(readFileSync(file, 'utf8'), `products/${folder}/index.md`) }
      return { ...product, thumbnail: existsSync(join(dir, folder, THUMBNAIL)) }
    })
}

// The page in each language: root is Korean, /en/ is English. Each links to the other in the footer.
const LANGS = {
  ko: { path: '/', locale: 'ko_KR', dark: '다크 모드 전환', works: '만든 것들', soon: '준비 중', none: '아직 없습니다.', switchTo: 'en' },
  en: { path: '/en/', locale: 'en_US', dark: 'Toggle dark mode', works: 'Works', soon: 'Coming soon', none: 'Nothing yet.', switchTo: 'ko' },
}
const LANG_NAME = { ko: '한국어', en: 'English' }

// Theme: the system setting until the button stores a choice (same as the blog).
// Before first paint: honor a saved theme choice and tell CSS that JS runs.
const THEME = "document.documentElement.classList.add('js');try{const t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch{}"
const ICONS = '<svg class="i-moon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20.5 13.2A8.5 8.5 0 1 1 10.8 3.5a6.6 6.6 0 0 0 9.7 9.7z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>'
  + '<svg class="i-sun" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>'

function card(p, i, lang) {
  const t = LANGS[lang]
  const host = p.url && new URL(p.url).host
  const summary = p[`summary_${lang}`]
  // The picture repeats the address link below, so it stays out of the tab order and the accessibility tree.
  const pic = p.thumbnail ? `<img src="/products/${esc(p.folder)}/${THUMBNAIL}" alt="" loading="lazy">` : `<span class="shot-empty">${esc(p.name)}</span>`
  const shot = p.url ? `<a class="shot" href="${esc(p.url)}" ${OUT} tabindex="-1" aria-hidden="true">${pic}</a>` : `<div class="shot" aria-hidden="true">${pic}</div>`
  return `<li class="product">
  ${shot}
  <p class="num">${String(i + 1).padStart(2, '0')}</p>
  <h3>${esc(p.name)}</h3>
${summary ? `  <p class="summary">${esc(summary)}</p>\n` : ''}  <p class="link">${host ? `<a href="${esc(p.url)}" ${OUT}>${esc(host)}</a>` : t.soon}</p>
</li>`
}

export function render(site, products, lang = 'ko') {
  const t = LANGS[lang], other = t.switchTo
  const alternates = Object.entries(LANGS).map(([l, { path }]) => `<link rel="alternate" hreflang="${l}" href="${esc(site.url)}${path}">`).join('\n')
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script>${THEME}</script>
<title>${esc(site.title)}</title>
<meta name="description" content="${esc(site.tagline)}">
<link rel="canonical" href="${esc(site.url)}${t.path}">
${alternates}
<meta name="color-scheme" content="light dark">
<meta property="og:type" content="website">
<meta property="og:locale" content="${t.locale}">
<meta property="og:title" content="${esc(site.title)}">
<meta property="og:description" content="${esc(site.tagline)}">
<meta property="og:url" content="${esc(site.url)}${t.path}">
<meta property="og:image" content="${esc(site.url)}/og.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/style.css">
</head>
<body>
<header class="site-header"><div class="wrap"><a class="brand" href="${t.path}">${esc(site.title)}</a><button class="theme-toggle" type="button" title="${t.dark}"><span class="sr-only">${t.dark}</span>${ICONS}</button></div></header>
<main class="wrap">
<section class="intro">
  <span class="mark" aria-hidden="true"></span>
  <h1>${esc(site.tagline)}</h1>
</section>
<section class="products" aria-labelledby="products-title">
  <h2 id="products-title"><span>${t.works} (${products.length})</span></h2>
${products.length ? `  <ol>\n${products.map((p, i) => card(p, i, lang)).join('\n')}\n  </ol>` : `  <p>${t.none}</p>`}
</section>
</main>
<footer class="site-footer"><div class="wrap">
  <p>© ${esc(site.title)} · A studio by <a href="${esc(site.author.url)}" ${OUT}>${esc(site.author.name)}</a></p>
  <p><a href="${LANGS[other].path}" hreflang="${other}" lang="${other}">${LANG_NAME[other]}</a></p>
</div></footer>
<script>
document.querySelector('.theme-toggle').addEventListener('click', () => {
  const root = document.documentElement
  const dark = (root.dataset.theme ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')) === 'dark'
  root.dataset.theme = dark ? 'light' : 'dark'
  try { localStorage.setItem('theme', root.dataset.theme) } catch {} // storage blocked: this page view only
})
</script>
</body>
</html>
`
}

export function build(root, out) {
  const products = loadProducts(join(root, 'products'))
  rmSync(out, { recursive: true, force: true })
  cpSync(join(root, 'static'), out, { recursive: true })
  for (const p of products.filter(p => p.thumbnail)) {
    mkdirSync(join(out, 'products', p.folder), { recursive: true })
    cpSync(join(root, 'products', p.folder, THUMBNAIL), join(out, 'products', p.folder, THUMBNAIL))
  }
  for (const [lang, { path }] of Object.entries(LANGS)) {
    mkdirSync(join(out, path), { recursive: true })
    writeFileSync(join(out, path, 'index.html'), render(site, products, lang))
  }
  return products
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = dirname(fileURLToPath(import.meta.url))
  console.log(`built ${build(root, join(root, 'dist')).length} products -> dist/`)
}
