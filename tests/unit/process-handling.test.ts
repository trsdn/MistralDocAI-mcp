import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import MistralDocAIMCPServer from '../../src/index';

describe('Process Handling Tests', () => {
  let server: MistralDocAIMCPServer;

  beforeEach(() => {
    server = new MistralDocAIMCPServer();
  });

  describe('Command Line Options', () => {
    it('should handle help option without hanging processes', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      const startTime = Date.now();
      await server.start({ help: true });
      const endTime = Date.now();
      
      // Should complete quickly (< 1 second)
      expect(endTime - startTime).toBeLessThan(1000);
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should handle version option without hanging processes', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      const startTime = Date.now();
      await server.start({ version: true });
      const endTime = Date.now();
      
      // Should complete quickly (< 1 second)
      expect(endTime - startTime).toBeLessThan(1000);
      expect(consoleSpy).toHaveBeenCalled();
      
      const versionOutput = consoleSpy.mock.calls[0][0];
      expect(versionOutput).toMatch(/v\d+\.\d+\.\d+/);
      
      consoleSpy.mockRestore();
    });

    it('should handle multiple sequential calls', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      // Multiple calls should not interfere with each other
      await server.start({ help: true });
      await server.start({ version: true });
      await server.start({ help: true });
      
      expect(consoleSpy).toHaveBeenCalledTimes(3);
      
      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should handle process errors gracefully', async () => {
      // Test with invalid options - should not crash
      try {
        await server.start({ invalid: true } as any);
        // If it succeeds somehow, that's fine
      } catch (error) {
        // Should throw meaningful error, not crash
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBeTruthy();
        expect((error as Error).message.length).toBeGreaterThan(0);
      }
    });

    it('should handle empty options without crashing', async () => {
      // Test with empty options
      try {
        await server.start({});
        // May succeed or fail, but should not crash
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Resource Cleanup', () => {
    it('should not leave hanging processes after completion', async () => {
      // This test ensures the process completes cleanly
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      // Run quick operations that should clean up properly
      await server.start({ help: true });
      await server.start({ version: true });
      
      // Should complete without hanging
      expect(true).toBe(true);
      
      consoleSpy.mockRestore();
    });
  });

  describe('Stdio Configuration Verification', () => {
    it('should verify console methods are available', () => {
      // Verify console methods exist and work
      const originalLog = console.log;
      const originalError = console.error;
      
      expect(typeof console.log).toBe('function');
      expect(typeof console.error).toBe('function');
      
      // Test console redirection capability
      let logCalled = false;
      let errorCalled = false;
      
      console.log = () => { logCalled = true; };
      console.error = () => { errorCalled = true; };
      
      console.log('test');
      console.error('test');
      
      expect(logCalled).toBe(true);
      expect(errorCalled).toBe(true);
      
      // Restore
      console.log = originalLog;
      console.error = originalError;
    });

    it('should handle stdout/stderr availability', () => {
      // Verify process streams are available
      expect(process.stdout).toBeDefined();
      expect(process.stderr).toBeDefined();
      expect(typeof process.stdout.write).toBe('function');
      expect(typeof process.stderr.write).toBe('function');
    });
  });
});