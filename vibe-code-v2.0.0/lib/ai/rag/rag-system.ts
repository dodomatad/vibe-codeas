// lib/ai/rag/rag-system.ts
/**
 * RAG System (Retrieval-Augmented Generation)
 * 
 * Resumo:
 * Sistema de contexto inteligente para respostas grounded em código
 * Indexa workspace → Busca por similaridade → Injeta contexto no prompt
 * 
 * MVP: Chunking básico + Turbopuffer + OpenAI embeddings
 * Enterprise: Re-ranking + hybrid search + incremental indexing
 */

import type { DocumentChunk } from './types';

// ============================================================================
// SOLUTION RÁPIDA (MVP)
// ============================================================================

/**
 * Document Chunker
 * Divide documentos em chunks semânticos (512 tokens, overlap 50)
 */
export class DocumentChunker {
  private readonly maxChunkSize = 512; // tokens
  private readonly overlap = 50; // tokens
  
  async chunkDocument(
    content: string,
    filePath: string,
    language: string
  ): Promise<DocumentChunk[]> {
    const chunks: DocumentChunk[] = [];
    const lines = content.split('\n');
    let currentChunk: string[] = [];
    let currentSize = 0;
    let startLine = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineTokens = this.estimateTokens(line);
      
      if (currentSize + lineTokens > this.maxChunkSize && currentChunk.length > 0) {
        chunks.push(this.createChunk(currentChunk, filePath, language, startLine, i - 1));
        
        // Start new chunk with overlap
        const overlapLines = Math.floor(this.overlap / 10);
        currentChunk = currentChunk.slice(-overlapLines);
        currentSize = currentChunk.reduce((sum, l) => sum + this.estimateTokens(l), 0);
        startLine = i - overlapLines;
      }
      
      currentChunk.push(line);
      currentSize += lineTokens;
    }
    
    if (currentChunk.length > 0) {
      chunks.push(this.createChunk(currentChunk, filePath, language, startLine, lines.length - 1));
    }
    
    return chunks;
  }
  
  private createChunk(
    lines: string[],
    filePath: string,
    language: string,
    startLine: number,
    endLine: number
  ): DocumentChunk {
    return {
      id: `${filePath}:${startLine}-${endLine}`,
      content: lines.join('\n'),
      metadata: {
        filePath,
        language,
        startLine,
        endLine,
      },
    };
  }
  
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}

/**
 * Vector Store (Turbopuffer)
 * Armazena embeddings e busca por similaridade
 */
export class VectorStore {
  private apiKey: string;
  private namespace = 'vibe-code-workspace';
  private baseURL = 'https://api.turbopuffer.com';
  
  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.TURBOPUFFER_API_KEY || '';
  }
  
  async indexChunks(chunks: DocumentChunk[]): Promise<void> {
    const vectors = await this.generateEmbeddings(chunks.map(c => c.content));
    
    await this.upsert(
      chunks.map((chunk, i) => ({
        id: chunk.id,
        vector: vectors[i],
        metadata: chunk.metadata,
      }))
    );
  }
  
  async search(query: string, topK: number = 5): Promise<DocumentChunk[]> {
    const queryVector = await this.generateEmbedding(query);
    
    const results = await this.query({
      vector: queryVector,
      topK,
    });
    
    return results.map(r => ({
      id: r.id,
      content: '', // Fetch from source if needed
      metadata: r.metadata,
    }));
  }
  
  private async generateEmbedding(text: string): Promise<number[]> {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text,
      }),
    });
    
    const data = await response.json();
    return data.data[0].embedding;
  }
  
  private async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: texts,
      }),
    });
    
    const data = await response.json();
    return data.data.map((d: any) => d.embedding);
  }
  
  private async upsert(vectors: any[]): Promise<void> {
    await fetch(`${this.baseURL}/v1/vectors/${this.namespace}/upsert`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ vectors }),
    });
  }
  
  private async query(params: any): Promise<any[]> {
    const response = await fetch(`${this.baseURL}/v1/vectors/${this.namespace}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
    
    const data = await response.json();
    return data.results || [];
  }
}

/**
 * RAG System
 * Orquestra chunking, indexing e retrieval
 */
export class RAGSystem {
  private chunker: DocumentChunker;
  private vectorStore: VectorStore;
  
  constructor() {
    this.chunker = new DocumentChunker();
    this.vectorStore = new VectorStore();
  }
  
  async indexWorkspace(files: Map<string, string>): Promise<void> {
    const allChunks: DocumentChunk[] = [];
    
    for (const [filePath, content] of files.entries()) {
      const language = this.detectLanguage(filePath);
      const chunks = await this.chunker.chunkDocument(content, filePath, language);
      allChunks.push(...chunks);
    }
    
    await this.vectorStore.indexChunks(allChunks);
  }
  
  async retrieveContext(query: string, topK: number = 5): Promise<string> {
    const relevantChunks = await this.vectorStore.search(query, topK);
    
    return relevantChunks
      .map(chunk => {
        return `
File: ${chunk.metadata.filePath}
Lines: ${chunk.metadata.startLine}-${chunk.metadata.endLine}
Language: ${chunk.metadata.language}

\`\`\`${chunk.metadata.language}
${chunk.content}
\`\`\`
`;
      })
      .join('\n---\n');
  }
  
  private detectLanguage(filePath: string): string {
    const ext = filePath.split('.').pop() || '';
    const langMap: Record<string, string> = {
      ts: 'typescript',
      tsx: 'typescript',
      js: 'javascript',
      jsx: 'javascript',
      py: 'python',
      go: 'go',
      rs: 'rust',
      rb: 'ruby',
      java: 'java',
    };
    return langMap[ext] || 'text';
  }
}

// ============================================================================
// TYPES
// ============================================================================

// lib/ai/rag/types.ts
export interface DocumentChunk {
  id: string;
  content: string;
  metadata: {
    filePath: string;
    language: string;
    startLine: number;
    endLine: number;
  };
}

// ============================================================================
// SOLUTION ENTERPRISE
// ============================================================================

/**
 * Features adicionais:
 * 
 * 1. Re-ranking com Cohere/Anthropic
 * 2. Hybrid search (vector + keyword BM25)
 * 3. Metadata filtering (por framework, data, autor)
 * 4. Incremental indexing (apenas arquivos modificados)
 * 5. Query expansion (sinônimos, termos relacionados)
 * 6. Context compression (resumir chunks grandes)
 * 7. Caching de embeddings (PostgreSQL + pgvector)
 * 8. Métricas de relevância (NDCG, MRR)
 * 
 * Example:
 * ```typescript
 * const ragSystem = new EnterpriseRAGSystem({
 *   reranking: {
 *     enabled: true,
 *     model: 'cohere/rerank-english-v3.0',
 *   },
 *   hybridSearch: {
 *     enabled: true,
 *     vectorWeight: 0.7,
 *     keywordWeight: 0.3,
 *   },
 *   caching: {
 *     enabled: true,
 *     ttl: 3600, // 1 hour
 *   },
 * });
 * ```
 */

// ============================================================================
// CHECKLIST UI/UX
// ============================================================================

/**
 * UI Components necessários:
 * 
 * - [ ] RAG Status Indicator (indexing progress)
 * - [ ] Context Preview (mostrar chunks relevantes)
 * - [ ] Relevance Score Display (similaridade)
 * - [ ] Manual Context Selection (user override)
 * - [ ] Index Management (clear, rebuild)
 * - [ ] ARIA labels para screen readers
 * - [ ] Keyboard navigation (Tab, Enter)
 * - [ ] Loading states acessíveis
 */

// ============================================================================
// VALIDAÇÃO
// ============================================================================

/**
 * Métricas alvo:
 * 
 * - [ ] Indexing: 100+ arquivos em < 5min
 * - [ ] Search latency: < 200ms
 * - [ ] Relevância: > 80% (manual evaluation)
 * - [ ] Cost: < $0.01 per query
 * - [ ] Coverage: 95%+ do workspace indexado
 */

// ============================================================================
// PRÓXIMOS PASSOS
// ============================================================================

/**
 * Roadmap:
 * 
 * Week 1-2:
 * - [ ] Implementar chunking e indexing
 * - [ ] Integrar Turbopuffer
 * - [ ] Testes básicos
 * 
 * Week 3-4:
 * - [ ] Implementar search e retrieval
 * - [ ] Integrar com model router
 * - [ ] UI components
 * 
 * Week 5-6 (Enterprise):
 * - [ ] Re-ranking
 * - [ ] Hybrid search
 * - [ ] Incremental indexing
 * - [ ] Performance optimization
 */
