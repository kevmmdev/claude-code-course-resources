import path from 'path';
import { defineConfig } from 'vitest/config';

const dirname = import.meta.dirname;

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(dirname, './'),
    },
  },
});
