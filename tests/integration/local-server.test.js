import { afterEach, expect, it } from 'vitest';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname, basename, resolve } from 'node:path';
import { createLocalServer, startLocalServer } from '../../scripts/serve-local.mjs';

const cleanup = [];
afterEach(async () => {
  for (const action of cleanup.splice(0).reverse()) await action();
});
it('serves local HTML/assets without dependencies and rejects writes and outside paths', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'coin-clicker-http-'));
  cleanup.push(() => {
    if (
      dirname(resolve(directory)) !== resolve(tmpdir()) ||
      !basename(directory).startsWith('coin-clicker-http-')
    )
      throw new Error('Unexpected test cleanup path');
    return rm(directory, { recursive: true, force: true });
  });
  await writeFile(join(directory, 'index.html'), '<h1>Coin Clicker</h1>');
  await writeFile(join(directory, 'game.js'), 'export const version = 1;');
  const started = await startLocalServer(directory, 0);
  expect(started.reused).toBe(false);
  const server = started.server;
  cleanup.push(() => new Promise((resolve) => server.close(resolve)));
  const url = `http://127.0.0.1:${server.address().port}`;
  const page = await fetch(url);
  expect(page.status).toBe(200);
  expect(await page.text()).toContain('Coin Clicker');
  expect(page.headers.get('cache-control')).toBe('no-store');
  // Double-launch reuses the current game without stopping its server.
  const reopened = await startLocalServer(directory, server.address().port);
  expect(reopened).toEqual({ server: null, reused: true });
  expect((await fetch(url)).status).toBe(200);
  // A different build/application must not be mistaken for the current game.
  const occupied = createLocalServer(directory);
  occupied.removeAllListeners('request');
  occupied.on('request', (_request, response) => response.end('<h1>Another app</h1>'));
  await new Promise((resolve) => occupied.listen(0, '127.0.0.1', resolve));
  cleanup.push(() => new Promise((resolve) => occupied.close(resolve)));
  await expect(startLocalServer(directory, occupied.address().port)).rejects.toMatchObject({
    code: 'EADDRINUSE',
  });
  expect(await (await fetch(`http://127.0.0.1:${occupied.address().port}`)).text()).toContain(
    'Another app',
  );
  const asset = await fetch(`${url}/game.js`, { method: 'HEAD' });
  expect(asset.headers.get('content-type')).toContain('javascript');
  expect(await asset.text()).toBe('');
  expect((await fetch(url, { method: 'POST', body: 'no writes' })).status).toBe(405);
  for (const path of ['/%2e%2e%2fpackage.json', '/missing.js', '/%00'])
    expect((await fetch(url + path)).status).toBe(404);
});
