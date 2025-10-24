// tests/setup/test-utils.ts
/**
 * Test Utilities
 * Helpers compartilhados entre todos os testes
 */

import { vi } from 'vitest';

/**
 * Mock de fetch para testes de API
 */
export function mockFetch(response: any, status: number = 200) {
  return vi.fn(() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(response),
      text: () => Promise.resolve(JSON.stringify(response)),
    })
  );
}

/**
 * Mock de WebSocket para testes real-time
 */
export class MockWebSocket {
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  
  send = vi.fn();
  close = vi.fn();
  
  simulateOpen() {
    this.onopen?.(new Event('open'));
  }
  
  simulateMessage(data: any) {
    this.onmessage?.(new MessageEvent('message', { data }));
  }
  
  simulateError() {
    this.onerror?.(new Event('error'));
  }
  
  simulateClose() {
    this.onclose?.(new CloseEvent('close'));
  }
}

/**
 * Wait utility para testes assíncronos
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Mock de timers para testes
 */
export function setupTimers() {
  vi.useFakeTimers();
  return () => vi.useRealTimers();
}

/**
 * Mock de local storage
 */
export class MockStorage implements Storage {
  private store: Map<string, string> = new Map();
  
  get length() {
    return this.store.size;
  }
  
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] || null;
  }
  
  getItem(key: string): string | null {
    return this.store.get(key) || null;
  }
  
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
  
  removeItem(key: string): void {
    this.store.delete(key);
  }
  
  clear(): void {
    this.store.clear();
  }
}

/**
 * Test data factories
 */
export const createMockCostBreakdown = (overrides?: any) => ({
  model: 'claude-sonnet-4',
  inputTokens: 1000,
  outputTokens: 500,
  totalCost: 0.015,
  task: 'code-generation',
  requestId: 'test-req-123',
  cached: false,
  reasoning: false,
  ...overrides,
});

export const createMockUser = (overrides?: any) => ({
  id: 'test-user-123',
  email: 'test@example.com',
  name: 'Test User',
  ...overrides,
});
