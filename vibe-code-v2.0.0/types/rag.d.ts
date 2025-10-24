/**
 * RAG System Type Definitions
 * 
 * Resumo:
 * Tipos completos para sistema RAG incluindo chunking,
 * vector store, e retrieval options.
 */

export interface VectorStore {
  search(options: {
    query: string;
    topK: number;
    filters?: Record<string, any>;
  }): Promise<Chunk[]>;
  
  indexChunks(chunks: Chunk[]): Promise<void>;
  
  getAllChunks(filters?: Record<string, any>): Promise<Chunk[]>;
  
  delete(id: string): Promise<void>;
}

export interface Chunk {
  id: string;
  content: string;
  score?: number;
  metadata: ChunkMetadata;
  embedding: number[];
}

export interface ChunkMetadata {
  type?: string;
  language?: string;
  startLine?: number;
  endLine?: number;
  startIndex?: number;
  endIndex?: number;
  filePath?: string;
  symbols?: string[];
  [key: string]: any;
}

export interface ChunkingOptions {
  language?: string;
  strategy?: 'simple' | 'ast-based';
  chunkBy?: string[];
  maxChunkSize?: number;
  overlap?: number;
  filePath?: string;
}

export interface RetrievalOptions {
  topK?: number;
  maxTokens?: number;
  hybridSearch?: boolean;
  vectorWeight?: number;
  keywordWeight?: number;
  rerank?: boolean;
  rerankModel?: string;
  diversityPenalty?: number;
  filters?: Record<string, any>;
  tokenizer?: string;
}

export interface RetrievalResult {
  chunks: Chunk[];
  totalTokens: number;
  retrievalMetrics: {
    vectorResults: number;
    keywordResults: number;
    reranked: boolean;
    diversityApplied: boolean;
  };
}
