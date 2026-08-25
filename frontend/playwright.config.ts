import { defineConfig, devices } from '@playwright/test';
import path from 'path';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'npm run dev',
      url: 'http://localhost:4321',
      reuseExistingServer: !process.env.CI,
      cwd: path.resolve(__dirname),
      env: {
        ...process.env,
        PUBLIC_API_URL: 'http://localhost:3002'
      }
    },
    {
      command: 'npm run start',
      url: 'http://localhost:3002/api/health',
      reuseExistingServer: !process.env.CI,
      cwd: path.resolve(__dirname, '../backend'),
      env: {
        ...process.env,
        PORT: '3002',
        NODE_ENV: 'test',
        MONGODB_URI: 'mongodb://localhost:27017/codeforge_test',
        JWT_SECRET: 'testsecret123',
        ADMIN_API_KEY: 'test-admin-api-key',
      },
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
