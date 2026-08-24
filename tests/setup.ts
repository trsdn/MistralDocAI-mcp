import { beforeAll, beforeEach, afterAll, jest } from '@jest/globals';

const CONSOLE_METHODS = ['log', 'error', 'warn'] as const;

beforeAll(() => {
  process.env.NODE_ENV = 'test';
  process.env.MISTRAL_API_KEY = 'test-api-key-for-testing';
});

// Re-applied per test because individual tests restore their own spies, which
// would otherwise let real diagnostics leak into the reporter output.
beforeEach(() => {
  if (process.env.DEBUG_TESTS) {
    return;
  }

  for (const method of CONSOLE_METHODS) {
    jest.spyOn(console, method).mockImplementation(() => {});
  }
});

afterAll(() => {
  jest.restoreAllMocks();

  delete process.env.MISTRAL_API_KEY;
  delete process.env.NODE_ENV;
});
