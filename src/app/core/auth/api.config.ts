import { InjectionToken } from '@angular/core';

/**
 * Raiz da API. Vem por token e não de uma constante importada para que os testes
 * possam trocar por um valor fixo sem tocar em rede, e para que o deploy possa
 * sobrescrever num único lugar (app.config.ts).
 *
 * O auza-back sobe em :3333 e prefixa tudo com /api/v1 (ver src/routes.ts lá).
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => 'http://localhost:3333/api/v1',
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
