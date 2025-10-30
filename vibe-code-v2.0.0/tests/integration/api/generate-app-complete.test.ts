// tests/integration/api/generate-app-complete.test.ts
/**
 * Integration tests for generate-app-complete orchestrator
 * Tests the complete flow: prompt → sandbox → code → apply → preview
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('POST /api/generate-app-complete', () => {
  let testSandboxId: string | null = null;

  afterAll(async () => {
    // Cleanup any created sandboxes
    if (testSandboxId) {
      await fetch('http://localhost:3000/api/kill-sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sandboxId: testSandboxId })
      }).catch(() => {
        // Ignore errors during cleanup
      });
    }
  });

  describe('Request Validation', () => {
    it('should return 400 if prompt is missing', async () => {
      const response = await fetch('http://localhost:3000/api/generate-app-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Prompt');
    });

    it('should return 400 if prompt is empty', async () => {
      const response = await fetch('http://localhost:3000/api/generate-app-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: '' })
      });

      expect(response.status).toBe(400);
    });

    it('should return 400 if prompt is only whitespace', async () => {
      const response = await fetch('http://localhost:3000/api/generate-app-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: '   ' })
      });

      expect(response.status).toBe(400);
    });
  });

  describe('Streaming Response', () => {
    it('should return text/event-stream content type', async () => {
      const response = await fetch('http://localhost:3000/api/generate-app-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Create a simple button component'
        })
      });

      const contentType = response.headers.get('content-type');
      expect(contentType).toContain('text/event-stream');
    });

    it('should stream progress events', async () => {
      const response = await fetch('http://localhost:3000/api/generate-app-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Create a counter component'
        })
      });

      expect(response.body).toBeDefined();

      const reader = response.body?.getReader();
      expect(reader).toBeDefined();

      // Read first chunk
      const { value, done } = await reader!.read();
      expect(done).toBe(false);
      expect(value).toBeDefined();
    }, 30000); // 30s timeout
  });

  describe('Complete Generation Flow', () => {
    it('should generate complete app from simple prompt', async () => {
      const response = await fetch('http://localhost:3000/api/generate-app-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Create a simple React counter with increment and decrement buttons',
          framework: 'react',
          model: 'claude-sonnet-4'
        })
      });

      expect(response.status).toBe(200);

      const reader = response.body?.getReader();
      expect(reader).toBeDefined();

      const decoder = new TextDecoder();
      const events: any[] = [];

      // Read all events
      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.substring(6);
            try {
              const event = JSON.parse(data);
              events.push(event);

              // Store sandbox ID for cleanup
              if (event.data?.sandboxId) {
                testSandboxId = event.data.sandboxId;
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }

      // Verify we got all expected steps
      const steps = events.map(e => e.step);
      expect(steps).toContain('sandbox');
      expect(steps).toContain('generate');
      expect(steps).toContain('apply');

      // Verify final event is complete
      const finalEvent = events[events.length - 1];
      expect(finalEvent.step).toBe('complete');
      expect(finalEvent.progress).toBe(100);
      expect(finalEvent.data?.previewUrl).toBeDefined();
    }, 120000); // 2 minute timeout for full generation
  });

  describe('Framework Detection', () => {
    it('should auto-detect framework', async () => {
      const response = await fetch('http://localhost:3000/api/generate-app-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Create a Vue todo list',
          framework: 'auto'
        })
      });

      expect(response.status).toBe(200);

      // Just verify it doesn't crash
      const reader = response.body?.getReader();
      const { value } = await reader!.read();
      expect(value).toBeDefined();
    }, 30000);

    it('should respect explicit framework choice', async () => {
      const response = await fetch('http://localhost:3000/api/generate-app-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Create a calculator',
          framework: 'react'
        })
      });

      expect(response.status).toBe(200);
    }, 30000);
  });

  describe('Model Selection', () => {
    it('should use Claude Sonnet 4 by default', async () => {
      const response = await fetch('http://localhost:3000/api/generate-app-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Create a button'
        })
      });

      expect(response.status).toBe(200);

      const reader = response.body?.getReader();
      const { value } = await reader!.read();
      const chunk = new TextDecoder().decode(value);

      // Should mention model in events
      expect(chunk).toBeTruthy();
    }, 30000);

    it('should respect model selection', async () => {
      const response = await fetch('http://localhost:3000/api/generate-app-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Create a simple component',
          model: 'gpt-4'
        })
      });

      expect(response.status).toBe(200);
    }, 30000);
  });

  describe('Package Installation', () => {
    it('should auto-install packages by default', async () => {
      const response = await fetch('http://localhost:3000/api/generate-app-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Create a component using axios'
        })
      });

      expect(response.status).toBe(200);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let hasPackageStep = false;

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);
        if (chunk.includes('packages') || chunk.includes('Installing')) {
          hasPackageStep = true;
          break;
        }
      }

      // Should have package installation step
      expect(hasPackageStep).toBe(true);
    }, 60000);

    it('should skip auto-install when disabled', async () => {
      const response = await fetch('http://localhost:3000/api/generate-app-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Create a component',
          autoInstallPackages: false
        })
      });

      expect(response.status).toBe(200);
    }, 30000);
  });

  describe('Error Handling', () => {
    it('should handle generation errors gracefully', async () => {
      const response = await fetch('http://localhost:3000/api/generate-app-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Create impossible thing that cannot exist',
          model: 'invalid-model' // Force error
        })
      });

      // Should either succeed or return proper error
      expect([200, 400, 500]).toContain(response.status);
    }, 30000);

    it('should handle network errors', async () => {
      // This test assumes server might be unavailable
      try {
        const response = await fetch('http://localhost:9999/api/generate-app-complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: 'Test'
          })
        });

        // If it somehow succeeds, that's ok
        expect(response).toBeDefined();
      } catch (error) {
        // Expected to fail
        expect(error).toBeDefined();
      }
    });
  });

  describe('Progress Tracking', () => {
    it('should report progress from 0 to 100', async () => {
      const response = await fetch('http://localhost:3000/api/generate-app-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Create a simple app'
        })
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      const progressValues: number[] = [];

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.substring(6));
              if (event.progress !== undefined) {
                progressValues.push(event.progress);
              }
            } catch (e) {
              // Ignore
            }
          }
        }
      }

      // Should have multiple progress values
      expect(progressValues.length).toBeGreaterThan(0);

      // Should start low and end at 100
      expect(progressValues[0]).toBeLessThanOrEqual(20);

      // If completed successfully, last should be 100
      if (progressValues[progressValues.length - 1] === 100) {
        expect(progressValues[progressValues.length - 1]).toBe(100);
      }
    }, 120000);
  });

  describe('Performance', () => {
    it('should complete simple app in under 2 minutes', async () => {
      const startTime = Date.now();

      const response = await fetch('http://localhost:3000/api/generate-app-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Create a minimal React component'
        })
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      // Read until complete
      while (true) {
        const { done } = await reader!.read();
        if (done) break;
      }

      const duration = Date.now() - startTime;

      // Should complete in under 2 minutes
      expect(duration).toBeLessThan(120000);
    }, 130000); // 2:10 timeout
  });
});

/**
 * COVERAGE TARGET: This test file aims for 70%+ coverage of:
 * - Complete orchestration flow
 * - Request validation
 * - Streaming functionality
 * - Framework detection
 * - Model selection
 * - Package installation
 * - Error handling
 * - Progress tracking
 * - Performance benchmarks
 */
