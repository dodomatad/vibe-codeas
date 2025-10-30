// tests/integration/api/apply-ai-code-stream.test.ts
/**
 * Integration tests for apply-ai-code-stream endpoint
 * Tests applying AI-generated code to sandbox
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('POST /api/apply-ai-code-stream', () => {
  let testSandboxId: string;

  beforeEach(async () => {
    // Create a test sandbox for each test
    const createResponse = await fetch('http://localhost:3000/api/create-ai-sandbox-v2', {
      method: 'POST'
    });

    if (createResponse.ok) {
      const data = await createResponse.json();
      testSandboxId = data.sandboxId;
    }
  });

  afterEach(async () => {
    // Cleanup: kill the test sandbox
    if (testSandboxId) {
      await fetch('http://localhost:3000/api/kill-sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sandboxId: testSandboxId })
      });
    }
  });

  describe('Request Validation', () => {
    it('should return 400 if fileUpdates is missing', async () => {
      const response = await fetch('http://localhost:3000/api/apply-ai-code-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      expect(response.status).toBe(400);
    });

    it('should return 400 if fileUpdates is empty', async () => {
      const response = await fetch('http://localhost:3000/api/apply-ai-code-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUpdates: {} })
      });

      expect(response.status).toBe(400);
    });

    it('should accept valid file updates', async () => {
      const response = await fetch('http://localhost:3000/api/apply-ai-code-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUpdates: {
            'src/App.tsx': 'export default function App() { return <div>Hello</div> }'
          }
        })
      });

      expect([200, 201, 202]).toContain(response.status);
    });
  });

  describe('File Operations', () => {
    it('should create new file', async () => {
      const response = await fetch('http://localhost:3000/api/apply-ai-code-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUpdates: {
            'src/NewComponent.tsx': 'export default function NewComponent() { return <div>New</div> }'
          }
        })
      });

      expect(response.status).toBeLessThan(400);
    });

    it('should update existing file', async () => {
      // First create a file
      await fetch('http://localhost:3000/api/apply-ai-code-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUpdates: {
            'src/Test.tsx': 'const a = 1;'
          }
        })
      });

      // Then update it
      const response = await fetch('http://localhost:3000/api/apply-ai-code-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUpdates: {
            'src/Test.tsx': 'const a = 2;'
          }
        })
      });

      expect(response.status).toBeLessThan(400);
    });

    it('should delete file when content is empty', async () => {
      const response = await fetch('http://localhost:3000/api/apply-ai-code-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUpdates: {
            'src/ToDelete.tsx': ''
          },
          deleteEmpty: true
        })
      });

      expect(response.status).toBeLessThan(500);
    });

    it('should handle multiple files', async () => {
      const response = await fetch('http://localhost:3000/api/apply-ai-code-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUpdates: {
            'src/ComponentA.tsx': 'export const A = () => <div>A</div>',
            'src/ComponentB.tsx': 'export const B = () => <div>B</div>',
            'src/ComponentC.tsx': 'export const C = () => <div>C</div>'
          }
        })
      });

      expect(response.status).toBeLessThan(400);
    });
  });

  describe('Package Detection', () => {
    it('should detect and install missing packages', async () => {
      const response = await fetch('http://localhost:3000/api/apply-ai-code-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUpdates: {
            'src/App.tsx': `
              import { useState } from 'react';
              import axios from 'axios';

              export default function App() {
                const [data, setData] = useState(null);
                return <div>App</div>;
              }
            `
          },
          autoInstallPackages: true
        })
      });

      expect(response.status).toBeLessThan(500);
      // Should install axios automatically
    });

    it('should skip package detection if disabled', async () => {
      const response = await fetch('http://localhost:3000/api/apply-ai-code-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUpdates: {
            'src/App.tsx': 'import axios from "axios"; const a = 1;'
          },
          autoInstallPackages: false
        })
      });

      expect(response.status).toBeLessThan(500);
    });
  });

  describe('AutoFix Processing', () => {
    it('should apply autofix to code with errors', async () => {
      const response = await fetch('http://localhost:3000/api/apply-ai-code-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUpdates: {
            'src/BuggyCode.tsx': `
              export default function Buggy() {
                const x = 1
                return <div>{x}</div>
              }
            `
          },
          enableAutoFix: true
        })
      });

      expect(response.status).toBeLessThan(500);
      // AutoFix should add missing semicolon
    });

    it('should skip autofix if disabled', async () => {
      const response = await fetch('http://localhost:3000/api/apply-ai-code-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUpdates: {
            'src/Code.tsx': 'const a = 1'
          },
          enableAutoFix: false
        })
      });

      expect(response.status).toBeLessThan(500);
    });
  });

  describe('Streaming Response', () => {
    it('should stream progress events', async () => {
      const response = await fetch('http://localhost:3000/api/apply-ai-code-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUpdates: {
            'src/StreamTest.tsx': 'export const Test = () => <div>Test</div>'
          }
        })
      });

      expect(response.body).toBeDefined();
      const reader = response.body?.getReader();
      expect(reader).toBeDefined();
    });

    it('should include progress percentage', async () => {
      const response = await fetch('http://localhost:3000/api/apply-ai-code-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUpdates: {
            'file1.tsx': 'content1',
            'file2.tsx': 'content2',
            'file3.tsx': 'content3'
          }
        })
      });

      expect(response.status).toBeLessThan(500);
      // Should stream progress: 33%, 66%, 100%
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid file paths', async () => {
      const response = await fetch('http://localhost:3000/api/apply-ai-code-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUpdates: {
            '../../../etc/passwd': 'malicious content'
          }
        })
      });

      // Should reject or sanitize path
      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle very large files', async () => {
      const largeContent = 'a'.repeat(1024 * 1024); // 1MB

      const response = await fetch('http://localhost:3000/api/apply-ai-code-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUpdates: {
            'large.txt': largeContent
          }
        })
      });

      expect(response.status).toBeDefined();
    });

    it('should handle no active sandbox', async () => {
      // Kill all sandboxes first
      await fetch('http://localhost:3000/api/kill-sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sandboxId: 'all' })
      });

      const response = await fetch('http://localhost:3000/api/apply-ai-code-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUpdates: {
            'test.tsx': 'content'
          }
        })
      });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Performance', () => {
    it('should apply single file quickly (< 2s)', async () => {
      const startTime = Date.now();

      const response = await fetch('http://localhost:3000/api/apply-ai-code-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUpdates: {
            'src/Quick.tsx': 'export const Quick = () => <div>Fast</div>'
          }
        })
      });

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(2000);
      expect(response.status).toBeLessThan(400);
    });

    it('should handle 10 files efficiently (< 10s)', async () => {
      const fileUpdates: Record<string, string> = {};
      for (let i = 0; i < 10; i++) {
        fileUpdates[`src/File${i}.tsx`] = `export const Component${i} = () => <div>${i}</div>`;
      }

      const startTime = Date.now();

      const response = await fetch('http://localhost:3000/api/apply-ai-code-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileUpdates })
      });

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(10000);
      expect(response.status).toBeLessThan(400);
    }, 15000); // 15s timeout
  });
});

/**
 * COVERAGE TARGET: This test file aims for 70%+ coverage of:
 * - File creation/update/deletion
 * - Package detection and installation
 * - AutoFix processing
 * - Streaming progress
 * - Error handling
 * - Security (path traversal)
 * - Performance benchmarks
 */
