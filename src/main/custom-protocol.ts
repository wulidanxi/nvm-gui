import { app, protocol } from 'electron'
import { existsSync, readFileSync } from 'node:fs'
import { extname, join, relative, resolve } from 'node:path'

const SCHEME = 'app'
const HOST = 'nvm-gui'

export function registerCustomProtocol(): void {
  protocol.registerSchemesAsPrivileged([{
    scheme: SCHEME,
    privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true },
  }])
  app.whenReady().then(() => {
    protocol.handle(SCHEME, (request) => {
      const url = new URL(request.url)
      if (url.host !== HOST)
        return new Response('Forbidden', { status: 403 })
      let pathname: string
      try {
        pathname = decodeURIComponent(url.pathname || '/index.html')
      }
      catch { return new Response('Bad Request', { status: 400 }) }
      const root = resolve(app.getAppPath(), 'dist', 'render')
      const candidate = resolve(root, `.${pathname}`)
      if (!isInside(root, candidate))
        return new Response('Forbidden', { status: 403 })
      if (existsSync(candidate))
        return serve(candidate)
      if (extname(pathname))
        return new Response('Not Found', { status: 404 })
      return serve(join(root, 'index.html'))
    })
  })
}

function isInside(root: string, target: string): boolean {
  const path = relative(root, target)
  return path === '' || (!path.startsWith('..') && !path.includes(':'))
}

function serve(filePath: string): Response {
  try {
    return new Response(readFileSync(filePath), {
      headers: { 'content-type': mimeType(filePath), 'cache-control': 'no-cache' },
    })
  }
  catch { return new Response('Not Found', { status: 404 }) }
}

function mimeType(filePath: string): string {
  const types: Record<string, string> = {
    '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
    '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
    '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.wasm': 'application/wasm',
  }
  return types[extname(filePath).toLowerCase()] || 'application/octet-stream'
}
