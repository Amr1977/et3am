import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.integration.test.ts'],
    setupFiles: ['./src/test/integration-setup.ts'],
    reporters: ['verbose'],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
