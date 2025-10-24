/**
 * Advanced RAG System Unit Tests
 * 
 * Resumo:
 * Testes completos para sistema RAG incluindo chunking,
 * hybrid search, diversity e token optimization.
 * 
 * Coverage target: 95%
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AdvancedRAGSystem } from '@/lib/ai/rag/advanced-rag-system';
import type { VectorStore, Chunk } from '@/types/rag';

describe('AdvancedRAGSystem', () => {
  let rag: AdvancedRAGSystem;
  let mockVectorStore: VectorStore;

  beforeEach(() => {
    mockVectorStore = {
      search: vi.fn(),
      indexChunks: vi.fn(),
      getAllChunks: vi.fn(),
      delete: vi.fn(),
    } as any;
    rag = new AdvancedRAGSystem(mockVectorStore);
  });

  describe('Simple Chunking (MVP)', () => {
    it('should chunk by size with overlap', async () => {
      const code = 'x'.repeat(2000);
      
      const chunks = await rag.chunkSimple(code, {
        maxChunkSize: 500,
        overlap: 50,
      });

      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks[0].content.length).toBeLessThanOrEqual(500);
      
      // Verify overlap exists
      if (chunks.length > 1) {
        const endOfFirst = chunks[0].content.slice(-50);
        const startOfSecond = chunks[1].content.slice(0, 50);
        expect(endOfFirst).toBe(startOfSecond);
      }
    });

    it('should handle small code without chunking', async () => {
      const code = 'short code';
      
      const chunks = await rag.chunkSimple(code, {
        maxChunkSize: 500,
      });

      expect(chunks).toHaveLength(1);
      expect(chunks[0].content).toBe(code);
    });
  });

  describe('Semantic Chunking (Enterprise)', () => {
    it('should chunk by function boundaries', async () => {
      const code = `
function hello() {
  console.log('hello');
}

function world() {
  console.log('world');
}
      `.trim();
      
      const chunks = await rag.chunkBySemantic(code, {
        language: 'typescript',
        strategy: 'ast-based',
        chunkBy: ['function'],
      });

      expect(chunks.length).toBeGreaterThanOrEqual(2);
      expect(chunks[0].content).toContain('hello');
      expect(chunks[0].metadata.type).toBe('function');
    });

    it('should chunk by class boundaries', async () => {
      const code = `
class Service {
  getData() {
    return [];
  }
}

class Controller {
  handle() {}
}
      `.trim();
      
      const chunks = await rag.chunkBySemantic(code, {
        language: 'typescript',
        strategy: 'ast-based',
        chunkBy: ['class'],
      });

      expect(chunks.length).toBeGreaterThanOrEqual(2);
      expect(chunks[0].content).toContain('Service');
      expect(chunks[0].metadata.type).toBe('class');
    });

    it('should fallback to simple chunking when not AST-based', async () => {
      const code = 'x'.repeat(1000);
      
      const chunks = await rag.chunkBySemantic(code, {
        language: 'typescript',
        strategy: 'simple',
        maxChunkSize: 500,
      });

      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks[0].content.length).toBeLessThanOrEqual(500);
    });
  });

  describe('Hybrid Search', () => {
    it('should combine vector and keyword results', async () => {
      const vectorResults: Chunk[] = [
        { 
          id: '1', 
          content: 'authentication logic', 
          score: 0.9,
          metadata: {},
          embedding: [],
        },
      ];
      
      mockVectorStore.search.mockResolvedValue(vectorResults);
      mockVectorStore.getAllChunks.mockResolvedValue([
        { 
          id: '2', 
          content: 'user login authentication', 
          score: 0,
          metadata: {},
          embedding: [],
        },
      ]);

      const results = await rag.retrieveContext('authentication', {
        hybridSearch: true,
        topK: 5,
      });

      expect(results.chunks.length).toBeGreaterThan(0);
      expect(mockVectorStore.search).toHaveBeenCalled();
      expect(results.retrievalMetrics.vectorResults).toBeGreaterThan(0);
      expect(results.retrievalMetrics.keywordResults).toBeGreaterThan(0);
    });

    it('should use pure vector search when hybrid disabled', async () => {
      const vectorResults: Chunk[] = [
        { 
          id: '1', 
          content: 'test', 
          score: 0.9,
          metadata: {},
          embedding: [],
        },
      ];
      
      mockVectorStore.search.mockResolvedValue(vectorResults);

      const results = await rag.retrieveContext('test', {
        hybridSearch: false,
        topK: 5,
      });

      expect(results.chunks).toHaveLength(1);
      expect(results.retrievalMetrics.keywordResults).toBe(0);
    });
  });

  describe('Token Budget Optimization', () => {
    it('should fit within token limit', async () => {
      const largeChunks: Chunk[] = Array.from({ length: 100 }, (_, i) => ({
        id: `chunk-${i}`,
        content: 'x'.repeat(100),
        score: 0.8 - i * 0.01,
        metadata: {},
        embedding: [],
      }));

      mockVectorStore.search.mockResolvedValue(largeChunks);

      const results = await rag.retrieveContext('test', {
        maxTokens: 1000,
        hybridSearch: false,
      });

      expect(results.totalTokens).toBeLessThanOrEqual(1000);
      expect(results.chunks.length).toBeLessThan(100);
    });

    it('should prioritize higher-scored chunks', async () => {
      const chunks: Chunk[] = [
        { id: '1', content: 'high', score: 0.9, metadata: {}, embedding: [] },
        { id: '2', content: 'low', score: 0.3, metadata: {}, embedding: [] },
        { id: '3', content: 'medium', score: 0.6, metadata: {}, embedding: [] },
      ];

      mockVectorStore.search.mockResolvedValue(chunks);

      const results = await rag.retrieveContext('test', {
        maxTokens: 100,
        hybridSearch: false,
      });

      // Should get high-scored chunk first
      expect(results.chunks[0].id).toBe('1');
    });
  });

  describe('Diversity (MMR)', () => {
    it('should apply diversity when enabled', async () => {
      const chunks: Chunk[] = [
        { 
          id: '1', 
          content: 'auth', 
          score: 0.9, 
          metadata: {},
          embedding: [1, 0, 0],
        },
        { 
          id: '2', 
          content: 'authentication', 
          score: 0.88,
          metadata: {},
          embedding: [0.9, 0.1, 0],
        },
        { 
          id: '3', 
          content: 'database', 
          score: 0.86,
          metadata: {},
          embedding: [0, 1, 0],
        },
      ];

      mockVectorStore.search.mockResolvedValue(chunks);

      const results = await rag.retrieveContext('test', {
        hybridSearch: false,
        diversityPenalty: 0.5,
      });

      expect(results.retrievalMetrics.diversityApplied).toBe(true);
      expect(results.chunks.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle vector store failures gracefully', async () => {
      mockVectorStore.search.mockRejectedValue(
        new Error('Vector store unavailable')
      );

      await expect(
        rag.retrieveContext('test', { hybridSearch: false })
      ).rejects.toThrow();
    });

    it('should handle empty results', async () => {
      mockVectorStore.search.mockResolvedValue([]);

      const results = await rag.retrieveContext('test', {
        hybridSearch: false,
      });

      expect(results.chunks).toHaveLength(0);
      expect(results.totalTokens).toBe(0);
    });
  });

  describe('Performance', () => {
    it('should retrieve context in reasonable time', async () => {
      mockVectorStore.search.mockResolvedValue([
        { 
          id: '1', 
          content: 'test', 
          score: 0.9,
          metadata: {},
          embedding: [],
        },
      ]);

      const start = Date.now();
      await rag.retrieveContext('test query', {
        hybridSearch: false,
      });
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(1000); // Should be < 1s
    });

    it('should handle concurrent requests', async () => {
      mockVectorStore.search.mockResolvedValue([
        { 
          id: '1', 
          content: 'test', 
          score: 0.9,
          metadata: {},
          embedding: [],
        },
      ]);

      const promises = Array.from({ length: 10 }, () =>
        rag.retrieveContext('concurrent test', { hybridSearch: false })
      );

      const results = await Promise.all(promises);
      expect(results).toHaveLength(10);
      results.forEach(r => expect(r.chunks.length).toBeGreaterThan(0));
    });
  });
});

/**
 * CHECKLIST UI/UX
 * 
 * Test Coverage:
 * - [x] Simple chunking
 * - [x] Semantic chunking (AST-based)
 * - [x] Hybrid search
 * - [x] Token budget optimization
 * - [x] MMR diversity
 * - [x] Error handling
 * - [x] Performance tests
 * - [x] Concurrent request handling
 */

/**
 * VALIDAÇÃO
 * 
 * Test Metrics:
 * - [ ] Coverage > 95%
 * - [ ] All tests passing
 * - [ ] Performance tests < 1s
 * - [ ] Zero flaky tests
 * - [ ] Edge cases covered
 */

/**
 * PRÓXIMOS PASSOS
 * 
 * Week 1:
 * - [x] Unit tests implementation
 * - [ ] Integration tests
 * - [ ] Benchmark tests
 * 
 * Week 2:
 * - [ ] Add more edge case tests
 * - [ ] Visual regression tests
 * - [ ] Load tests
 */
