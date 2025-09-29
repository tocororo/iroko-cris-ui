// src/app/services/cache.service.ts
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

interface CacheItem {
  data: any;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

@Injectable({
  providedIn: 'root',
})
export class CacheService {
  private cache = new Map<string, CacheItem>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    // Clean up expired cache items every minute
    setInterval(() => this.cleanup(), 60 * 1000);
  }

  set(key: string, data: any, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  getOrFetch<T>(
    key: string,
    fetchFn: () => Observable<T>,
    ttl: number = this.defaultTTL
  ): Observable<T> {
    const cached = this.get(key);
    if (cached !== null) {
      return of(cached);
    }

    return new Observable<T>((observer) => {
      fetchFn().subscribe({
        next: (data) => {
          this.set(key, data, ttl);
          observer.next(data);
          observer.complete();
        },
        error: (err) => observer.error(err),
      });
    });
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    this.cache.forEach((item, key) => {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    });
  }
}
