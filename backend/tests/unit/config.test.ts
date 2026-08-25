// tests/unit/config.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dotenv as an ESM module with a default export containing config
vi.mock('dotenv', () => ({
  default: {
    config: vi.fn(),
  },
}));

describe('Environment Config (env.ts)', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    delete process.env.NODE_ENV;
    delete process.env.VITEST;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('exports "development" when NODE_ENV is not set', async () => {
    const { environment, env } = await import('../../src/config/env');
    expect(environment).toBe('development');
    expect(env.nodeEnv).toBe('development');
  });

  it('loads .env file when not in test environment', async () => {
    process.env.NODE_ENV = 'development';
    await import('../../src/config/env');
    // Import the mocked dotenv module to access the mocked config function
    const { default: dotenv } = await import('dotenv');
    expect(dotenv.config).toHaveBeenCalledWith({ path: '.env' });
  });
});
