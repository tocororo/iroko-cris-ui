// src/app/interceptors/caching.interceptor.ts
import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from '../services/cache.service';
import { CacheConfigService } from '../services/cache-config.service';

export const cachingInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const cacheService = inject(CacheService);
  const configService = inject(CacheConfigService);

  // Only cache GET requests
  if (req.method !== 'GET') {
    return next(req);
  }

  // Check if URL should be cached (either API or static assets)
  if (!configService.isUrlCacheable(req.url)) {
    return next(req);
  }

  const cacheKey = generateCacheKey(req);
  const cachedResponse = cacheService.get<HttpResponse<any>>(cacheKey);

  if (cachedResponse) {
    // Return cached response as Observable
    return of(cachedResponse);
  }

  // Proceed with actual request
  return next(req).pipe(
    tap((event) => {
      if (event instanceof HttpResponse) {
        // Only cache successful responses
        if (event.status >= 200 && event.status < 300) {
          const ttl = configService.getTTLForUrl(req.url);
          cacheService.set(cacheKey, event, ttl);
        }
      }
    })
  );
};

function generateCacheKey(req: HttpRequest<unknown>): string {
  // For static assets, we might want to include the entire URL
  // For API calls, we include method and parameters
  if (req.url.includes('/api/')) {
    return `http:${req.method}:${req.urlWithParams}`;
  } else {
    // For static assets, use the full URL as key
    return `asset:${req.urlWithParams}`;
  }
}

// Export utility functions for manual cache management
export function clearCache(): void {
  const cacheService = inject(CacheService);
  cacheService.clear();
}

export function clearApiCache(): number {
  const cacheService = inject(CacheService);
  return cacheService.deleteByPattern(/^http:/);
}

export function clearStaticAssetsCache(): number {
  const cacheService = inject(CacheService);
  return cacheService.deleteByPattern(/^asset:/);
}

export function deleteCacheByPattern(pattern: string | RegExp): number {
  const cacheService = inject(CacheService);
  const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
  return cacheService.deleteByPattern(regex);
}

export function getCacheStats(): { size: number; keys: string[] } {
  const cacheService = inject(CacheService);
  return cacheService.getStats();
}
