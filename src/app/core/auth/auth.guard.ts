import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import type { Papel } from './auth.models';
import { AuthService } from './auth.service';

/**
 * Em recarregamento de página o usuário em memória está vazio mas o token está
 * em disco, então tenta restaurar antes de barrar — sem isso, dar F5 numa rota
 * protegida jogaria todo mundo para o login.
 */
function garantirSessao(auth: AuthService): Promise<boolean> {
  return auth.autenticado() ? Promise.resolve(true) : auth.restaurarSessao();
}

/**
 * `UrlTree` em vez de `navigate`: deixa o Router cancelar esta navegação e fazer
 * a outra numa transição só, sem piscar a rota protegida.
 */
function paraLogin(router: Router, urlTentada: string) {
  return router.createUrlTree(['/login'], { queryParams: { redirecionar: urlTentada } });
}

/** Exige sessão. */
export const authGuard: CanActivateFn = async (_rota, estado) => {
  // `inject` tem que rodar antes do primeiro await: depois dele o contexto de
  // injeção já não existe.
  const auth = inject(AuthService);
  const router = inject(Router);

  return (await garantirSessao(auth)) ? true : paraLogin(router, estado.url);
};

/**
 * Exige um dos papéis informados. O backend também checa (`app.authorize` lá), o
 * que importa porque guard de front é conveniência de navegação, não segurança:
 * quem chamar a API direto continua barrado no servidor.
 */
export function papelGuard(...papeis: readonly Papel[]): CanActivateFn {
  return async (_rota, estado) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!(await garantirSessao(auth))) {
      return paraLogin(router, estado.url);
    }

    const papel = auth.papel();
    // Autenticado mas sem permissão: volta para o painel, não para o login —
    // mandar para o login sugeriria que o problema é a sessão.
    return papel !== null && papeis.includes(papel) ? true : router.createUrlTree(['/painel']);
  };
}
