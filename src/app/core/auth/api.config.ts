import { InjectionToken, isDevMode } from '@angular/core';

/** API hospedada (Render). Um lugar só para trocar de ambiente. */
export const API_HOSPEDADA = 'https://auza-api-xynb.onrender.com';

/**
 * Raiz da API. Vem por token e não de uma constante importada para que os testes
 * possam trocar por um valor fixo sem tocar em rede.
 *
 * DUAS FORMAS, de propósito:
 *
 *  - em desenvolvimento o caminho é RELATIVO (`/api/v1`), então a chamada sai
 *    para o próprio dev server, que a repassa para a API hospedada (proxy em
 *    proxy.config.json). É a única forma de funcionar hoje: a API hospedada NÃO
 *    devolve `Access-Control-Allow-Origin` para nenhuma origem, e o browser
 *    bloqueia qualquer chamada direta. Como o repasse é servidor-a-servidor, CORS
 *    não entra na conversa;
 *  - em build de produção o endereço é absoluto, porque ali não há dev server
 *    para repassar. Para o front publicado funcionar, o backend precisa liberar a
 *    origem dele no CORS.
 *
 * Para rodar contra a API local, troque por 'http://localhost:3333/api/v1' — ou
 * aponte o target do proxy para lá, que é o mesmo efeito sem tocar no código.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => (isDevMode() ? '/api/v1' : `${API_HOSPEDADA}/api/v1`),
});

/**
 * Rotas que NÃO devem receber o header Authorization nem disparar renovação de
 * sessão: são justamente as que emitem tokens. Tentar renovar em cima de um 401
 * de /login criaria laço e, pior, gastaria o refresh token à toa.
 */
export const ROTAS_PUBLICAS_AUTH = ['/auth/login', '/auth/register', '/auth/refresh'] as const;

export function ehRotaPublicaDeAuth(url: string): boolean {
  return ROTAS_PUBLICAS_AUTH.some((rota) => url.includes(rota));
}
