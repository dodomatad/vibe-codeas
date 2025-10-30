// lib/cache/cache-strategy.ts
/**
 * Caching strategies for performance optimization
 * Reduces API calls, speeds up responses, saves costs
 */

// In-memory cache (simple, fast, no dependencies)
class InMemoryCache<T> {
  private cache: Map<string, { data: T; timestamp: number; ttl: number }> = new Map();

  set(key: string, value: T, ttl: number = 300000): void {
    // Default TTL: 5 minutes
    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
      ttl,
    });

    // Auto-cleanup after TTL expires
    setTimeout(() => {
      this.delete(key);
    }, ttl);
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.delete(key);
      return null;
    }

    return entry.data;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.delete(key);
      return false;
    }

    return true;
  }
}

// Create cache instances for different data types
export const promptCache = new InMemoryCache<string>(); // Cache AI prompts/responses
export const fileCache = new InMemoryCache<Record<string, string>>(); // Cache file contents
export const packageCache = new InMemoryCache<string[]>(); // Cache installed packages
export const frameworkCache = new InMemoryCache<string>(); // Cache detected framework

/**
 * Cache decorator for functions
 * Usage: @cached(ttl)
 */
export function cached(ttl: number = 300000) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const cache = new InMemoryCache<any>();

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${propertyKey}-${JSON.stringify(args)}`;

      // Check cache first
      const cachedResult = cache.get(cacheKey);
      if (cachedResult !== null) {
        console.log(`[Cache HIT] ${propertyKey}`);
        return cachedResult;
      }

      // Execute original method
      console.log(`[Cache MISS] ${propertyKey}`);
      const result = await originalMethod.apply(this, args);

      // Store in cache
      cache.set(cacheKey, result, ttl);

      return result;
    };

    return descriptor;
  };
}

/**
 * Cache-aside pattern (lazy loading)
 * 1. Check cache
 * 2. If miss, fetch from source
 * 3. Store in cache
 * 4. Return data
 */
export async function cacheAside<T>(
  key: string,
  fetcher: () => Promise<T>,
  cache: InMemoryCache<T>,
  ttl: number = 300000
): Promise<T> {
  // 1. Check cache
  const cached = cache.get(key);
  if (cached !== null) {
    console.log(`[Cache HIT] ${key}`);
    return cached;
  }

  // 2. Fetch from source
  console.log(`[Cache MISS] ${key}`);
  const data = await fetcher();

  // 3. Store in cache
  cache.set(key, data, ttl);

  // 4. Return
  return data;
}

/**
 * Cache invalidation strategies
 */
export const cacheInvalidation = {
  /**
   * Invalidate by key
   */
  invalidate(key: string, cache: InMemoryCache<any>): void {
    cache.delete(key);
  },

  /**
   * Invalidate by pattern (prefix)
   */
  invalidatePattern(pattern: string, cache: InMemoryCache<any>): void {
    // Note: In-memory cache doesn't support pattern matching
    // For Redis, use SCAN + DEL
    console.warn('Pattern invalidation not supported for in-memory cache');
  },

  /**
   * Invalidate all
   */
  invalidateAll(cache: InMemoryCache<any>): void {
    cache.clear();
  },

  /**
   * Time-based invalidation (handled automatically by TTL)
   */
  setTTL(key: string, ttl: number, cache: InMemoryCache<any>): void {
    const data = cache.get(key);
    if (data !== null) {
      cache.set(key, data, ttl);
    }
  },
};

/**
 * Cache warming (preload frequently accessed data)
 */
export async function warmCache<T>(
  keys: string[],
  fetcher: (key: string) => Promise<T>,
  cache: InMemoryCache<T>,
  ttl: number = 300000
): Promise<void> {
  console.log(`[Cache WARM] Warming ${keys.length} keys...`);

  await Promise.all(
    keys.map(async (key) => {
      const data = await fetcher(key);
      cache.set(key, data, ttl);
    })
  );

  console.log(`[Cache WARM] Complete`);
}

/**
 * Cache statistics
 */
export function getCacheStats(cache: InMemoryCache<any>) {
  return {
    size: cache.size(),
    timestamp: Date.now(),
  };
}

/**
 * USAGE EXAMPLES:
 *
 * 1. Simple caching:
 *    ```typescript
 *    promptCache.set('my-prompt', 'cached response', 60000); // 1 min TTL
 *    const response = promptCache.get('my-prompt');
 *    ```
 *
 * 2. Cache-aside pattern:
 *    ```typescript
 *    const data = await cacheAside(
 *      'user:123',
 *      () => fetchUserFromDB('123'),
 *      userCache,
 *      300000 // 5 min
 *    );
 *    ```
 *
 * 3. Decorator:
 *    ```typescript
 *    class MyService {
 *      @cached(60000)
 *      async fetchData() {
 *        return await expensiveOperation();
 *      }
 *    }
 *    ```
 *
 * 4. Cache invalidation:
 *    ```typescript
 *    cacheInvalidation.invalidate('user:123', userCache);
 *    ```
 */

export default {
  promptCache,
  fileCache,
  packageCache,
  frameworkCache,
  cached,
  cacheAside,
  cacheInvalidation,
  warmCache,
  getCacheStats,
};
