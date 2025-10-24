// lib/performance/cache-manager.ts
/**
 * Multi-Layer Cache Manager
 * 
 * Resumo:
 * Sistema de cache em 3 camadas (L1: Memory, L2: Memcached, L3: Redis)
 * para otimizar latência e throughput de aplicação
 * 
 * MVP: L1 (Memory) + L3 (Redis)
 * Enterprise: L1 + L2 + L3 com estratégia de invalidação inteligente
 */

import type Redis from 'ioredis';
import { LRUCache } from 'lru-cache';

export interface CacheConfig {
  l1: {
    maxSize: number; // bytes
    ttl: number; // milliseconds
    max: number; // max items
  };
  l2?: {
    servers: string[];
    ttl: number;
  };
  l3: {
    ttl: number;
  };
}

export interface CacheStats {
  l1: {
    hits: number;
    misses: number;
    size: number;
    hitRate: number;
  };
  l2?: {
    hits: number;
    misses: number;
    hitRate: number;
  };
  l3: {
    hits: number;
    misses: number;
    hitRate: number;
  };
}

// ============================================================================
// SOLUTION RÁPIDA (MVP)
// ============================================================================

export class CacheManager {
  private l1: LRUCache<string, any>; // Memory cache
  private l3: Redis; // Redis cache
  private stats: CacheStats;

  constructor(
    redis: Redis,
    config: Partial<CacheConfig> = {}
  ) {
    // L1: In-memory LRU cache (fastest)
    this.l1 = new LRUCache({
      max: config.l1?.max || 1000,
      maxSize: config.l1?.maxSize || 100 * 1024 * 1024, // 100MB default
      sizeCalculation: (value) => JSON.stringify(value).length,
      ttl: config.l1?.ttl || 60000, // 1 minute default
    });

    // L3: Redis (persistent)
    this.l3 = redis;

    // Initialize stats
    this.stats = {
      l1: { hits: 0, misses: 0, size: 0, hitRate: 0 },
      l3: { hits: 0, misses: 0, hitRate: 0 },
    };
  }

  /**
   * Get value from cache (checks all layers)
   */
  async get<T>(key: string): Promise<T | null> {
    // Check L1 (memory) - fastest
    const l1Value = this.l1.get(key);
    if (l1Value !== undefined) {
      this.stats.l1.hits++;
      this.updateHitRate();
      return l1Value as T;
    }
    this.stats.l1.misses++;

    // Check L3 (redis)
    try {
      const l3Value = await this.l3.get(key);
      if (l3Value) {
        this.stats.l3.hits++;
        const parsed = JSON.parse(l3Value) as T;
        
        // Promote to L1
        this.l1.set(key, parsed);
        
        this.updateHitRate();
        return parsed;
      }
    } catch (error) {
      console.error('Redis get error:', error);
    }
    
    this.stats.l3.misses++;
    this.updateHitRate();
    return null;
  }

  /**
   * Set value in all cache layers
   */
  async set<T>(
    key: string,
    value: T,
    ttl: number = 300 // seconds
  ): Promise<void> {
    const serialized = JSON.stringify(value);

    // Set in L1 (memory)
    this.l1.set(key, value);

    // Set in L3 (redis)
    try {
      await this.l3.setex(key, ttl, serialized);
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  /**
   * Delete from all layers
   */
  async delete(key: string): Promise<void> {
    this.l1.delete(key);
    
    try {
      await this.l3.del(key);
    } catch (error) {
      console.error('Redis delete error:', error);
    }
  }

  /**
   * Clear all caches
   */
  async clear(): Promise<void> {
    this.l1.clear();
    
    try {
      await this.l3.flushdb();
    } catch (error) {
      console.error('Redis flush error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return {
      ...this.stats,
      l1: {
        ...this.stats.l1,
        size: this.l1.size,
      },
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      l1: { hits: 0, misses: 0, size: 0, hitRate: 0 },
      l3: { hits: 0, misses: 0, hitRate: 0 },
    };
  }

  /**
   * Update hit rate calculations
   */
  private updateHitRate(): void {
    const l1Total = this.stats.l1.hits + this.stats.l1.misses;
    if (l1Total > 0) {
      this.stats.l1.hitRate = this.stats.l1.hits / l1Total;
    }

    const l3Total = this.stats.l3.hits + this.stats.l3.misses;
    if (l3Total > 0) {
      this.stats.l3.hitRate = this.stats.l3.hits / l3Total;
    }
  }

  /**
   * Cache decorator for functions
   */
  cached<T>(
    keyGenerator: (...args: any[]) => string,
    ttl: number = 300
  ) {
    return (
      target: any,
      propertyKey: string,
      descriptor: PropertyDescriptor
    ) => {
      const originalMethod = descriptor.value;

      descriptor.value = async function(...args: any[]) {
        const key = keyGenerator(...args);
        
        // Try cache first
        const cached = await this.get<T>(key);
        if (cached !== null) {
          return cached;
        }

        // Execute original method
        const result = await originalMethod.apply(this, args);
        
        // Store in cache
        await this.set(key, result, ttl);
        
        return result;
      };

      return descriptor;
    };
  }
}

// ============================================================================
// SOLUTION ENTERPRISE
// ============================================================================

/**
 * Enterprise Cache Manager with Memcached (L2) layer
 */
export class EnterpriseCacheManager extends CacheManager {
  private l2: any; // Memcached client
  
  constructor(
    redis: Redis,
    memcached: any,
    config: CacheConfig
  ) {
    super(redis, config);
    this.l2 = memcached;
  }

  /**
   * Get value from cache (all 3 layers)
   */
  async get<T>(key: string): Promise<T | null> {
    // Check L1 (memory)
    const l1Value = this.l1.get(key);
    if (l1Value !== undefined) {
      return l1Value as T;
    }

    // Check L2 (memcached)
    const l2Value = await new Promise<T | null>((resolve) => {
      this.l2.get(key, (err: any, data: any) => {
        if (err || !data) resolve(null);
        else resolve(JSON.parse(data) as T);
      });
    });

    if (l2Value) {
      // Promote to L1
      this.l1.set(key, l2Value);
      return l2Value;
    }

    // Check L3 (redis)
    return super.get(key);
  }

  /**
   * Set value in all 3 layers
   */
  async set<T>(key: string, value: T, ttl: number = 300): Promise<void> {
    const serialized = JSON.stringify(value);

    // Set in L1
    this.l1.set(key, value);

    // Set in L2 (max 1 minute TTL)
    this.l2.set(key, serialized, Math.min(ttl, 60), () => {});

    // Set in L3
    await this.l3.setex(key, ttl, serialized);
  }
}

/**
 * Cache warming utility
 */
export class CacheWarmer {
  constructor(private cache: CacheManager) {}

  /**
   * Warm cache with commonly accessed keys
   */
  async warmCache(
    keys: string[],
    fetcher: (key: string) => Promise<any>
  ): Promise<void> {
    const promises = keys.map(async (key) => {
      try {
        const value = await fetcher(key);
        await this.cache.set(key, value);
      } catch (error) {
        console.error(`Failed to warm cache for key ${key}:`, error);
      }
    });

    await Promise.all(promises);
  }

  /**
   * Warm cache on schedule
   */
  scheduleWarming(
    keys: string[],
    fetcher: (key: string) => Promise<any>,
    interval: number = 3600000 // 1 hour
  ): NodeJS.Timeout {
    return setInterval(async () => {
      await this.warmCache(keys, fetcher);
    }, interval);
  }
}

// ============================================================================
// CHECKLIST UI/UX
// ============================================================================

/**
 * Cache monitoring UI components:
 * 
 * - [ ] Cache hit rate dashboard (real-time)
 * - [ ] Memory usage visualization (L1)
 * - [ ] Cache invalidation controls
 * - [ ] Key inspection tool
 * - [ ] Performance metrics graph
 * - [ ] Accessibility: ARIA live regions for updates
 */

// ============================================================================
// VALIDAÇÃO
// ============================================================================

/**
 * Target metrics:
 * 
 * - [ ] L1 hit rate: >90%
 * - [ ] L2 hit rate: >80%
 * - [ ] L3 hit rate: >70%
 * - [ ] Average latency: <10ms (L1), <50ms (L2), <100ms (L3)
 * - [ ] Memory usage: <100MB (L1)
 * - [ ] Zero cache stampede issues
 */

// ============================================================================
// PRÓXIMOS PASSOS
// ============================================================================

/**
 * Week 1:
 * - [ ] Implement L1 + L3 cache
 * - [ ] Basic stats tracking
 * - [ ] Integration tests
 * 
 * Week 2:
 * - [ ] Add L2 (Memcached) support
 * - [ ] Cache warming utility
 * - [ ] Performance benchmarks
 * 
 * Week 3-4 (Enterprise):
 * - [ ] Cache stampede protection
 * - [ ] Distributed cache invalidation
 * - [ ] Monitoring dashboard
 */
