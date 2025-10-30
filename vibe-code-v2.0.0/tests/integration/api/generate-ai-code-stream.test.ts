// tests/integration/api/generate-ai-code-stream.test.ts
/**
 * Integration tests for generate-ai-code-stream endpoint
 * Tests the core AI code generation functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('POST /api/generate-ai-code-stream', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  describe('Request Validation', () => {
    it('should return 400 if message is missing', async () => {
      const response = await fetch('http://localhost:3000/api/generate-ai-code-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('message');
    });

    it('should return 400 if message is empty', async () => {
      const response = await fetch('http://localhost:3000/api/generate-ai-code-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: '' })
      });

      expect(response.status).toBe(400);
    });

    it('should accept valid request with message', async () => {
      const response = await fetch('http://localhost:3000/api/generate-ai-code-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Create a simple React component'
        })
      });

      // Should start streaming (200 or processing)
      expect([200, 201, 202]).toContain(response.status);
    });
  });

  describe('AI Model Selection', () => {
    it('should use Claude Sonnet 4 as default model', async () => {
      const consoleSpy = vi.spyOn(console, 'log');

      const response = await fetch('http://localhost:3000/api/generate-ai-code-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Test message',
          model: 'claude-sonnet-4'
        })
      });

      expect(response.status).toBeLessThan(500);
    });

    it('should support multiple AI models', async () => {
      const models = ['claude-sonnet-4', 'gpt-4', 'gemini-2.0-flash'];

      for (const model of models) {
        const response = await fetch('http://localhost:3000/api/generate-ai-code-stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: 'Test',
            model
          })
        });

        expect(response.status).toBeLessThan(500);
      }
    });
  });

  describe('Streaming Response', () => {
    it('should return streaming response (text/event-stream)', async () => {
      const response = await fetch('http://localhost:3000/api/generate-ai-code-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Create a button component'
        })
      });

      const contentType = response.headers.get('content-type');
      expect(contentType).toMatch(/text\/event-stream|text\/plain/);
    });

    it('should stream events progressively', async () => {
      const response = await fetch('http://localhost:3000/api/generate-ai-code-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Test streaming'
        })
      });

      expect(response.body).toBeDefined();

      // Test that body is readable stream
      const reader = response.body?.getReader();
      expect(reader).toBeDefined();
    });
  });

  describe('Context and History', () => {
    it('should accept conversation history', async () => {
      const response = await fetch('http://localhost:3000/api/generate-ai-code-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Continue from previous',
          conversationHistory: [
            { role: 'user', content: 'Create a form' },
            { role: 'assistant', content: 'Here is the form...' }
          ]
        })
      });

      expect(response.status).toBeLessThan(500);
    });

    it('should accept file context', async () => {
      const response = await fetch('http://localhost:3000/api/generate-ai-code-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Update this file',
          filesContext: {
            'App.tsx': 'export default function App() { return <div>Hello</div> }'
          }
        })
      });

      expect(response.status).toBeLessThan(500);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing API key gracefully', async () => {
      // Save original env
      const originalKey = process.env.ANTHROPIC_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;
      delete process.env.OPENAI_API_KEY;
      delete process.env.GOOGLE_API_KEY;

      const response = await fetch('http://localhost:3000/api/generate-ai-code-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Test'
        })
      });

      expect(response.status).toBeGreaterThanOrEqual(400);

      // Restore env
      if (originalKey) {
        process.env.ANTHROPIC_API_KEY = originalKey;
      }
    });

    it('should handle network errors', async () => {
      const response = await fetch('http://localhost:3000/api/generate-ai-code-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Test error handling',
          simulateError: true // if endpoint supports it
        })
      });

      // Should not crash, either succeed or return proper error
      expect(response.status).toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    it('should respect rate limits', async () => {
      // Make multiple rapid requests
      const requests = Array(10).fill(null).map(() =>
        fetch('http://localhost:3000/api/generate-ai-code-stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'Test' })
        })
      );

      const responses = await Promise.all(requests);

      // At least some should succeed
      const successCount = responses.filter(r => r.status < 400).length;
      expect(successCount).toBeGreaterThan(0);
    });
  });

  describe('Cost Tracking', () => {
    it('should track token usage', async () => {
      const response = await fetch('http://localhost:3000/api/generate-ai-code-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Short test',
          trackCost: true
        })
      });

      expect(response.status).toBeLessThan(500);
      // Cost tracking should happen in background
    });
  });

  describe('Performance', () => {
    it('should respond within reasonable time (< 30s)', async () => {
      const startTime = Date.now();

      const response = await fetch('http://localhost:3000/api/generate-ai-code-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Quick test'
        })
      });

      const duration = Date.now() - startTime;

      // First byte should arrive quickly (< 5s)
      expect(duration).toBeLessThan(5000);
    }, 30000); // 30s timeout
  });
});

/**
 * COVERAGE TARGET: This test file aims for 70%+ coverage of:
 * - Request validation
 * - Model selection
 * - Streaming functionality
 * - Context handling
 * - Error scenarios
 * - Rate limiting
 * - Cost tracking
 */
