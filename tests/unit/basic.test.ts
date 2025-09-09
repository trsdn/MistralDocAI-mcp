import { describe, it, expect } from '@jest/globals';
import MistralDocAIMCPServer from '../../src/index';

describe('Basic Tests', () => {
  describe('MistralDocAIMCPServer', () => {
    it('should create server instance', () => {
      const server = new MistralDocAIMCPServer();
      expect(server).toBeInstanceOf(MistralDocAIMCPServer);
    });

    it('should have basic functionality', () => {
      // Just test that the class exists and can be instantiated
      const server = new MistralDocAIMCPServer();
      expect(server).toBeDefined();
      expect(typeof server.start).toBe('function');
    });
  });

  describe('Environment', () => {
    it('should have test environment set up', () => {
      expect(process.env.NODE_ENV).toBe('test');
      expect(process.env.MISTRAL_API_KEY).toBe('test-api-key-for-testing');
    });
  });
});