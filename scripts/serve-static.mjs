// AJ Class A — minimal static file server (project-owned build setup).
// Serves a built static directory in the foreground on PORT (default 3000).
import { createServer } from 'node:http'
import { readFileSync, statSync, existsSync } from 'node:fs'
import { resolve, join, extname } from 'node:path'

const root = resolve(process.argv[2] || join(process.cwd(), 'dist'))
const port = Number(process.env.PORT || 3000)

if (!existsSync(join(root, 'index.html'))) {
  console.error(`Static deployment output must contain index.html: ${root}`)
  process.exit(1)
}

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp'
}

const server = createServer((req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost')
    const path = resolve(root, '.' + decodeURIComponent(url.pathname))
    if (path !== root && !path.startsWith(root + '/')) {
      res.writeHead(404); res.end('Not found'); return
    }
    let file = path
    try {
      if (statSync(path).isDirectory()) file = join(path, 'index.html')
    } catch {
      file = join(root, 'index.html') // SPA fallback
    }
    res.setHeader('Content-Type', mime[extname(file)] || 'application/octet-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.end(readFileSync(file))
  } catch {
    res.writeHead(404); res.end('Not found')
  }
})

server.listen(port, '0.0.0.0', () => {
  console.log(`AJ Class A preview serving ${root} on http://0.0.0.0:${port}/`)
})
