// tests/unit/security/rate-limiter.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RateLimiter } from '@/lib/security/rate-limiter';

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;
  let mockRedis: any;

  beforeEach(() => {
    mockRedis = {
      multi: vi.fn().mockReturnThis(),
      zadd: vi.fn().mockReturnThis(),
      zremrangebyscore: vi.fn().mockReturnThis(),
      zcard: vi.fn().mockReturnThis(),
      expire: vi.fn().mockReturnThis(),
      exec: vi.fn(),
    };

    rateLimiter = new RateLimiter(mockRedis);
  });

  describe('enforce', () => {
    it('should allow requests under limit', async () => {
      mockRedis.exec.mockResolvedValue([
        [null, 1],  // zadd
        [null, 0],  // zremrangebyscore
        [null, 5],  // zcard (5 requests - under limit)
        [null, 1],  // expire
      ]);

      await expect(
        rateLimiter.enforce('user-123', 'code-generation')
      ).resolves.not.toThrow();
    });

    it('should block requests over limit', async () => {
      mockRedis.exec.mockResolvedValue([
        [null, 1],
        [null, 0],
        [null, 51], // zcard (51 requests - over limit of 50)
        [null, 1],
      ]);

      await expect(
        rateLimiter.enforce('user-123', 'code-generation')
      ).rejects.toThrow(/rate limit/i);
    });

    it('should use sliding window algorithm', async () => {
      const now = Date.now();
      vi.spyOn(Date, 'now').mockReturnValue(now);

      mockRedis.exec.mockResolvedValue([
        [null, 1],
        [null, 0],
        [null, 10],
        [null, 1],
      ]);

      await rateLimiter.enforce('user-123', 'code-generation');

      // Verify old entries are removed
      expect(mockRedis.zremrangebyscore).toHaveBeenCalledWith(
        expect.any(String),
        0,
        now - 60000 // 1 minute window
      );
    });

    it('should apply different limits per action type', async () => {
      const actions = [
        { action: 'code-generation', limit: 50 },
        { action: 'rag-retrieval', limit: 200 },
        { action: 'agent-execution', limit: 20 },
      ];

      for (const { action, limit } of actions) {
        mockRedis.exec.mockResolvedValue([
          [null, 1],
          [null, 0],
          [null, limit + 1], // Over limit
          [null, 1],
        ]);

        await expect(
          rateLimiter.enforce('user-123', action)
        ).rejects.toThrow();
      }
    });

    it('should set expiration on rate limit keys', async () => {
      mockRedis.exec.mockResolvedValue([
        [null, 1],
        [null, 0],
        [null, 5],
        [null, 1],
      ]);

      await rateLimiter.enforce('user-123', 'code-generation');

      expect(mockRedis.expire).toHaveBeenCalledWith(
        expect.any(String),
        60 // 60 seconds
      );
    });
  });

  describe('getUsage', () => {
    it('should return current usage statistics', async () => {
      mockRedis.exec.mockResolvedValue([
        [null, 0],
        [null, 25], // 25 requests
      ]);

      const usage = await rateLimiter.getUsage('user-123', 'code-generation');

      expect(usage).toEqual({
        current: 25,
        limit: 50,
        remaining: 25,
        resetAt: expect.any(Date),
      });
    });

    it('should clean up expired entries before counting', async () => {
      const now = Date.now();
      vi.spyOn(Date, 'now').mockReturnValue(now);

      mockRedis.exec.mockResolvedValue([
        [null, 0],
        [null, 10],
      ]);

      await rateLimiter.getUsage('user-123', 'code-generation');

      expect(mockRedis.zremrangebyscore).toHaveBeenCalledWith(
        expect.any(String),
        0,
        now - 60000
      );
    });
  });

  describe('error handling', () => {
    it('should handle Redis connection errors', async () => {
      mockRedis.exec.mockRejectedValue(new Error('Redis connection failed'));

      await expect(
        rateLimiter.enforce('user-123', 'code-generation')
      ).rejects.toThrow('Redis connection failed');
    });

    it('should handle null Redis results', async () => {
      mockRedis.exec.mockResolvedValue(null);

      await expect(
        rateLimiter.enforce('user-123', 'code-generation')
      ).rejects.toThrow();
    });
  });
});
