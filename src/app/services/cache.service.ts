// src/app/services/cache.service.ts
import { Injectable, OnDestroy, Inject } from '@angular/core';
import { Observable, of, from } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { CacheConfigService, CacheConfig } from './cache-config.service';

interface CacheItem {
  data: any;
  timestamp: number;
  ttl: number;
  key: string;
}

@Injectable({
  providedIn: 'root',
})
export class CacheService implements OnDestroy {
  private cache = new Map<string, CacheItem>();
  private ongoingRequests = new Map<string, Observable<any>>();
  private cleanupInterval: any;

  constructor(private configService: CacheConfigService) {
    this.startCleanup();
  }

  ngOnDestroy(): void {
    this.stopCleanup();
  }

  set(key: string, data: any, ttl?: number): void {
    const config = this.configService.getConfig();

    // Enforce max cache size (LRU-like eviction)
    if (this.cache.size >= config.maxCacheSize) {
      this.evictOldestEntry();
    }

    this.cache.set(key, {
      data: this.deepClone(data),
      timestamp: Date.now(),
      ttl: ttl || this.configService.getTTLForUrl(key),
      key,
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (this.isExpired(item)) {
      this.cache.delete(key);
      return null;
    }

    return this.deepClone(item.data);
  }

  getOrFetch<T>(
    key: string,
    fetchFn: () => Observable<T>,
    ttl?: number
  ): Observable<T> {
    // Return cached data if available
    const cached = this.get<T>(key);
    if (cached !== null) {
      return of(cached);
    }

    // Return ongoing request to prevent duplicates
    if (this.ongoingRequests.has(key)) {
      return this.ongoingRequests.get(key)!;
    }

    // Create new request with shareReplay for multiple subscribers
    const request = fetchFn().pipe(shareReplay(1));

    this.ongoingRequests.set(key, request);

    request.subscribe({
      next: (data) => {
        this.set(key, data, ttl);
        this.ongoingRequests.delete(key);
      },
      error: () => {
        this.ongoingRequests.delete(key);
      },
    });

    return request;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  deleteByPattern(pattern: RegExp): number {
    let deletedCount = 0;
    Array.from(this.cache.keys()).forEach((key) => {
      if (pattern.test(key)) {
        if (this.cache.delete(key)) {
          deletedCount++;
        }
      }
    });
    return deletedCount;
  }

  clear(): void {
    this.cache.clear();
    this.ongoingRequests.clear();
  }

  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  private isExpired(item: CacheItem): boolean {
    return Date.now() - item.timestamp > item.ttl;
  }

  private deepClone<T>(data: T): T {
    // Simple clone - consider using libraries like lodash for complex objects
    try {
      return JSON.parse(JSON.stringify(data));
    } catch (error) {
      console.warn(
        'CacheService: Unable to clone data, returning original',
        error
      );
      return data;
    }
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000); // Run cleanup every minute
  }

  private stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    this.cache.forEach((item, key) => {
      if (this.isExpired(item)) {
        this.cache.delete(key);
      }
    });
  }

  private evictOldestEntry(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Date.now();

    this.cache.forEach((item, key) => {
      if (item.timestamp < oldestTimestamp) {
        oldestTimestamp = item.timestamp;
        oldestKey = key;
      }
    });

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
}
