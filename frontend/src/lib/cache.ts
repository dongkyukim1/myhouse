// Enhanced multi-tier caching system for MSA performance
interface CacheItem {
  data: any;
  timestamp: number;
  expiresIn: number;
  hits: number;
  lastAccessed: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
  memoryUsage: number;
}

class EnhancedCache {
  private cache = new Map<string, CacheItem>();
  private stats = { hits: 0, misses: 0 };
  private maxSize: number;
  private cleanupInterval: NodeJS.Timeout;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;

    // Auto-cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);

    // Graceful shutdown cleanup
    process.on('SIGTERM', () => {
      clearInterval(this.cleanupInterval);
    });
  }

  set(key: string, data: any, expiresIn: number = 5 * 60 * 1000, tags: string[] = []): void {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data: this.deepClone(data), // Prevent data mutation
      timestamp: Date.now(),
      expiresIn,
      hits: 0,
      lastAccessed: Date.now()
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) {
      this.stats.misses++;
      return null;
    }

    const now = Date.now();
    if (now - item.timestamp > item.expiresIn) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update access statistics
    item.hits++;
    item.lastAccessed = now;
    this.stats.hits++;

    return this.deepClone(item.data); // Prevent data mutation
  }

  // Check if key exists without affecting stats
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;

    const now = Date.now();
    if (now - item.timestamp > item.expiresIn) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  // Delete specific key
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
  }

  // Get cache statistics
  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;

    // Estimate memory usage
    let memoryUsage = 0;
    for (const [key, item] of this.cache) {
      memoryUsage += this.estimateSize(key) + this.estimateSize(item.data);
    }

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.cache.size,
      hitRate: Math.round(hitRate * 100) / 100,
      memoryUsage
    };
  }

  // LRU eviction strategy
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, item] of this.cache) {
      if (item.lastAccessed < oldestTime) {
        oldestTime = item.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  // Clean expired entries
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, item] of this.cache) {
      if (now - item.timestamp > item.expiresIn) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));

    if (keysToDelete.length > 0) {
      console.log(`🧹 Cache cleanup: removed ${keysToDelete.length} expired entries`);
    }
  }

  // Deep clone to prevent data mutation
  private deepClone(obj: any): any {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj);
    if (Array.isArray(obj)) return obj.map(item => this.deepClone(item));

    const cloned: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = this.deepClone(obj[key]);
      }
    }
    return cloned;
  }

  // Estimate object size in bytes
  private estimateSize(obj: any): number {
    const str = JSON.stringify(obj);
    return str.length * 2; // Rough estimate (UTF-16)
  }
}

// Create specialized cache instances
export const apiCache = new EnhancedCache(500);
export const dbCache = new EnhancedCache(200);
export const userCache = new EnhancedCache(100);

// Cache key builders
export const CacheKeys = {
  user: (id: string) => `user:${id}`,
  userSession: (token: string) => `session:${token}`,
  boardPost: (id: string) => `board:post:${id}`,
  boardCategory: () => 'board:categories',
  openbankingAccount: (userId: string) => `openbanking:accounts:${userId}`,
  openbankingBalance: (fintech: string) => `openbanking:balance:${fintech}`,
  eligibility: (userId: string) => `eligibility:${userId}`,
  notices: (page: number, limit: number) => `notices:${page}:${limit}`
};

// Cache middleware for API routes
export function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  expiresIn: number = 5 * 60 * 1000
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    try {
      // Try to get from cache
      const cached = apiCache.get(key);
      if (cached !== null) {
        resolve(cached);
        return;
      }

      // Execute function and cache result
      const result = await fn();
      apiCache.set(key, result, expiresIn);
      resolve(result);
    } catch (error) {
      reject(error);
    }
  });
}

// Export cache statistics endpoint data
export function getAllCacheStats() {
  return {
    apiCache: apiCache.getStats(),
    dbCache: dbCache.getStats(),
    userCache: userCache.getStats(),
    timestamp: new Date().toISOString()
  };
}
