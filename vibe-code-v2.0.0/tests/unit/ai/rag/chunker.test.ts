// tests/unit/ai/rag/chunker.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { DocumentChunker } from '@/lib/ai/rag/rag-system';

describe('DocumentChunker', () => {
  let chunker: DocumentChunker;

  beforeEach(() => {
    chunker = new DocumentChunker();
  });

  describe('chunkDocument', () => {
    it('should split large document into multiple chunks', async () => {
      const content = 'x'.repeat(3000); // 3000 chars
      const chunks = await chunker.chunkDocument(content, 'test.ts', 'typescript');
      
      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks[0].content.length).toBeLessThanOrEqual(512 * 4); // ~512 tokens
    });

    it('should create single chunk for small documents', async () => {
      const content = 'small content';
      const chunks = await chunker.chunkDocument(content, 'test.ts', 'typescript');
      
      expect(chunks).toHaveLength(1);
      expect(chunks[0].content).toBe(content);
    });

    it('should preserve metadata correctly', async () => {
      const chunks = await chunker.chunkDocument(
        'test content',
        'src/app.ts',
        'typescript'
      );
      
      expect(chunks[0].metadata).toMatchObject({
        filePath: 'src/app.ts',
        language: 'typescript',
        startLine: expect.any(Number),
        endLine: expect.any(Number),
      });
    });

    it('should include overlap between consecutive chunks', async () => {
      const lines = Array.from({ length: 100 }, (_, i) => `line ${i}`);
      const content = lines.join('\n');
      const chunks = await chunker.chunkDocument(content, 'test.ts', 'typescript');
      
      if (chunks.length > 1) {
        // Verify last lines of chunk N overlap with first lines of chunk N+1
        const lastChunkLines = chunks[0].content.split('\n').slice(-5);
        const nextChunkLines = chunks[1].content.split('\n').slice(0, 5);
        
        const hasOverlap = lastChunkLines.some(line => 
          nextChunkLines.includes(line)
        );
        expect(hasOverlap).toBe(true);
      }
    });

    it('should handle different file types', async () => {
      const files = [
        { path: 'test.ts', language: 'typescript' },
        { path: 'test.js', language: 'javascript' },
        { path: 'test.py', language: 'python' },
      ];

      for (const file of files) {
        const chunks = await chunker.chunkDocument(
          'test content',
          file.path,
          file.language
        );
        
        expect(chunks[0].metadata.language).toBe(file.language);
      }
    });
  });

  describe('estimateTokens', () => {
    it('should estimate tokens correctly', () => {
      const text = 'hello world';
      const tokens = chunker['estimateTokens'](text);
      
      // Rough estimate: 1 token ≈ 4 chars
      expect(tokens).toBeGreaterThan(0);
      expect(tokens).toBeLessThanOrEqual(Math.ceil(text.length / 4) + 1);
    });
  });
});
