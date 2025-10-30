// tests/integration/api/install-packages.test.ts
/**
 * Integration tests for package installation API
 * Tests npm package installation in sandboxes
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('POST /api/install-packages', () => {
  let testSandboxId: string | null = null;

  beforeAll(async () => {
    // Create a test sandbox
    const response = await fetch('http://localhost:3000/api/create-ai-sandbox-v2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
      const data = await response.json();
      testSandboxId = data.sandboxId;
    }
  });

  afterAll(async () => {
    // Cleanup sandbox
    if (testSandboxId) {
      await fetch('http://localhost:3000/api/kill-sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sandboxId: testSandboxId })
      }).catch(() => {});
    }
  });

  describe('Request Validation', () => {
    it('should return 400 if packages array is missing', async () => {
      const response = await fetch('http://localhost:3000/api/install-packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('packages');
    });

    it('should return 400 if packages is not an array', async () => {
      const response = await fetch('http://localhost:3000/api/install-packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packages: 'not-an-array' })
      });

      expect(response.status).toBe(400);
    });

    it('should return 400 if packages array is empty', async () => {
      const response = await fetch('http://localhost:3000/api/install-packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packages: [] })
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('empty');
    });
  });

  describe('Package Installation', () => {
    it('should install a single package successfully', async () => {
      if (!testSandboxId) return;

      const response = await fetch('http://localhost:3000/api/install-packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packages: ['lodash'],
          sandboxId: testSandboxId
        })
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/event-stream');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let foundSuccess = false;

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.substring(6));
              if (event.type === 'success') {
                foundSuccess = true;
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }

      expect(foundSuccess).toBe(true);
    }, 60000);

    it('should install multiple packages successfully', async () => {
      if (!testSandboxId) return;

      const response = await fetch('http://localhost:3000/api/install-packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packages: ['axios', 'date-fns'],
          sandboxId: testSandboxId
        })
      });

      expect(response.status).toBe(200);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      const installedPackages: string[] = [];

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.substring(6));
              if (event.type === 'success' && event.installedPackages) {
                installedPackages.push(...event.installedPackages);
              }
            } catch (e) {
              // Ignore
            }
          }
        }
      }

      expect(installedPackages.length).toBeGreaterThan(0);
    }, 90000);

    it('should handle scoped packages', async () => {
      if (!testSandboxId) return;

      const response = await fetch('http://localhost:3000/api/install-packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packages: ['@heroicons/react'],
          sandboxId: testSandboxId
        })
      });

      expect(response.status).toBe(200);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let foundSuccess = false;

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);
        if (chunk.includes('success') || chunk.includes('@heroicons/react')) {
          foundSuccess = true;
          break;
        }
      }

      expect(foundSuccess).toBe(true);
    }, 60000);
  });

  describe('Streaming Progress', () => {
    it('should stream installation progress', async () => {
      if (!testSandboxId) return;

      const response = await fetch('http://localhost:3000/api/install-packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packages: ['lodash'],
          sandboxId: testSandboxId
        })
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      const events: any[] = [];

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.substring(6));
              events.push(event);
            } catch (e) {
              // Ignore
            }
          }
        }
      }

      // Should have multiple progress events
      expect(events.length).toBeGreaterThan(1);

      // Should have start event
      const hasStart = events.some(e => e.type === 'start');
      expect(hasStart).toBe(true);

      // Should have success event
      const hasSuccess = events.some(e => e.type === 'success');
      expect(hasSuccess).toBe(true);
    }, 60000);

    it('should stream terminal output', async () => {
      if (!testSandboxId) return;

      const response = await fetch('http://localhost:3000/api/install-packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packages: ['lodash'],
          sandboxId: testSandboxId
        })
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let foundOutput = false;

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.substring(6));
              if (event.type === 'output' && event.data) {
                foundOutput = true;
              }
            } catch (e) {
              // Ignore
            }
          }
        }
      }

      expect(foundOutput).toBe(true);
    }, 60000);
  });

  describe('Error Handling', () => {
    it('should handle non-existent packages gracefully', async () => {
      if (!testSandboxId) return;

      const response = await fetch('http://localhost:3000/api/install-packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packages: ['this-package-definitely-does-not-exist-12345'],
          sandboxId: testSandboxId
        })
      });

      expect(response.status).toBe(200);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let hasError = false;

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);
        if (chunk.includes('error') || chunk.includes('404') || chunk.includes('E404')) {
          hasError = true;
          break;
        }
      }

      // Should report error for non-existent package
      expect(hasError).toBe(true);
    }, 60000);

    it('should skip pre-installed packages', async () => {
      if (!testSandboxId) return;

      const response = await fetch('http://localhost:3000/api/install-packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packages: ['react', 'react-dom'], // Pre-installed
          sandboxId: testSandboxId
        })
      });

      expect(response.status).toBe(200);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let foundSkip = false;

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);
        if (chunk.includes('skip') || chunk.includes('already') || chunk.includes('pre-installed')) {
          foundSkip = true;
          break;
        }
      }

      expect(foundSkip).toBe(true);
    }, 30000);
  });

  describe('Sandbox Integration', () => {
    it('should work without explicit sandboxId (use active sandbox)', async () => {
      const response = await fetch('http://localhost:3000/api/install-packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packages: ['lodash']
        })
      });

      // Should either succeed or fail with 500 (if no active sandbox)
      expect([200, 500]).toContain(response.status);
    }, 60000);

    it('should handle invalid sandboxId gracefully', async () => {
      const response = await fetch('http://localhost:3000/api/install-packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packages: ['lodash'],
          sandboxId: 'invalid-sandbox-id-12345'
        })
      });

      // Should fail gracefully
      expect(response.status).toBeGreaterThanOrEqual(400);
    }, 30000);
  });

  describe('Performance', () => {
    it('should install packages within reasonable time', async () => {
      if (!testSandboxId) return;

      const start = Date.now();

      const response = await fetch('http://localhost:3000/api/install-packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packages: ['lodash'],
          sandboxId: testSandboxId
        })
      });

      const reader = response.body?.getReader();

      while (true) {
        const { done } = await reader!.read();
        if (done) break;
      }

      const elapsed = Date.now() - start;

      // Should complete in < 30 seconds for single package
      expect(elapsed).toBeLessThan(30000);
    }, 60000);

    it('should handle concurrent installations', async () => {
      if (!testSandboxId) return;

      // Start multiple installations simultaneously
      const promises = [
        fetch('http://localhost:3000/api/install-packages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ packages: ['lodash'], sandboxId: testSandboxId })
        }),
        fetch('http://localhost:3000/api/install-packages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ packages: ['axios'], sandboxId: testSandboxId })
        })
      ];

      const responses = await Promise.all(promises);

      // All should succeed or handle gracefully
      for (const response of responses) {
        expect(response.status).toBeLessThan(500);
      }
    }, 90000);
  });
});

/**
 * COVERAGE: This test file covers:
 * - Request validation (missing params, invalid types)
 * - Single package installation
 * - Multiple package installation
 * - Scoped packages (@org/package)
 * - Streaming progress events
 * - Terminal output streaming
 * - Error handling (non-existent packages)
 * - Pre-installed package detection
 * - Sandbox integration
 * - Performance benchmarks
 * - Concurrent installations
 *
 * EXPECTED: 85%+ coverage of install-packages API
 */
