import { Injectable } from '@angular/core';
import type { Tokens } from './auth.models';

const CHAVE = 'auza.sessao';

/** O que persiste entre recarregamentos. */
interface SessaoGuardada {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly refreshTokenExpiresAt: string;
}

/**
 * Guarda os tokens da sessão.
 *
 * `localStorage` porque o backend devolve os tokens no CORPO da resposta, não em
 * cookie (ver createSession no auth.service.ts do auza-back): sem cookie
 * httpOnly, não há como o navegador reenviar a sessão sozinho, e qualquer
 * armazenamento acessível a JS fica exposto a XSS.
 *
 * A troca certa, se isso virar requisito de segurança, é no backend: emitir o
 * refresh token como cookie httpOnly + SameSite e deixar o access token só em
 * memória. Enquanto ele responde no corpo, é aqui que o dado tem que ficar — e
 * fica num único lugar, para essa migração mexer em um arquivo.
 */
@Injectable({ providedIn: 'root' })
export class TokenStorage {
  private memoria: SessaoGuardada | null = null;

  ler(): SessaoGuardada | null {
    if (this.memoria) {
      return this.memoria;
    }
    const cru = this.storage()?.getItem(CHAVE);
    if (!cru) {
      return null;
    }
    try {
      const dados = JSON.parse(cru) as Partial<SessaoGuardada>;
      if (!dados.accessToken || !dados.refreshToken) {
        return null;
      }
      this.memoria = dados as SessaoGuardada;
      return this.memoria;
    } catch {
      // Conteúdo corrompido não deve derrubar a aplicação: trata como deslogado.
      this.limpar();
      return null;
    }
  }

  gravar(tokens: Tokens): void {
    this.memoria = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
    };
    this.storage()?.setItem(CHAVE, JSON.stringify(this.memoria));
  }

  limpar(): void {
    this.memoria = null;
    this.storage()?.removeItem(CHAVE);
  }

  get accessToken(): string | null {
    return this.ler()?.accessToken ?? null;
  }

  get refreshToken(): string | null {
    return this.ler()?.refreshToken ?? null;
  }

  /**
   * O refresh token venceu? Se venceu, não vale nem tentar renovar: o backend
   * responderia REFRESH_TOKEN_EXPIRED e o usuário levaria um redirecionamento
   * depois de uma requisição inútil.
   */
  get refreshExpirado(): boolean {
    const sessao = this.ler();
    if (!sessao) {
      return true;
    }
    const vencimento = Date.parse(sessao.refreshTokenExpiresAt);
    return Number.isFinite(vencimento) ? vencimento <= Date.now() : false;
  }

  /** `localStorage` pode não existir (SSR, modo restrito do navegador). */
  private storage(): Storage | null {
    try {
      return typeof localStorage === 'undefined' ? null : localStorage;
    } catch {
      return null;
    }
  }
}
