// src/app/services/cache-config.service.ts
import { Injectable, inject } from '@angular/core';

export interface CacheConfig {
  // API Caching
  apiCacheEnabled: boolean;
  apiDefaultTTL: number;
  apiCacheablePaths: string[];
  apiExcludedPaths: string[];

  // Static Assets Caching
  staticAssetsCacheEnabled: boolean;
  staticAssetsTTL: number;
  staticAssetsPaths: string[];

  // General
  maxCacheSize: number;
}

export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  // API Caching
  apiCacheEnabled: true,
  apiDefaultTTL: 5 * 60 * 1000, // 5 minutes
  apiCacheablePaths: ['/api/v1/'],
  apiExcludedPaths: ['/api/v1/auth/', '/api/v1/evals/'],

  // Static Assets Caching
  staticAssetsCacheEnabled: true,
  staticAssetsTTL: 24 * 60 * 60 * 1000, // 24 hours for static assets
  staticAssetsPaths: ['/config.json', '/labels.json', '/md/', '/img/'],

  // General
  maxCacheSize: 1000,
};

@Injectable({
  providedIn: 'root',
})
export class CacheConfigService {
  private config: CacheConfig;

  constructor() {
    const customConfig = inject<Partial<CacheConfig>>('CACHE_CONFIG' as any, { optional: true });

    this.config = { ...DEFAULT_CACHE_CONFIG, ...customConfig };
  }

  updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): CacheConfig {
    return { ...this.config };
  }

  // API Cache Methods
  isApiCacheEnabled(): boolean {
    return this.config.apiCacheEnabled;
  }

  isApiUrlCacheable(url: string): boolean {
    if (!this.config.apiCacheEnabled) return false;

    const isInCacheablePath = this.config.apiCacheablePaths.some((path) =>
      url.includes(path)
    );
    const isInExcludedPath = this.config.apiExcludedPaths.some((path) =>
      url.includes(path)
    );

    return isInCacheablePath && !isInExcludedPath;
  }

  getApiTTLForUrl(url: string): number {
    if (url.includes('/api/config')) return 30 * 60 * 1000; // 30 minutes
    if (url.includes('/api/reference-data')) return 60 * 60 * 1000; // 1 hour
    if (url.includes('/api/users')) return 2 * 60 * 1000; // 2 minutes

    return this.config.apiDefaultTTL;
  }

  // Static Assets Cache Methods
  isStaticAssetsCacheEnabled(): boolean {
    return this.config.staticAssetsCacheEnabled;
  }

  isStaticAssetUrl(url: string): boolean {
    if (!this.config.staticAssetsCacheEnabled) return false;

    return this.config.staticAssetsPaths.some(
      (path) => url.includes(path) || url.endsWith(path)
    );
  }

  getStaticAssetsTTL(): number {
    return this.config.staticAssetsTTL;
  }

  getTTLForUrl(url: string): number {
    if (this.isStaticAssetUrl(url)) {
      return this.getStaticAssetsTTL();
    }
    return this.getApiTTLForUrl(url);
  }

  isUrlCacheable(url: string): boolean {
    return this.isApiUrlCacheable(url) || this.isStaticAssetUrl(url);
  }
}
