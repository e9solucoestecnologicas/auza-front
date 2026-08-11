import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';
import { authInterceptor } from './core/auth/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    /**
     * Os dois ajustes de scroll existem por causa da /produtos:
     *
     *  - `scrollPositionRestoration`: sem ele o Angular mantém a posição de
     *    scroll ao trocar de rota. O "Ver todos os produtos" fica no PÉ da
     *    vitrine, então o catálogo abriria no meio da página. `enabled` leva ao
     *    topo em navegação nova e devolve a posição no voltar/avançar do browser;
     *  - `anchorScrolling`: é o que faz `/home#contato` descer até a seção. Os
     *    `#ancora` da /produtos (rodapé, "Solicitar orçamento") apontam para
     *    seções da home, e sem isto a navegação chegaria lá no topo.
     */
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
    ),
    // Interceptor funcional (não classe): é o formato suportado quando o
    // HttpClient é provido por `provideHttpClient`, e o único que o Angular
    // executa sem `withInterceptorsFromDi`.
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
};
