import { HttpErrorResponse, type HttpInterceptorFn, type HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { API_BASE_URL, ehRotaPublicaDeAuth } from './api.config';
import { AuthService } from './auth.service';
import { TokenStorage } from './token-storage';

/** Anexa o Bearer na requisição, quando houver token. */
function comBearer(req: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
  return token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
}

/**
 * Autentica as requisições e renova a sessão quando o access token vence.
 *
 * Três limites deliberados:
 *
 * 1. Só mexe em requisições para a NOSSA API. Anexar o token da Auza num pedido a
 *    terceiro seria vazar credencial.
 * 2. Não toca em /auth/login, /register e /refresh: são as rotas que EMITEM
 *    tokens. Tentar renovar em cima de um 401 de login criaria laço e gastaria o
 *    refresh token à toa.
 * 3. Renova UMA vez por requisição. A segunda tentativa sai do `switchMap`, fora
 *    do `catchError` externo, então um 401 depois da renovação sobe para quem
 *    chamou em vez de virar laço infinito.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const base = inject(API_BASE_URL);

  if (!req.url.startsWith(base) || ehRotaPublicaDeAuth(req.url)) {
    return next(req);
  }

  const auth = inject(AuthService);
  const tokens = inject(TokenStorage);

  return next(comBearer(req, tokens.accessToken)).pipe(
    catchError((erro: unknown) => {
      const status = erro instanceof HttpErrorResponse ? erro.status : 0;
      if (status !== 401) {
        return throwError(() => erro);
      }

      return auth.renovar().pipe(
        switchMap((novoToken) => next(comBearer(req, novoToken))),
        // Renovação falhou: o AuthService já limpou a sessão e redirecionou.
        // Quem chamou recebe o 401 original, que descreve melhor o que pediu.
        catchError(() => throwError(() => erro)),
      );
    }),
  );
};
