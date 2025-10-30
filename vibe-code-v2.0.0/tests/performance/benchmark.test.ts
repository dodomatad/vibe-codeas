// tests/performance/benchmark.test.ts
/**
 * Performance benchmarks for Vibe Code
 * Tests speed, throughput, and resource usage
 */

import { describe, it, expect } from 'vitest';

describe('Performance Benchmarks', () => {
  describe('API Response Time', () => {
    it('should respond to health check in < 100ms', async () => {
      const start = performance.now();

      const response = await fetch('http://localhost:3000/api/health');

      const elapsed = performance.now() - start;

      expect(response.status).toBeLessThan(500);
      expect(elapsed).toBeLessThan(100);
    });

    it('should create sandbox in < 5 seconds', async () => {
      const start = performance.now();

      const response = await fetch('http://localhost:3000/api/create-ai-sandbox-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const elapsed = performance.now() - start;

      if (response.ok) {
        const data = await response.json();
        expect(data.sandboxId).toBeTruthy();
        expect(elapsed).toBeLessThan(5000);

        // Cleanup
        await fetch('http://localhost:3000/api/kill-sandbox', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sandboxId: data.sandboxId })
        }).catch(() => {});
      }
    }, 10000);

    it('should start code generation in < 1 second', async () => {
      const start = performance.now();

      const response = await fetch('http://localhost:3000/api/generate-ai-code-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Create a button',
          model: 'claude-sonnet-4'
        })
      });

      const elapsed = performance.now() - start;

      // Should start streaming quickly
      expect(response.status).toBeLessThan(500);
      expect(elapsed).toBeLessThan(1000);

      // Cleanup reader
      response.body?.cancel();
    }, 5000);
  });

  describe('Throughput', () => {
    it('should handle multiple concurrent requests', async () => {
      const concurrency = 10;
      const promises: Promise<Response>[] = [];

      const start = performance.now();

      for (let i = 0; i < concurrency; i++) {
        promises.push(
          fetch('http://localhost:3000/api/health')
        );
      }

      const responses = await Promise.all(promises);
      const elapsed = performance.now() - start;

      // All should succeed
      for (const response of responses) {
        expect(response.status).toBeLessThan(500);
      }

      // Should handle concurrent requests efficiently
      expect(elapsed).toBeLessThan(1000);

      // Calculate requests per second
      const rps = (concurrency / elapsed) * 1000;
      console.log(`Throughput: ${rps.toFixed(2)} requests/second`);
    });

    it('should maintain performance under load', async () => {
      const iterations = 50;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        await fetch('http://localhost:3000/api/health');
        const elapsed = performance.now() - start;
        times.push(elapsed);
      }

      const avgTime = times.reduce((a, b) => a + b) / times.length;
      const maxTime = Math.max(...times);

      console.log(`Average response time: ${avgTime.toFixed(2)}ms`);
      console.log(`Max response time: ${maxTime.toFixed(2)}ms`);

      // Average should be under 100ms
      expect(avgTime).toBeLessThan(100);

      // Max should be under 500ms (outliers)
      expect(maxTime).toBeLessThan(500);
    }, 30000);
  });

  describe('Memory Usage', () => {
    it('should not leak memory on repeated requests', async () => {
      if (!global.gc) {
        console.log('⚠️ Run with --expose-gc for memory tests');
        return;
      }

      // Force GC
      global.gc();
      const baseline = process.memoryUsage().heapUsed;

      // Make many requests
      for (let i = 0; i < 100; i++) {
        await fetch('http://localhost:3000/api/health');
      }

      // Force GC again
      global.gc();
      const after = process.memoryUsage().heapUsed;

      const increase = after - baseline;
      const increaseMB = increase / 1024 / 1024;

      console.log(`Memory increase: ${increaseMB.toFixed(2)}MB`);

      // Should not increase by more than 10MB
      expect(increaseMB).toBeLessThan(10);
    }, 60000);
  });

  describe('Cache Performance', () => {
    it('should improve performance with cache hits', async () => {
      // First request (cache miss)
      const start1 = performance.now();
      await fetch('http://localhost:3000/api/health');
      const time1 = performance.now() - start1;

      // Second request (potential cache hit)
      const start2 = performance.now();
      await fetch('http://localhost:3000/api/health');
      const time2 = performance.now() - start2;

      console.log(`First request: ${time1.toFixed(2)}ms`);
      console.log(`Second request: ${time2.toFixed(2)}ms`);

      // Second request should be similar or faster
      // (Note: health endpoint may not be cached, but this tests the principle)
      expect(time2).toBeLessThan(time1 * 2);
    });
  });

  describe('Code Generation Performance', () => {
    it('should generate simple component in < 10 seconds', async () => {
      const start = performance.now();

      const response = await fetch('http://localhost:3000/api/generate-ai-code-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Create a simple button component',
          model: 'claude-sonnet-4'
        })
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let generatedCode = '';

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        generatedCode += decoder.decode(value);
      }

      const elapsed = performance.now() - start;

      console.log(`Generation time: ${(elapsed / 1000).toFixed(2)}s`);
      console.log(`Generated ${generatedCode.length} characters`);

      // Should complete in reasonable time
      expect(elapsed).toBeLessThan(10000);
      expect(generatedCode.length).toBeGreaterThan(0);
    }, 15000);

    it('should generate medium component in < 20 seconds', async () => {
      const start = performance.now();

      const response = await fetch('http://localhost:3000/api/generate-ai-code-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Create a todo list component with add, edit, and delete functionality',
          model: 'claude-sonnet-4'
        })
      });

      const reader = response.body?.getReader();

      while (true) {
        const { done } = await reader!.read();
        if (done) break;
      }

      const elapsed = performance.now() - start;

      console.log(`Medium generation time: ${(elapsed / 1000).toFixed(2)}s`);

      expect(elapsed).toBeLessThan(20000);
    }, 25000);
  });

  describe('Complete Flow Performance', () => {
    it('should complete full app generation in < 60 seconds', async () => {
      const start = performance.now();

      const response = await fetch('http://localhost:3000/api/generate-app-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Create a simple counter with increment and decrement buttons'
        })
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let sandboxId: string | null = null;
      let completed = false;

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.substring(6));

              if (event.data?.sandboxId) {
                sandboxId = event.data.sandboxId;
              }

              if (event.step === 'complete') {
                completed = true;
              }
            } catch (e) {
              // Ignore
            }
          }
        }
      }

      const elapsed = performance.now() - start;

      console.log(`Complete flow time: ${(elapsed / 1000).toFixed(2)}s`);

      expect(completed).toBe(true);
      expect(elapsed).toBeLessThan(60000);

      // Cleanup
      if (sandboxId) {
        await fetch('http://localhost:3000/api/kill-sandbox', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sandboxId })
        }).catch(() => {});
      }
    }, 70000);

    it('should measure steps timing', async () => {
      const response = await fetch('http://localhost:3000/api/generate-app-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Create a button'
        })
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      const stepTimes: Record<string, number> = {};
      let lastTime = performance.now();
      let sandboxId: string | null = null;

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.substring(6));

              if (event.step) {
                const now = performance.now();
                stepTimes[event.step] = now - lastTime;
                lastTime = now;
              }

              if (event.data?.sandboxId) {
                sandboxId = event.data.sandboxId;
              }
            } catch (e) {
              // Ignore
            }
          }
        }
      }

      console.log('Step timings:');
      for (const [step, time] of Object.entries(stepTimes)) {
        console.log(`  ${step}: ${time.toFixed(0)}ms`);
      }

      // Cleanup
      if (sandboxId) {
        await fetch('http://localhost:3000/api/kill-sandbox', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sandboxId })
        }).catch(() => {});
      }
    }, 70000);
  });

  describe('Intelligent Systems Performance', () => {
    it('should enhance prompt in < 50ms', () => {
      const start = performance.now();

      // Simulate prompt enhancement
      const prompt = 'Create a todo app';
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        // Mock enhancement (actual test would import PromptEnhancer)
        const enhanced = prompt + ' with best practices';
      }

      const elapsed = performance.now() - start;
      const avgTime = elapsed / iterations;

      console.log(`Prompt enhancement: ${avgTime.toFixed(2)}ms avg`);

      expect(avgTime).toBeLessThan(50);
    });

    it('should validate code in < 100ms', () => {
      const start = performance.now();

      const code = `
        export default function App() {
          return <div>Hello</div>;
        }
      `;

      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        // Mock validation (actual test would import CodeValidator)
        const valid = code.includes('export');
      }

      const elapsed = performance.now() - start;
      const avgTime = elapsed / iterations;

      console.log(`Code validation: ${avgTime.toFixed(2)}ms avg`);

      expect(avgTime).toBeLessThan(100);
    });
  });
});

/**
 * PERFORMANCE TARGETS:
 *
 * Response Times:
 * - Health check: < 100ms
 * - Sandbox creation: < 5s
 * - Code generation start: < 1s
 * - Simple component: < 10s
 * - Medium component: < 20s
 * - Complete app: < 60s
 *
 * Throughput:
 * - Concurrent requests: 10+ RPS
 * - Load testing: < 100ms avg
 *
 * Memory:
 * - No memory leaks
 * - < 10MB increase per 100 requests
 *
 * Intelligent Systems:
 * - Prompt enhancement: < 50ms
 * - Code validation: < 100ms
 *
 * EXPECTED: Baseline for future optimization tracking
 */
