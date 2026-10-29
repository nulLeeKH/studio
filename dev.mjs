// Local preview: build, serve dist/, rebuild when products/ or static/ change (reload the page by hand;
// restart after editing build.mjs).
import { watch, readFileSync, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { dirname, extname, join, normalize, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from './build.mjs'

const root = dirname(fileURLToPath(import.meta.url))
const out = join(root, 'dist')
const port = Number(process.env.PORT) || 8081
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.pdf': 'application/pdf', '.json': 'application/json', '.zip': 'application/zip', '.avif': 'image/avif', '.ico': 'image/x-icon' }

const rebuild = () => {
  try { build(root, out); console.log('built') } catch (e) { console.error(e.message) }
}
rebuild()
for (const dir of ['products', 'static']) {
  if (existsSync(join(root, dir))) watch(join(root, dir), { recursive: true }, rebuild)
}

createServer((req, res) => {
  let url, pathname
  try {
    url = new URL(req.url, 'http://x')
    pathname = decodeURIComponent(url.pathname)
  } catch { return res.writeHead(400).end('bad request') }
  let file = join(out, normalize(pathname))
  if (file !== out && !file.startsWith(out + sep)) return res.writeHead(403).end()
  if (existsSync(file) && statSync(file).isDirectory()) {
    if (!url.pathname.endsWith('/')) return res.writeHead(301, { location: url.pathname + '/' + url.search }).end()
    file = join(file, 'index.html')
  }
  if (!existsSync(file)) return res.writeHead(404).end('not found')
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' }).end(readFileSync(file))
}).listen(port, '127.0.0.1', () => console.log(`http://127.0.0.1:${port}`))
