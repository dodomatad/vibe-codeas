'use client';

/**
 * Context Preview Modal
 * 
 * Exibe chunks de contexto RAG com metadata e relevance score.
 * Melhora transparência do sistema RAG para debugging e confiança do usuário.
 * 
 * @layer MVP
 * @accessibility WCAG 2.1 AA compliant
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, FileCode, Info } from 'lucide-react';
import { useState } from 'react';

export interface RAGChunk {
  id: string;
  content: string;
  metadata: {
    filePath: string;
    language: string;
    startLine: number;
    endLine: number;
    lastModified?: Date;
  };
  relevanceScore?: number;
  embedding?: number[];
}

export interface ContextPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chunks: RAGChunk[];
  totalTokens?: number;
  maxTokens?: number;
}

export function ContextPreviewModal({
  open,
  onOpenChange,
  chunks,
  totalTokens = 0,
  maxTokens = 4000,
}: ContextPreviewModalProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (chunk: RAGChunk) => {
    await navigator.clipboard.writeText(chunk.content);
    setCopiedId(chunk.id);
    setTimeout(() => setCopiedId(null), 2000);

    // ARIA live region announcement
    announceToScreenReader(`Code from ${chunk.metadata.filePath} copied to clipboard`);
  };

  const getRelevanceColor = (score?: number) => {
    if (!score) return 'secondary';
    if (score > 0.8) return 'default';
    if (score > 0.6) return 'outline';
    return 'secondary';
  };

  const formatFileSize = (content: string) => {
    const bytes = new Blob([content]).size;
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-5xl max-h-[85vh]"
        aria-describedby="context-preview-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCode className="h-5 w-5" aria-hidden="true" />
            RAG Context Preview
            <Badge variant="outline" className="ml-auto">
              {chunks.length} {chunks.length === 1 ? 'chunk' : 'chunks'}
            </Badge>
          </DialogTitle>
          <p id="context-preview-description" className="text-sm text-muted-foreground">
            Context retrieved from your codebase. {totalTokens} / {maxTokens} tokens used.
          </p>
        </DialogHeader>

        {/* Token Usage Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Token Usage</span>
            <span>{Math.round((totalTokens / maxTokens) * 100)}%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${Math.min((totalTokens / maxTokens) * 100, 100)}%` }}
              role="progressbar"
              aria-valuenow={totalTokens}
              aria-valuemin={0}
              aria-valuemax={maxTokens}
              aria-label="Token usage progress"
            />
          </div>
        </div>

        <ScrollArea className="h-[55vh]">
          <div className="space-y-4 pr-4">
            {chunks.map((chunk, index) => (
              <div
                key={chunk.id}
                className="border rounded-lg p-4 hover:border-primary/50 transition-colors focus-within:ring-2 focus-within:ring-primary"
                tabIndex={0}
                role="article"
                aria-label={`Code chunk ${index + 1} from ${chunk.metadata.filePath}`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3 gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-sm font-mono text-foreground truncate">
                        {chunk.metadata.filePath}
                      </code>
                      <Badge variant="secondary" className="shrink-0">
                        {chunk.metadata.language}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        Lines {chunk.metadata.startLine}-{chunk.metadata.endLine}
                      </span>
                      <span>•</span>
                      <span>{formatFileSize(chunk.content)}</span>
                      {chunk.metadata.lastModified && (
                        <>
                          <span>•</span>
                          <span>
                            Modified {new Date(chunk.metadata.lastModified).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {chunk.relevanceScore !== undefined && (
                      <Badge 
                        variant={getRelevanceColor(chunk.relevanceScore)}
                        className="tabular-nums"
                      >
                        <Info className="h-3 w-3 mr-1" aria-hidden="true" />
                        {Math.round(chunk.relevanceScore * 100)}% match
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopy(chunk)}
                      aria-label={`Copy code from ${chunk.metadata.filePath}`}
                    >
                      <Copy className="h-4 w-4" aria-hidden="true" />
                      {copiedId === chunk.id ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                </div>

                {/* Code Content */}
                <pre className="bg-muted p-3 rounded-md overflow-x-auto">
                  <code 
                    className={`language-${chunk.metadata.language} text-sm`}
                    aria-label="Code content"
                  >
                    {chunk.content}
                  </code>
                </pre>
              </div>
            ))}

            {chunks.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <FileCode className="h-12 w-12 mx-auto mb-4 opacity-50" aria-hidden="true" />
                <p>No context chunks available</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer Info */}
        <div className="flex items-center justify-between pt-4 border-t text-xs text-muted-foreground">
          <span>Press Esc to close</span>
          <span>Sorted by relevance score</span>
        </div>
      </DialogContent>

      {/* ARIA live region for announcements */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true" />
    </Dialog>
  );
}

/**
 * Announce to screen readers
 */
function announceToScreenReader(message: string) {
  const region = document.createElement('div');
  region.setAttribute('role', 'status');
  region.setAttribute('aria-live', 'polite');
  region.className = 'sr-only';
  region.textContent = message;

  document.body.appendChild(region);
  setTimeout(() => document.body.removeChild(region), 1000);
}

/**
 * Enterprise Layer: Advanced features
 */
export interface EnterpriseContextPreviewModalProps extends ContextPreviewModalProps {
  onChunkSelect?: (chunk: RAGChunk) => void;
  enableFiltering?: boolean;
  enableSorting?: boolean;
  showEmbeddings?: boolean;
}

export function EnterpriseContextPreviewModal({
  onChunkSelect,
  enableFiltering = true,
  enableSorting = true,
  showEmbeddings = false,
  ...props
}: EnterpriseContextPreviewModalProps) {
  // TODO: Implement advanced filtering and sorting
  // TODO: Visualize embeddings with t-SNE
  // TODO: Add chunk comparison view
  // TODO: Export context as JSON/Markdown

  return <ContextPreviewModal {...props} />;
}
