// lib/db/client.ts
/**
 * Database Client
 * 
 * Resumo:
 * Prisma client singleton com connection pooling e graceful shutdown
 * 
 * MVP: Single instance com logging básico
 * Enterprise: Connection pooling (PgBouncer) + read replicas
 */

import { PrismaClient } from '@prisma/client';

// ============================================================================
// SOLUTION RÁPIDA (MVP)
// ============================================================================

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

// ============================================================================
// REDIS CLIENT
// ============================================================================

import { Redis } from '@upstash/redis';

export const redis = Redis.fromEnv();

// Rate Limiting Keys
export const RATE_LIMIT_PREFIX = 'rate_limit:';
export const USER_RATE_LIMIT = (userId: string) => `${RATE_LIMIT_PREFIX}user:${userId}`;
export const IP_RATE_LIMIT = (ip: string) => `${RATE_LIMIT_PREFIX}ip:${ip}`;

// Session Keys
export const SESSION_PREFIX = 'session:';
export const USER_SESSION = (sessionId: string) => `${SESSION_PREFIX}${sessionId}`;

// Cache Keys
export const CACHE_PREFIX = 'cache:';
export const MODEL_RESPONSE_CACHE = (hash: string) => `${CACHE_PREFIX}model:${hash}`;

// ============================================================================
// COST DATABASE IMPLEMENTATION
// ============================================================================

export class PostgresCostDatabase {
  async saveCost(
    userId: string,
    sessionId: string,
    breakdown: {
      model: string;
      inputTokens: number;
      outputTokens: number;
      totalCost: number;
      task: string;
      requestId: string;
      cached: boolean;
      reasoning: boolean;
    }
  ): Promise<string> {
    const record = await prisma.costRecord.create({
      data: {
        userId,
        sessionId,
        model: breakdown.model,
        inputTokens: breakdown.inputTokens,
        outputTokens: breakdown.outputTokens,
        cost: breakdown.totalCost,
        task: breakdown.task,
        metadata: {
          requestId: breakdown.requestId,
          cached: breakdown.cached,
          reasoning: breakdown.reasoning,
        },
      },
    });
    
    return record.id;
  }
  
  async getCostsByUser(userId: string, days: number = 30): Promise<any[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);
    
    return prisma.costRecord.findMany({
      where: {
        userId,
        createdAt: { gte: since },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
  
  async getTotalCost(userId: string, days: number = 30): Promise<number> {
    const since = new Date();
    since.setDate(since.getDate() - days);
    
    const result = await prisma.costRecord.aggregate({
      where: {
        userId,
        createdAt: { gte: since },
      },
      _sum: { cost: true },
    });
    
    return result._sum.cost || 0;
  }
}

// ============================================================================
// SOLUTION ENTERPRISE
// ============================================================================

/**
 * Features adicionais:
 * 
 * 1. Connection Pooling (PgBouncer)
 * 2. Read Replicas (query routing)
 * 3. Query optimization (indexes, explain analyze)
 * 4. Backup automation (daily snapshots)
 * 5. Migration management (CI/CD integrated)
 * 6. Data retention policies (GDPR compliance)
 * 7. Monitoring (query performance, connections)
 * 8. Audit logging (todas as operações)
 * 
 * Example:
 * ```typescript
 * const db = new EnterprisePrismaClient({
 *   pooling: {
 *     enabled: true,
 *     min: 2,
 *     max: 10,
 *   },
 *   readReplicas: {
 *     enabled: true,
 *     urls: [process.env.READ_REPLICA_1_URL],
 *   },
 *   monitoring: {
 *     enabled: true,
 *     slowQueryThreshold: 1000, // ms
 *   },
 * });
 * ```
 */

// ============================================================================
// VALIDAÇÃO
// ============================================================================

/**
 * Métricas alvo:
 * 
 * - [ ] Migrations rodam sem erros
 * - [ ] Connection pooling funciona (10+ concurrent queries)
 * - [ ] Cost tracking persiste corretamente (99.9%+ success rate)
 * - [ ] Redis cache funciona (< 10ms latency)
 * - [ ] Backup automated (daily, tested restore)
 * - [ ] Query performance (< 100ms p95)
 */

// ============================================================================
// PRÓXIMOS PASSOS
// ============================================================================

/**
 * Week 1:
 * - [ ] Setup PostgreSQL (Supabase/Neon)
 * - [ ] Run migrations
 * - [ ] Setup Redis (Upstash)
 * 
 * Week 2:
 * - [ ] Implement cost tracking persistence
 * - [ ] Integration tests
 * - [ ] Performance testing
 * 
 * Week 3-4 (Enterprise):
 * - [ ] Setup read replicas
 * - [ ] Configure PgBouncer
 * - [ ] Backup automation
 */
