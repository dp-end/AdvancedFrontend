import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http'; // <--- HttpClient provider'ını import et

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), // Genellikle varsayılan olarak bulunur
    provideRouter(routes),                                // Rotalarını sağla
    provideHttpClient()                                   // <--- HttpClient'ı burada sağla
    // Eğer HTTP Interceptor kullanacaksanız, provideHttpClient(withInterceptorsFromDi()) gibi ek yapılandırmalar gerekebilir
    ]
};
