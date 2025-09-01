// 간단한 메모리 캐시 (YouTube API 할당량 절약용)
interface CacheItem {
  data: any;
  timestamp: number;
  expiresIn: number; // milliseconds
}

class SimpleCache {
  private cache = new Map<string, CacheItem>();

  set(key: string, data: any, expiresIn: number = 5 * 60 * 1000) { // 기본 5분
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const now = Date.now();
    if (now - item.timestamp > item.expiresIn) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

export const apiCache = new SimpleCache();
