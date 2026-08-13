import type { Credenciais, RespostaAutenticacao, UsuarioPublico } from './auth.models';

/* ============================================================================
   ACESSO PROVISÓRIO PARA TESTES — PARA REMOVER

   Um par de credenciais fixo entra no sistema SEM falar com o backend, para o
   pessoal navegar pelas telas enquanto a API não está disponível.

   Vale em QUALQUER build, inclusive de produção: foi decisão explícita, para o
   atalho funcionar onde o pessoal testar. Enquanto este arquivo existir, quem
   tiver a URL e o par abaixo entra no painel — e o par está legível no
   JavaScript entregue ao browser.

   Remover é: apagar este arquivo e os três trechos marcados PROVISÓRIO em
   auth.service.ts (o compilador aponta todos).
   ============================================================================ */

const EMAIL = 'admin@auza.local';
const SENHA = 'Admin@123';

/**
 * Valor gravado no lugar do access token.
 *
 * Serve de marca: é como `restaurarSessao` reconhece a sessão falsa depois de um
 * F5 (sem isso ela chamaria `/auth/me` e o testador cairia no login ao recarregar)
 * e como a renovação sabe que não há o que renovar.
 */
export const TOKEN_DE_TESTE = 'login-de-teste-sem-backend';

/** O e-mail não diferencia maiúsculas; a senha, sim. */
export function ehLoginDeTeste(credenciais: Credenciais): boolean {
  return credenciais.email.trim().toLowerCase() === EMAIL && credenciais.password === SENHA;
}

export function ehSessaoDeTeste(token: string | null): boolean {
  return token === TOKEN_DE_TESTE;
}

/**
 * Sessão de mentira no mesmo formato que o backend devolveria, para o resto do
 * app não precisar saber que ela é falsa.
 *
 * O vencimento do refresh fica 7 dias à frente porque `TokenStorage.refreshExpirado`
 * é consultado antes de qualquer renovação: com data no passado, o primeiro 401
 * mandaria o testador para o login.
 */
export function sessaoDeTeste(): RespostaAutenticacao {
  const agora = new Date();
  const seteDias = new Date(agora.getTime() + 7 * 24 * 60 * 60 * 1000);

  const usuario: UsuarioPublico = {
    id: 'usuario-de-teste',
    name: 'Administrador Auza (teste)',
    email: EMAIL,
    role: 'ADMIN',
    isActive: true,
    lastLoginAt: agora.toISOString(),
    createdAt: agora.toISOString(),
  };

  return {
    user: usuario,
    tokens: {
      tokenType: 'Bearer',
      accessToken: TOKEN_DE_TESTE,
      expiresIn: '15m',
      refreshToken: TOKEN_DE_TESTE,
      refreshTokenExpiresAt: seteDias.toISOString(),
    },
  };
}
