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
        'src/utils/scripts/**',
        'src/models/**',
        'src/**/__test__/**',
      ],
    },

    setupFiles: ['./tests/setup.ts'],
  },
});