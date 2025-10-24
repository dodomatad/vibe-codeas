// tests/setup/vitest.setup.ts
/**
 * Vitest Global Setup
 * Configuração central para todos os testes
 */

import { beforeAll, afterAll, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Setup global antes de todos os testes
beforeAll(() => {
  // Mock environment variables
  process.env.NODE_ENV = 'test';
  process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key-mock';
  process.env.OPENAI_API_KEY = 'sk-test-key-mock';
  
  // Mock console para reduzir noise
  global.console = {
    ...console,
    error: vi.fn(),
    warn: vi.fn(),
  };
});

// Cleanup após cada teste
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Cleanup global após todos os testes
afterAll(() => {
  vi.restoreAllMocks();
});
