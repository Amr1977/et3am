import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts'],
    exclude: ['**/integration.test.ts', '**/*.integration.test.ts'],
    setupFiles: ['./src/test/setup.ts'],
    reporters: ['verbose', 'html'],
    outputFile: {
      html: './coverage/test-report.html',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
    },
  },
});