import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { APP_BASE_HREF, LocationStrategy, HashLocationStrategy } from '@angular/common';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes)]
};
