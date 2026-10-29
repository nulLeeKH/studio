// Product Markdown and assets share a URL tree. Only Markdown loses its extension.
import { readdirSync, readFileSync } from 'node:fs'
import { join, posix } from 'node:path'
import { micromark } from 'micromark'
import { gfm, gfmHtml } from 'micromark-extension-gfm'

export function parseDocument(text, file, defaults = {}) {
  text = text.replace(/\r\n/g, '\n')
  const hasMeta = /^---\n(?:title|lang):/.test(text)
  const match = hasMeta ? text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/) : null
  const meta = {}
  if (hasMeta && !match) throw new Error(`${file}: front-matter (--- ... ---) is not closed`)
  if (match) for (const line of match[1].split('\n').filter(line => line.trim())) {
    const [, key, value] = line.match(/^(\w+):\s*(.*)$/) ?? []
    if (!['title', 'lang'].includes(key)) throw new Error(`${file}: unknown line "${line}" (allowed: title, lang)`)
    if (key in meta) throw new Error(`${file}: duplicate field ${key}`)
    meta[key] = value.trim().replace(/^(["'])(.*)\1$/, '$2')
  }
  const body = match ? match[2] : text
  const html = renderMarkdown(body, defaults.sourcePath)
  const heading = /<h1(?:\s[^>]*)?>([\s\S]*?)<\/h1>/.exec(html)
  // Use a rendered heading for plain Markdown, preserving its formatting in the article.
  const headingTitle = heading?.[1].replace(/<[^>]*>/g, '').replace(/&#(x[0-9a-f]+|\d+);|&(amp|lt|gt|quot|apos);/gi, (_, num, name) => num ? String.fromCodePoint(num[0].toLowerCase() === 'x' ? parseInt(num.slice(1), 16) : Number(num)) : ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" })[name.toLowerCase()])
  const title = meta.title || headingTitle || defaults.title || posix.basename(file, '.md')
  const lang = meta.lang ?? defaults.lang ?? 'ko'
  if (!['ko', 'en'].includes(lang)) throw new Error(`${file}: lang must be ko or en`)
  return { title, lang, html, hasHeading: Boolean(heading) }
}

export function renderMarkdown(body, sourcePath) {
  // Raw HTML is escaped and unsafe URL schemes are dropped by micromark's defaults.
  return micromark(body, { extensions: [gfm()], htmlExtensions: [gfmHtml()] })
    .replace(/(href|src)="([^"]*)"/g, (attribute, key, value) => {
      if (!sourcePath || !value || /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(value)) return attribute
      const url = new URL(value, `https://product.invalid${sourcePath}`)
      if (key === 'href' && url.pathname.endsWith('.md')) {
        url.pathname = url.pathname.endsWith('/index.md') ? url.pathname.slice(0, -8) : `${url.pathname.slice(0, -3)}/`
      }
      return `${key}="${url.pathname}${url.search}${url.hash}"`
    })
    .replace(/<img\b/g, '<img loading="lazy" decoding="async"')
    .replace(/<p>\s*(<img\b[^>]*>)\s*<\/p>/g, (_, image) => {
      const caption = /\s+title="([^"]*)"/.exec(image)
      // micromark already escaped attribute text; keep it escaped in the visible caption.
      const picture = caption ? image.replace(caption[0], '') : image
      return `<figure>${picture}${caption ? `<figcaption>${caption[1]}</figcaption>` : ''}</figure>`
    })
    .replace(/<a href="(?:https?:\/\/|\/\/)[^"]*"/gi, link => `${link} target="_blank" rel="noopener"`)
}

export function loadProductContent(dir, product) {
  const documents = [], assets = []
  const slug = product.folder.replace(/^\d+-/, '')
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error(`products/${product.folder}: use lowercase letters, numbers and hyphens for product paths`)
  function visit(parts) {
    for (const entry of readdirSync(join(dir, ...parts), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.name.startsWith('.')) continue
      const next = [...parts, entry.name]
      const file = `products/${product.folder}/${next.join('/')}`
      if (entry.isSymbolicLink()) throw new Error(`${file}: symbolic links are not supported`)
      if (entry.isDirectory()) visit(next)
      else if (entry.isFile()) {
        if (!parts.length && entry.name === 'index.md') continue
        const sourcePath = `/${slug}/${next.map(encodeURIComponent).join('/')}`
        if (entry.name.endsWith('.md')) {
          const route = [...parts, entry.name.slice(0, -3)]
          if (route.some(part => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(part))) throw new Error(`${file}: use lowercase letters, numbers and hyphens for document paths`)
          const path = entry.name === 'index.md' ? `/${slug}/${parts.join('/')}/` : `/${slug}/${route.join('/')}/`
          documents.push({ ...parseDocument(readFileSync(join(dir, ...next), 'utf8'), file, { sourcePath }), path, file })
        } else {
          assets.push({ source: join(dir, ...next), path: `/${slug}/${next.join('/')}`, file })
        }
      }
    }
  }
  visit([])
  const file = `products/${product.folder}/index.md`
  const html = renderMarkdown(product.body ?? '', `/${slug}/index.md`)
  documents.unshift({ title: product.name, lang: 'ko', html, hasHeading: /<h1[ >]/.test(html), path: `/${slug}/`, file })
  return { slug, documents, assets }
}
