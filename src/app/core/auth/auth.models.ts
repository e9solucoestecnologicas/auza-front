/**
 * Contrato de autenticação do auza-back, espelhado aqui.
 *
 * Os nomes dos campos ficam em inglês de propósito: são o que vem no JSON
 * (`src/modules/auth/auth.schemas.ts` no backend). Renomear aqui só criaria uma
 * camada de tradução para manter em sincronia à mão.
 */

export type Papel = 'ADMIN' | 'USER';

/** Usuário como a API devolve — nunca inclui hash de senha. */
export interface UsuarioPublico {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: Papel;
  readonly isActive: boolean;
  /** ISO 8601, ou null se nunca logou. */
  readonly lastLoginAt: string | null;
  readonly createdAt: string;
}

export interface Tokens {
  readonly tokenType: 'Bearer';
  /** JWT curto (15m por padrão), vai no header Authorization. */
  readonly accessToken: string;
  /** Validade declarada do access token, como texto: "15m". */
  readonly expiresIn: string;
  /** Token opaco, único jeito de renovar a sessão. */
  readonly refreshToken: string;
  /** ISO 8601. */
  readonly refreshTokenExpiresAt: string;
}

export interface RespostaAutenticacao {
  readonly user: UsuarioPublico;
  readonly tokens: Tokens;
}

export interface Credenciais {
  readonly email: string;
  readonly password: string;
}

export interface DadosCadastro extends Credenciais {
  readonly name: string;
}

/** Formato único de erro da API: `{ error: { code, message, details? } }`. */
export interface ErroApi {
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly details?: unknown;
  };
}

/** `details` de VALIDATION_ERROR vem como lista de campo + mensagem. */
export interface DetalheValidacao {
  readonly field: string;
  readonly message: string;
}

/**
 * Códigos que o front trata de forma diferente do "mostre a mensagem da API".
 * O resto é repassado ao usuário como veio, porque o backend já responde em
 * português.
 */
export const CODIGOS_SESSAO_PERDIDA = [
  'INVALID_REFRESH_TOKEN',
  'REFRESH_TOKEN_REUSED',
  'REFRESH_TOKEN_EXPIRED',
  'INVALID_SESSION',
] as const;

export function ehErroApi(valor: unknown): valor is ErroApi {
  return (
    typeof valor === 'object' &&
    valor !== null &&
    'error' in valor &&
    typeof (valor as ErroApi).error?.code === 'string'
  );
}

/** Lista de campos inválidos, quando o erro for VALIDATION_ERROR. */
export function detalhesValidacao(erro: unknown): readonly DetalheValidacao[] {
  if (!ehErroApi(erro) || !Array.isArray(erro.error.details)) {
    return [];
  }
  return erro.error.details.filter(
    (item): item is DetalheValidacao =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as DetalheValidacao).field === 'string' &&
      typeof (item as DetalheValidacao).message === 'string',
  );
}
