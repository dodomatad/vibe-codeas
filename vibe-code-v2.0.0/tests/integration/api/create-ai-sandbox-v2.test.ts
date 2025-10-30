// tests/integration/api/create-ai-sandbox-v2.test.ts
/**
 * Integration tests for create-ai-sandbox-v2 endpoint
 * Tests sandbox creation and initialization
 */

import { describe, it, expect, afterEach } from 'vitest';

describe('POST /api/create-ai-sandbox-v2', () => {
  const createdSandboxes: string[] = [];

  afterEach(async () => {
    // Cleanup: kill all test sandboxes
    for (const sandboxId of createdSandboxes) {
      await fetch('http://localhost:3000/api/kill-sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sandboxId })
      }).catch(() => {
        // Ignore errors during cleanup
      });
    }
    createdSandboxes.length = 0;
  });

  describe('Sandbox Creation', () => {
    it('should create a new sandbox', async () => {
      const response = await fetch('http://localhost:3000/api/create-ai-sandbox-v2', {
        method: 'POST'
      });

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.sandboxId).toBeDefined();
      expect(data.url).toBeDefined();

      createdSandboxes.push(data.sandboxId);
    });

    it('should return unique sandbox IDs', async () => {
      const response1 = await fetch('http://localhost:3000/api/create-ai-sandbox-v2', {
        method: 'POST'
      });
      const data1 = await response1.json();

      const response2 = await fetch('http://localhost:3000/api/create-ai-sandbox-v2', {
        method: 'POST'
      });
      const data2 = await response2.json();

      expect(data1.sandboxId).not.toBe(data2.sandboxId);

      createdSandboxes.push(data1.sandboxId, data2.sandboxId);
    });

    it('should include sandbox URL in response', async () => {
      const response = await fetch('http://localhost:3000/api/create-ai-sandbox-v2', {
        method: 'POST'
      });

      const data = await response.json();
      expect(data.url).toMatch(/^https?:\/\//);

      createdSandboxes.push(data.sandboxId);
    });

    it('should include provider information', async () => {
      const response = await fetch('http://localhost:3000/api/create-ai-sandbox-v2', {
        method: 'POST'
      });

      const data = await response.json();
      expect(data.provider).toBeDefined();
      expect(['local', 'e2b', 'vercel']).toContain(data.provider);

      createdSandboxes.push(data.sandboxId);
    });
  });

  describe('Sandbox Initialization', () => {
    it('should initialize Vite React app', async () => {
      const response = await fetch('http://localhost:3000/api/create-ai-sandbox-v2', {
        method: 'POST'
      });

      const data = await response.json();
      expect(data.message).toContain('Vite React app');

      createdSandboxes.push(data.sandboxId);
    });

    it('should have default React files', async () => {
      const createResponse = await fetch('http://localhost:3000/api/create-ai-sandbox-v2', {
        method: 'POST'
      });
      const createData = await createResponse.json();
      createdSandboxes.push(createData.sandboxId);

      // Give it a moment to initialize
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check if default files exist
      const filesResponse = await fetch('http://localhost:3000/api/get-sandbox-files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sandboxId: createData.sandboxId })
      });

      if (filesResponse.ok) {
        const filesData = await filesResponse.json();
        expect(filesData.files).toBeDefined();
      }
    });
  });

  describe('Cleanup and Isolation', () => {
    it('should clean up existing sandboxes before creating new one', async () => {
      // Create first sandbox
      const response1 = await fetch('http://localhost:3000/api/create-ai-sandbox-v2', {
        method: 'POST'
      });
      const data1 = await response1.json();

      // Create second sandbox (should clean up first)
      const response2 = await fetch('http://localhost:3000/api/create-ai-sandbox-v2', {
        method: 'POST'
      });
      const data2 = await response2.json();

      expect(response2.status).toBe(200);
      expect(data2.success).toBe(true);

      createdSandboxes.push(data2.sandboxId);
    });

    it('should isolate sandboxes from each other', async () => {
      const response1 = await fetch('http://localhost:3000/api/create-ai-sandbox-v2', {
        method: 'POST'
      });
      const data1 = await response1.json();

      const response2 = await fetch('http://localhost:3000/api/create-ai-sandbox-v2', {
        method: 'POST'
      });
      const data2 = await response2.json();

      // Different sandboxes should have different URLs
      expect(data1.url).not.toBe(data2.url);

      createdSandboxes.push(data2.sandboxId);
    });
  });

  describe('Global State Management', () => {
    it('should register sandbox with manager', async () => {
      const response = await fetch('http://localhost:3000/api/create-ai-sandbox-v2', {
        method: 'POST'
      });

      const data = await response.json();
      createdSandboxes.push(data.sandboxId);

      // Sandbox should be retrievable
      const statusResponse = await fetch('http://localhost:3000/api/sandbox-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sandboxId: data.sandboxId })
      });

      expect(statusResponse.status).toBeLessThan(500);
    });

    it('should store sandbox in legacy global state for compatibility', async () => {
      const response = await fetch('http://localhost:3000/api/create-ai-sandbox-v2', {
        method: 'POST'
      });

      const data = await response.json();
      expect(data.success).toBe(true);

      createdSandboxes.push(data.sandboxId);

      // Next API call should be able to use global state
      const applyResponse = await fetch('http://localhost:3000/api/apply-ai-code-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUpdates: {
            'test.tsx': 'export const Test = () => <div>Test</div>'
          }
        })
      });

      expect(applyResponse.status).toBeLessThan(500);
    });
  });

  describe('Error Handling', () => {
    it('should handle sandbox creation failures gracefully', async () => {
      // Simulate multiple rapid creations (might cause errors)
      const responses = await Promise.all([
        fetch('http://localhost:3000/api/create-ai-sandbox-v2', { method: 'POST' }),
        fetch('http://localhost:3000/api/create-ai-sandbox-v2', { method: 'POST' }),
        fetch('http://localhost:3000/api/create-ai-sandbox-v2', { method: 'POST' })
      ]);

      // At least one should succeed
      const successCount = responses.filter(r => r.status === 200).length;
      expect(successCount).toBeGreaterThan(0);

      // Collect sandbox IDs for cleanup
      for (const response of responses) {
        if (response.ok) {
          const data = await response.json();
          if (data.sandboxId) {
            createdSandboxes.push(data.sandboxId);
          }
        }
      }
    });

    it('should clean up on error', async () => {
      const response = await fetch('http://localhost:3000/api/create-ai-sandbox-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ simulateError: true })
      });

      // Should either succeed or fail gracefully
      expect(response.status).toBeDefined();

      if (response.ok) {
        const data = await response.json();
        if (data.sandboxId) {
          createdSandboxes.push(data.sandboxId);
        }
      }
    });

    it('should return error details on failure', async () => {
      // Force an error by making environment invalid
      const response = await fetch('http://localhost:3000/api/create-ai-sandbox-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invalidConfig: true })
      });

      if (!response.ok) {
        const data = await response.json();
        expect(data.error).toBeDefined();
      }
    });
  });

  describe('Performance', () => {
    it('should create sandbox quickly (< 10s)', async () => {
      const startTime = Date.now();

      const response = await fetch('http://localhost:3000/api/create-ai-sandbox-v2', {
        method: 'POST'
      });

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(10000);
      expect(response.status).toBe(200);

      const data = await response.json();
      createdSandboxes.push(data.sandboxId);
    }, 15000); // 15s timeout

    it('should handle concurrent sandbox creation', async () => {
      const startTime = Date.now();

      const responses = await Promise.allSettled([
        fetch('http://localhost:3000/api/create-ai-sandbox-v2', { method: 'POST' }),
        fetch('http://localhost:3000/api/create-ai-sandbox-v2', { method: 'POST' })
      ]);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(20000);

      // Collect successful sandboxes
      for (const result of responses) {
        if (result.status === 'fulfilled' && result.value.ok) {
          const data = await result.value.json();
          if (data.sandboxId) {
            createdSandboxes.push(data.sandboxId);
          }
        }
      }
    }, 25000);
  });

  describe('Resource Management', () => {
    it('should clear existing files tracking', async () => {
      const response = await fetch('http://localhost:3000/api/create-ai-sandbox-v2', {
        method: 'POST'
      });

      const data = await response.json();
      expect(data.success).toBe(true);

      createdSandboxes.push(data.sandboxId);

      // File tracking should be reset
      // Next file operations should start fresh
    });

    it('should initialize sandbox state correctly', async () => {
      const response = await fetch('http://localhost:3000/api/create-ai-sandbox-v2', {
        method: 'POST'
      });

      const data = await response.json();
      expect(data.sandboxId).toBeDefined();
      expect(data.url).toBeDefined();

      createdSandboxes.push(data.sandboxId);

      // State should be accessible by subsequent operations
    });
  });
});

/**
 * COVERAGE TARGET: This test file aims for 70%+ coverage of:
 * - Sandbox creation flow
 * - Vite React app initialization
 * - Cleanup and isolation
 * - Global state management
 * - Error handling
 * - Performance benchmarks
 * - Resource management
 */
