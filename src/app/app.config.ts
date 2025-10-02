// src/app/app.config.ts
import {
  ApplicationConfig,
  provideZoneChangeDetection,
  isDevMode,
  ErrorHandler,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideServiceWorker } from '@angular/service-worker';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import { provideMarkdown } from 'ngx-markdown';

import { IrokoApiService } from './services/iroko-api.service';
import { ErrorHandlerService } from './services/error-handler.service';
import { cachingInterceptor } from './interceptors/caching.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    provideHttpClient(withFetch(), withInterceptors([cachingInterceptor])),
    provideMarkdown(), // Add this line
    IrokoApiService,
    {
      provide: ErrorHandler,
      useClass: ErrorHandlerService,
    },
  ],
};
