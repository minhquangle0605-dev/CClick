import { createServer } from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
};

export function createLocalServer(directory) {
  const root = realpath(directory);
  return createServer(async (request, response) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.writeHead(405, { Allow: 'GET, HEAD' });
      response.end();
      return;
    }
    try {
      const path = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
      const base = await root;
      const file = await realpath(resolve(base, '.' + (path === '/' ? '/index.html' : path)));
      if (!file.startsWith(base + sep) || !(await stat(file)).isFile()) {
        response.writeHead(404);
        response.end();
        return;
      }
      const body = await readFile(file);
      response.writeHead(200, {
        'Content-Type': types[extname(file)] ?? 'application/octet-stream',
        'Content-Length': body.byteLength,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      });
      response.end(request.method === 'HEAD' ? undefined : body);
    } catch {
      response.writeHead(404);
      response.end();
    }
  });
}

// Reuse only the same built game, never an unrelated app occupying this port.
export async function startLocalServer(directory, port = 5173) {
  const server = createLocalServer(directory);
  try {
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(port, '127.0.0.1', () => {
        server.removeListener('error', reject);
        resolve();
      });
    });
    return { server, reused: false };
  } catch (error) {
    if (error.code === 'EADDRINUSE') {
      try {
        const response = await fetch(`http://127.0.0.1:${port}/`, {
          signal: AbortSignal.timeout(2000),
          redirect: 'error',
        });
        const expected = await readFile(resolve(directory, 'index.html'));
        if (response.ok && Buffer.from(await response.arrayBuffer()).equals(expected)) {
          return { server: null, reused: true };
        }
      } catch {
        // An unresponsive or different service must not be stopped automatically.
      }
    }
    throw error;
  }
}

function openGame() {
  if (process.argv.includes('--open') && process.platform === 'win32') {
    const browser = spawn('cmd.exe', ['/c', 'start', '', 'http://127.0.0.1:5173/'], {
      windowsHide: true,
      stdio: 'ignore',
    });
    browser.on('error', () => console.log('Open the local URL in your browser.'));
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dist = fileURLToPath(new URL('../dist', import.meta.url));
  try {
    await stat(resolve(dist, 'index.html'));
  } catch {
    console.error('Missing dist/index.html. Run npm run build first.');
    process.exit(1);
  }
  try {
    const { server, reused } = await startLocalServer(dist);
    console.log('Coin Clicker: http://127.0.0.1:5173/');
    console.log(
      reused
        ? 'Coin Clicker is already running. Opening the existing game.'
        : 'Local files only. Keep this window open; Ctrl+C to stop.',
    );
    openGame();
    if (server) process.on('SIGINT', () => server.close(() => process.exit(0)));
  } catch (error) {
    console.error(
      `Cannot start: ${error.message}. Port 5173 is occupied by a different or unresponsive server. Close that server and try again; the game URL stays unchanged.`,
    );
    process.exitCode = 1;
  }
}
