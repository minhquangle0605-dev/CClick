import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export const aliases = Object.fromEntries(
  ['app', 'core', 'content', 'features', 'platform', 'ui', 'shared', 'assets', 'locales'].map(
    (layer) => [`@${layer}`, fileURLToPath(new URL(`./src/${layer}`, import.meta.url))],
  ),
);

export default defineConfig({
  plugins: [react()],
  resolve: { alias: aliases },
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  preview: { host: '127.0.0.1', port: 5173, strictPort: true },
});
