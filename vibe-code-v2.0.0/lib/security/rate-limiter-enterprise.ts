// lib/security/rate-limiter-enterprise.ts
/**
 * Enterprise Rate Limiter with Redis Sliding Window
 * 
 * Features:
 * - Sliding window algorithm
 * - Distributed rate limiting
 * - Per-action limits
 * - Usage statistics
 */

import type Redis from 'ioredis';
import { v4 as uuid } from 'uuid';

export interface RateLimit {
  max: number;
  window: number; // milliseconds
}

export class RateLimitError extends Error {
  constructor(
    message: string,
    public retryAfter: number
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class EnterpriseRateLimiter {
  private limits: Record<string, RateLimit> = {
    'code-generation': { max: 50, window: 60000 },    // 50/min
    'rag-retrieval': { max: 200, window: 60000 },     // 200/min
    'agent-execution': { max: 20, window: 60000 },    // 20/min
    'api-call': { max: 100, window: 60000 },          // 100/min (default)
  };

  constructor(private redis: Redis) {}

  async enforce(userId: string, action: string): Promise<void> {
    const key = `rate:${userId}:${action}`;
    const limit = this.getLimitForAction(action);
    const now = Date.now();
    const windowStart = now - limit.window;

    // Sliding window with Redis sorted set
    const results = await this.redis
      .multi()
      .zadd(key, now, uuid()) // Add current request with timestamp
      .zremrangebyscore(key, 0, windowStart) // Remove old requests
      .zcard(key) // Count requests in window
      .expire(key, Math.ceil(limit.window / 1000)) // Set expiration
      .exec();

    if (!results) {
      throw new Error('Rate limiter: Redis multi command failed');
    }

    const count = results[2][1] as number;

    if (count > limit.max) {
      const retryAfter = Math.ceil(limit.window / 1000);
      throw new RateLimitError(
        `Rate limit exceeded for ${action}. Try again in ${retryAfter}s`,
        retryAfter
      );
    }
  }

  async getUsage(userId: string, action: string): Promise<{
    current: number;
    limit: number;
    remaining: number;
    resetAt: Date;
  }> {
    const key = `rate:${userId}:${action}`;
    const limit = this.getLimitForAction(action);
    const now = Date.now();
    const windowStart = now - limit.window;

    const results = await this.redis
      .multi()
      .zremrangebyscore(key, 0, windowStart)
      .zcard(key)
      .exec();

    const current = (results?.[1][1] as number) || 0;
    const remaining = Math.max(0, limit.max - current);
    const resetAt = new Date(now + limit.window);

    return {
      current,
      limit: limit.max,
      remaining,
      resetAt,
    };
  }

  private getLimitForAction(action: string): RateLimit {
    return this.limits[action] || this.limits['api-call'];
  }

  /**
   * Update limit for specific action (admin only)
   */
  async setLimit(action: string, max: number, window: number): Promise<void> {
    this.limits[action] = { max, window };
  }

  /**
   * Get all configured limits
   */
  getLimits(): Record<string, RateLimit> {
    return { ...this.limits };
  }

  /**
   * Reset rate limit for user
   */
  async reset(userId: string, action: string): Promise<void> {
    const key = `rate:${userId}:${action}`;
    await this.redis.del(key);
  }

  /**
   * Get rate limit statistics
   */
  async getStats(userId: string): Promise<Record<string, {
    current: number;
    limit: number;
    percentage: number;
  }>> {
    const stats: Record<string, any> = {};

    for (const action of Object.keys(this.limits)) {
      const usage = await this.getUsage(userId, action);
      stats[action] = {
        current: usage.current,
        limit: usage.limit,
        percentage: Math.round((usage.current / usage.limit) * 100),
      };
    }

    return stats;
  }
}
