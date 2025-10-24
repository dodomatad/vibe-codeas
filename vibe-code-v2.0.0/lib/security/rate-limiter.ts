// lib/security/rate-limiter.ts
/**
 * Rate Limiter
 * Proteção contra abuse com Redis (Upstash)
 * 
 * MVP: 10 requests / 10s por usuário
 * Enterprise: Sliding window + burst protection
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export class RateLimiter {
  private limiter: Ratelimit;
  private redis: Redis;
  
  constructor() {
    this.redis = Redis.fromEnv();
    
    // MVP: Sliding window básico
    this.limiter = new Ratelimit({
      redis: this.redis,
      limiter: Ratelimit.slidingWindow(10, '10 s'),
      analytics: true,
      prefix: '@vibe-code/rate-limit',
    });
  }
  
  /**
   * Check rate limit para um identificador (userId, IP, etc)
   * @returns true se dentro do limite, false se excedido
   */
  async checkLimit(identifier: string): Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
  }> {
    const { success, limit, remaining, reset } = await this.limiter.limit(identifier);
    
    return {
      success,
      limit,
      remaining,
      reset,
    };
  }
  
  /**
   * Check rate limit e lançar erro se excedido
   */
  async enforce(identifier: string): Promise<void> {
    const result = await this.checkLimit(identifier);
    
    if (!result.success) {
      throw new RateLimitError(
        `Rate limit exceeded. Try again in ${Math.ceil(result.reset / 1000)}s`,
        result
      );
    }
  }
}

export class RateLimitError extends Error {
  constructor(
    message: string,
    public readonly details: {
      limit: number;
      remaining: number;
      reset: number;
    }
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

/**
 * ENTERPRISE VERSION
 * 
 * Features adicionais:
 * - Multiple tiers (free, pro, enterprise)
 * - Burst protection
 * - Distributed rate limiting (Redis Cluster)
 * - Advanced analytics
 * - Custom rules per endpoint
 * 
 * Example:
 * ```typescript
 * const limiter = new EnterpriseRateLimiter({
 *   tiers: {
 *     free: { requests: 10, window: '10s' },
 *     pro: { requests: 100, window: '10s' },
 *     enterprise: { requests: 1000, window: '10s' },
 *   },
 *   burst: {
 *     enabled: true,
 *     multiplier: 2,
 *   },
 * });
 * ```
 */
