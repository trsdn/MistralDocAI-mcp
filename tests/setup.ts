import { beforeAll, afterAll } from '@jest/globals';

// Global test setup
beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.MISTRAL_API_KEY = 'test-api-key-for-testing';
  
  // Suppress console output during tests unless explicitly testing it
  if (!process.env.DEBUG_TESTS) {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  }
});

afterAll(() => {
  // Restore console methods
  jest.restoreAllMocks();
  
  // Clean up test environment
  delete process.env.MISTRAL_API_KEY;
  delete process.env.NODE_ENV;
});