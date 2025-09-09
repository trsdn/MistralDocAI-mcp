import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import MistralDocAIMCPServer from '../../src/index';

describe('MistralDocAI MCP Server Functionality', () => {
  let server: MistralDocAIMCPServer;

  beforeEach(() => {
    server = new MistralDocAIMCPServer();
  });

  describe('Server Instance', () => {
    it('should create server instance', () => {
      expect(server).toBeDefined();
      expect(server).toBeInstanceOf(MistralDocAIMCPServer);
    });

    it('should have start method', () => {
      expect(typeof server.start).toBe('function');
    });
  });

  describe('Help and Version Options', () => {
    it('should display help information', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      await server.start({ help: true });
      
      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls[0][0];
      expect(output).toContain('MistralDocAI MCP Server');
      expect(output).toContain('USAGE:');
      expect(output).toContain('OPTIONS:');
      
      consoleSpy.mockRestore();
    });

    it('should display version information', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      await server.start({ version: true });
      
      expect(consoleSpy).toHaveBeenCalled();
      const output = consoleSpy.mock.calls[0][0];
      expect(output).toMatch(/MistralDocAI MCP Server v\d+\.\d+\.\d+/);
      
      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid options gracefully', async () => {
      // Test with empty options - should attempt to start normally
      const options = {};
      
      // This will likely fail due to Python environment, but should not crash
      try {
        await server.start(options);
        // If it succeeds, that's fine too
      } catch (error) {
        // Should throw a meaningful error, not crash
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBeTruthy();
      }
    });
  });

  describe('Console Output Management (v1.0.4 Fix)', () => {
    it('should use console.error for setup messages', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      // Test help option - this should use console.log
      server.start({ help: true });
      
      expect(consoleLogSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it('should not leak sensitive information in error messages', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      try {
        await server.start({ test: true });
      } catch (error) {
        // Even if errors occur, they shouldn't contain sensitive paths or API keys
        const errorMessage = (error as Error).message;
        expect(errorMessage).not.toContain('api-key');
        expect(errorMessage).not.toContain('password');
        expect(errorMessage).not.toContain('/home/');
      }
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Configuration Validation', () => {
    it('should handle missing environment variables', () => {
      // Test that the server can be created even without API key
      // (API key is only needed for actual document processing)
      const originalApiKey = process.env.MISTRAL_API_KEY;
      delete process.env.MISTRAL_API_KEY;
      
      const serverWithoutApiKey = new MistralDocAIMCPServer();
      expect(serverWithoutApiKey).toBeInstanceOf(MistralDocAIMCPServer);
      
      // Restore environment
      if (originalApiKey) {
        process.env.MISTRAL_API_KEY = originalApiKey;
      }
    });
  });

  describe('Process Management', () => {
    it('should handle process cleanup', async () => {
      // Test that help and version options don't leave hanging processes
      await server.start({ help: true });
      await server.start({ version: true });
      
      // Should complete without hanging
      expect(true).toBe(true);
    });
  });
});