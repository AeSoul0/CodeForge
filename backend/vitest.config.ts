import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',

    // Test files must run sequentially because they share
    // the same MongoDB test database.
    fileParallelism: false,

    // Never execute compiled output from dist/.
    exclude: [
      'node_modules/**',
      'dist/**',
    ],

    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/index.ts',
        'src/models/**',
        'src/**/__test__/**',
        'src/utils/ai.ts',
      ],
      thresholds: {
        statements: 85,
        branches: 80,
        functions: 85,
        lines: 85,
      },
    },

    setupFiles: ['./tests/setup.ts'],
  },
});