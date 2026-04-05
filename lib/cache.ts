// Simple in-memory cache for server-side caching
// For production, use Redis (Upstash)

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class MemoryCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private defaultTTL: number = 60 * 1000; // 1 minute

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > this.defaultTTL) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });

    // Clean up after TTL
    setTimeout(() => {
      this.cache.delete(key);
    }, ttl || this.defaultTTL);
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

export const cache = new MemoryCache();

// Helper function for cached queries
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> {
  const cached = cache.get<T>(key);
  if (cached) return cached;

  const data = await fetcher();
  cache.set(key, data, ttl);
  return data;
}

// Invalidate user-specific cache
export function invalidateUserCache(userId: string): void {
  cache.invalidatePattern(`.*${userId}.*`);
}