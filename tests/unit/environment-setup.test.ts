import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import MistralDocAIMCPServer from '../../src/index';
import { FakePythonEnvironment } from '../support/fake-python-environment';

describe('Environment Setup', () => {
  let environment: FakePythonEnvironment;
  let server: MistralDocAIMCPServer;
  let originalApiKey: string | undefined;

  beforeEach(() => {
    environment = new FakePythonEnvironment();
    server = new MistralDocAIMCPServer(environment);
    originalApiKey = process.env.MISTRAL_API_KEY;
  });

  afterEach(() => {
    if (originalApiKey === undefined) {
      delete process.env.MISTRAL_API_KEY;
    } else {
      process.env.MISTRAL_API_KEY = originalApiKey;
    }
    jest.restoreAllMocks();
  });

  describe('API key handling', () => {
    it('serves help and version without an API key and without touching Python', async () => {
      delete process.env.MISTRAL_API_KEY;
      const log = jest.spyOn(console, 'log').mockImplementation(() => {});

      await server.start({ help: true });
      await server.start({ version: true });

      expect(log).toHaveBeenCalledTimes(2);
      expect(environment.calls).toEqual([]);
    });

    it('bootstraps the environment before running the setup test', async () => {
      delete process.env.MISTRAL_API_KEY;

      await server.start({ test: true });

      expect(environment.calls).toEqual(['ensureDependencies', 'ensureEnvFile', 'runSetupTest']);
    });
  });

  describe('Failure paths', () => {
    it('propagates a setup failure to the caller', async () => {
      const failure = new Error('Failed to create virtual environment (exit code 1)');
      const failing = new MistralDocAIMCPServer(
        new FakePythonEnvironment({ ensureDependencies: failure })
      );

      await expect(failing.start({ test: true })).rejects.toThrow(failure.message);
    });

    it('reports failures on stderr so stdout stays a clean MCP channel', async () => {
      const failing = new MistralDocAIMCPServer(
        new FakePythonEnvironment({ ensureDependencies: new Error('boom') })
      );
      const log = jest.spyOn(console, 'log').mockImplementation(() => {});
      const error = jest.spyOn(console, 'error').mockImplementation(() => {});

      await expect(failing.start({ test: true })).rejects.toThrow('boom');

      expect(error).toHaveBeenCalled();
      expect(log).not.toHaveBeenCalled();
    });
  });

  describe('Error message security', () => {
    it('never echoes the API key into diagnostics', async () => {
      process.env.MISTRAL_API_KEY = 'sk-secret-value-that-must-not-leak';
      const failing = new MistralDocAIMCPServer(
        new FakePythonEnvironment({
          ensureDependencies: new Error('Failed to install dependencies (exit code 1)')
        })
      );
      const error = jest.spyOn(console, 'error').mockImplementation(() => {});

      await expect(failing.start({ test: true })).rejects.toThrow();

      const diagnostics = error.mock.calls.flat().map(String).join('\n');
      expect(diagnostics).not.toContain(process.env.MISTRAL_API_KEY);
    });
  });

  describe('Console output redirection', () => {
    it('writes progress messages to stderr, not stdout', async () => {
      const log = jest.spyOn(console, 'log').mockImplementation(() => {});
      const error = jest.spyOn(console, 'error').mockImplementation(() => {});

      await server.start({ test: true });

      expect(error).toHaveBeenCalledWith('Testing MCP server setup...');
      expect(log).not.toHaveBeenCalled();
    });
  });
});
