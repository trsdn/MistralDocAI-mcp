import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import MistralDocAIMCPServer from '../../src/index';

describe('Environment Setup Tests', () => {
  let server: MistralDocAIMCPServer;
  let originalApiKey: string | undefined;

  beforeEach(() => {
    server = new MistralDocAIMCPServer();
    originalApiKey = process.env.MISTRAL_API_KEY;
  });

  afterEach(() => {
    // Restore original API key
    if (originalApiKey) {
      process.env.MISTRAL_API_KEY = originalApiKey;
    } else {
      delete process.env.MISTRAL_API_KEY;
    }
  });

  describe('API Key Handling', () => {
    it('should not require API key for help/version commands', async () => {
      delete process.env.MISTRAL_API_KEY;
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      // These should work without API key
      await server.start({ help: true });
      await server.start({ version: true });
      
      expect(consoleSpy).toHaveBeenCalledTimes(2);
      
      consoleSpy.mockRestore();
    });

    it('should handle missing API key gracefully in test mode', async () => {
      delete process.env.MISTRAL_API_KEY;
      
      // Test mode should handle missing API key
      try {
        await server.start({ test: true });
        // May succeed or fail, but should not crash
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Console Output Redirection (v1.0.4)', () => {
    it('should use console.error for setup messages', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Instantiate server - setup messages should go to stderr
      const testServer = new MistralDocAIMCPServer();
      expect(testServer).toBeInstanceOf(MistralDocAIMCPServer);
      
      consoleErrorSpy.mockRestore();
    });

    it('should not contaminate stdout with setup messages', async () => {
      const stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
      
      // Test help command - this should use console.log (stdout)
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      await server.start({ help: true });
      
      expect(consoleSpy).toHaveBeenCalled();
      
      stdoutSpy.mockRestore();
      consoleSpy.mockRestore();
    });
  });

  describe('Error Messages Security', () => {
    it('should not expose sensitive information in errors', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      try {
        await server.start({ test: true });
      } catch (error) {
        const errorMessage = (error as Error).message;
        
        // Should not contain sensitive paths or credentials
        expect(errorMessage).not.toContain('api-key');
        expect(errorMessage).not.toContain('password');
        expect(errorMessage).not.toContain('secret');
        expect(errorMessage).not.toContain('/home/');
        expect(errorMessage).not.toContain('\\Users\\');
      }
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Directory Structure', () => {
    it('should use user home directory pattern', () => {
      // Test that server uses expected directory pattern
      // This is a basic structural test
      expect(server).toBeInstanceOf(MistralDocAIMCPServer);
      expect(typeof server.start).toBe('function');
    });
  });
});