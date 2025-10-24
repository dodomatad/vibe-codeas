// components/app/RAGStatusIndicator.tsx
/**
 * RAGStatusIndicator Component
 * 
 * Resumo:
 * Indicador visual do status do RAG system (indexing, ready, error)
 * 
 * MVP: Progress bar + status badge
 * Enterprise: Real-time updates via WebSocket + métricas detalhadas
 */

'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Database, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

// ============================================================================
// SOLUTION RÁPIDA (MVP)
// ============================================================================

export interface RAGStatus {
  status: 'indexing' | 'ready' | 'error' | 'disabled';
  progress?: number;
  filesIndexed?: number;
  totalFiles?: number;
  lastUpdated?: Date;
  error?: string;
}

interface RAGStatusIndicatorProps {
  status: RAGStatus;
  compact?: boolean;
}

export function RAGStatusIndicator({ status, compact = false }: RAGStatusIndicatorProps) {
  const getStatusColor = () => {
    switch (status.status) {
      case 'ready':
        return 'text-green-600 bg-green-50';
      case 'indexing':
        return 'text-blue-600 bg-blue-50';
      case 'error':
        return 'text-red-600 bg-red-50';
      case 'disabled':
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = () => {
    switch (status.status) {
      case 'ready':
        return <CheckCircle2 className="h-4 w-4" aria-hidden="true" />;
      case 'indexing':
        return <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />;
      case 'error':
        return <AlertCircle className="h-4 w-4" aria-hidden="true" />;
      case 'disabled':
        return <Database className="h-4 w-4" aria-hidden="true" />;
    }
  };

  const getStatusLabel = () => {
    switch (status.status) {
      case 'ready':
        return 'RAG Ready';
      case 'indexing':
        return 'Indexing...';
      case 'error':
        return 'RAG Error';
      case 'disabled':
        return 'RAG Disabled';
    }
  };

  if (compact) {
    return (
      <Badge 
        className={`${getStatusColor()} gap-1.5`}
        aria-label={`RAG system status: ${getStatusLabel()}`}
      >
        {getStatusIcon()}
        <span>{getStatusLabel()}</span>
      </Badge>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div 
          className="space-y-4"
          role="status"
          aria-live="polite"
          aria-label="RAG system status"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              <h3 className="font-semibold">RAG System</h3>
            </div>
            <Badge className={getStatusColor()}>
              {getStatusIcon()}
              <span className="ml-1.5">{getStatusLabel()}</span>
            </Badge>
          </div>

          {/* Progress (only during indexing) */}
          {status.status === 'indexing' && status.progress !== undefined && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Indexing progress</span>
                <span className="font-medium">
                  {status.filesIndexed || 0} / {status.totalFiles || 0} files
                </span>
              </div>
              <Progress 
                value={status.progress} 
                aria-label={`Indexing progress: ${status.progress}%`}
              />
              <p className="text-xs text-muted-foreground">
                {status.progress}% complete
              </p>
            </div>
          )}

          {/* Error message */}
          {status.status === 'error' && status.error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800" role="alert">
              <p className="font-medium">Error</p>
              <p className="mt-1">{status.error}</p>
            </div>
          )}

          {/* Ready state info */}
          {status.status === 'ready' && status.filesIndexed && (
            <div className="text-sm text-muted-foreground">
              <p>
                {status.filesIndexed} files indexed and ready for semantic search
              </p>
              {status.lastUpdated && (
                <p className="mt-1 text-xs">
                  Last updated: {new Date(status.lastUpdated).toLocaleString()}
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// SOLUTION ENTERPRISE
// ============================================================================

/**
 * Features adicionais:
 * 
 * 1. Real-time updates via WebSocket
 * 2. Detailed metrics dashboard:
 *    - Indexing speed (files/second)
 *    - Vector DB storage (MB used)
 *    - Search latency (ms)
 *    - Cache hit rate (%)
 * 3. Historical indexing logs
 * 4. Manual re-index trigger
 * 5. Selective file indexing (by pattern)
 * 6. Incremental vs full index indicator
 * 7. Cost tracking (embeddings API calls)
 * 8. Health check status
 * 
 * Example:
 * ```typescript
 * export function EnterpriseRAGStatusIndicator() {
 *   const { status, metrics } = useRAGStatus(); // WebSocket hook
 *   
 *   return (
 *     <Card>
 *       <RAGStatusIndicator status={status} />
 *       <RAGMetricsDashboard metrics={metrics} />
 *       <RAGControlPanel onReindex={handleReindex} />
 *     </Card>
 *   );
 * }
 * 
 * interface RAGMetrics {
 *   indexingSpeed: number;
 *   storageUsed: number;
 *   avgSearchLatency: number;
 *   cacheHitRate: number;
 * }
 * ```
 */

// ============================================================================
// CHECKLIST UI/UX
// ============================================================================

/**
 * Acessibilidade implementada:
 * - ✅ ARIA role="status" com aria-live="polite"
 * - ✅ ARIA labels descritivos
 * - ✅ Screen reader friendly (status announcements)
 * - ✅ Color + icon (não depende só de cor)
 * - ✅ Progress bar acessível
 * - ✅ Error alerts com role="alert"
 * 
 * Design:
 * - ✅ Compact mode para header/navbar
 * - ✅ Full mode para dashboard
 * - ✅ Smooth animations (loading spinner)
 * - ✅ Semantic colors (green=ready, blue=indexing, red=error)
 * - ✅ Consistent with design system
 * 
 * Melhorias pendentes:
 * - [ ] Toast notifications quando indexing completa
 * - [ ] Keyboard shortcut para trigger re-index
 * - [ ] Historical view (últimas 10 indexações)
 */

// ============================================================================
// VALIDAÇÃO
// ============================================================================

/**
 * Testes necessários:
 * - [ ] Unit tests (RAGStatusIndicator.test.tsx)
 * - [ ] Visual regression tests (todas os estados)
 * - [ ] Accessibility tests (axe-core)
 * - [ ] Performance tests (render time)
 * 
 * Estados para testar:
 * - ✅ status='ready' com filesIndexed
 * - ✅ status='indexing' com progress
 * - ✅ status='error' com error message
 * - ✅ status='disabled'
 * - ✅ compact mode
 * - ✅ full mode
 * 
 * Métricas:
 * - Render time: < 16ms (60fps)
 * - Bundle size: < 3KB (gzipped)
 * - Accessibility score: 100/100
 */

// ============================================================================
// PRÓXIMOS PASSOS
// ============================================================================

/**
 * Week 1:
 * - [x] ✅ Implementação MVP
 * - [ ] Unit tests
 * - [ ] Integração com lib/ai/rag/rag-system.ts
 * 
 * Week 2:
 * - [ ] WebSocket integration para updates em tempo real
 * - [ ] Manual re-index button
 * - [ ] Toast notifications
 * 
 * Week 3-4 (Enterprise):
 * - [ ] Metrics dashboard
 * - [ ] Historical logs
 * - [ ] Cost tracking
 * - [ ] Health checks
 */

// ============================================================================
// EXAMPLE USAGE
// ============================================================================

/**
 * ```typescript
 * // In your layout or dashboard:
 * 
 * import { RAGStatusIndicator } from '@/components/app/RAGStatusIndicator';
 * import { useRAGStatus } from '@/hooks/useRAGStatus';
 * 
 * export function Dashboard() {
 *   const ragStatus = useRAGStatus();
 *   
 *   return (
 *     <div>
 *       <RAGStatusIndicator status={ragStatus} compact />
 *     </div>
 *   );
 * }
 * 
 * // Or with manual control:
 * 
 * const [ragStatus, setRAGStatus] = useState<RAGStatus>({
 *   status: 'indexing',
 *   progress: 45,
 *   filesIndexed: 45,
 *   totalFiles: 100,
 * });
 * 
 * <RAGStatusIndicator status={ragStatus} />
 * ```
 */
