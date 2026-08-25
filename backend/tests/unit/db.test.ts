// tests/unit/db.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import connectDB from '../../src/config/db';

// Mock mongoose as an ESM module with default export
vi.mock('mongoose', async () => ({
  default: {
    connect: vi.fn(),
    connection: {
      on: vi.fn(),
    },
  },
}));

let mongoose: any;

describe('Database connection (db.ts)', () => {
  const originalEnv = { ...process.env };

  beforeEach(async () => {
    vi.resetModules();
    process.env = { ...originalEnv };
    mongoose = (await import('mongoose')).default;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('connects successfully with valid MONGODB_URI', async () => {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/testdb';
    mongoose.connect.mockResolvedValueOnce({});
    await connectDB();
    expect(mongoose.connect).toHaveBeenCalledWith('mongodb://localhost:27017/testdb', expect.any(Object));
  });

  it('exits process when MONGODB_URI is missing', async () => {
    delete process.env.MONGODB_URI;
    const exitMock = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('process exit'); });
    await expect(connectDB(1, 0)).rejects.toThrow('process exit');
    exitMock.mockRestore();
  });

  it('retries on connection failure and eventually exits', async () => {
    process.env.MONGODB_URI = 'mongodb://badhost:27017/testdb';
    const exitMock = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('process exit'); });
    mongoose.connect.mockRejectedValue(new Error('connection error'));
    await expect(connectDB(2, 10)).rejects.toThrow('process exit');
    // Expect at least 2 attempts
    expect(mongoose.connect.mock.calls.length).toBeGreaterThanOrEqual(2);
    exitMock.mockRestore();
  });
});
