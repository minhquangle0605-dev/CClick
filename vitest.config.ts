import { defineConfig } from 'vitest/config';
import { aliases } from './vite.config.ts';

export default defineConfig({
  resolve: { alias: aliases },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.{js,ts,tsx}'],
    maxWorkers: 4,
  },
});
