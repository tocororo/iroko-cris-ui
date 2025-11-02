// src/app/app.config.ts
import {
  ApplicationConfig,
  provideZoneChangeDetection,
  isDevMode,
  ErrorHandler,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideServiceWorker } from '@angular/service-worker';
import { provideMarkdown } from 'ngx-markdown';

import { routes } from './app.routes';
import { CypherApiService } from './services/cypher-api.service';
import { ErrorHandlerService } from './services/error-handler.service';
import { cachingInterceptor } from './interceptors/caching.interceptor';
import { jwtInterceptor } from './interceptors/jwt.interceptor';
import {
  CacheConfigService,
  DEFAULT_CACHE_CONFIG,
} from './services/cache-config.service';
import { CacheService } from './services/cache.service';
import { AuthService } from './services/auth.service';
import { EvaluationService } from './services/evaluation.service';
import { NodeEditService } from './services/node-edit.service';

// TODO: check and test the cache before use...

// Custom cache configuration for PWA
const CACHE_CONFIG = {
  ...DEFAULT_CACHE_CONFIG,

  // API Caching - shorter TTL in development
  apiCacheEnabled: true,
  apiDefaultTTL: isDevMode() ? 2 * 60 * 1000 : 5 * 60 * 1000,

  // Static Assets Caching - always cache in production, optional in development
  staticAssetsCacheEnabled: !isDevMode(), // Disable in dev for easier testing
  staticAssetsTTL: 24 * 60 * 60 * 1000, // 24 hours

  // Static assets paths - these are your public folder assets
  staticAssetsPaths: ['/config.json', '/labels.json', '/md/', '/img/'],

  // General
  maxCacheSize: isDevMode() ? 100 : 1000,
};

export const appConfig: ApplicationConfig = {
  providers: [
    // Zone.js optimization
    provideZoneChangeDetection({ eventCoalescing: true }),

    // Router
    provideRouter(routes),

    // HTTP client with modern fetch + interceptors
    provideHttpClient(
      withFetch(),
      withInterceptors([
        jwtInterceptor, // JWT first to add auth headers
        // cachingInterceptor, // Caching after auth
      ])
    ),

    // Animations
    provideAnimations(),

    // Markdown support
    provideMarkdown(),

    // Service Worker (PWA) – only in production
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),

    // Cache configuration with PWA-optimized settings
    // {
    //   provide: 'CACHE_CONFIG',
    //   useValue: CACHE_CONFIG,
    // },
    // CacheConfigService,
    // CacheService,

    // Application-specific services
    CypherApiService,
    AuthService,
    EvaluationService,
    NodeEditService,

    // Global error handler
    {
      provide: ErrorHandler,
      useClass: ErrorHandlerService,
    },
  ],
};
