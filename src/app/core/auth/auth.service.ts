import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, firstValueFrom, from } from 'rxjs';
import { API_BASE_URL } from './api.config';
import type {
  Credenciais,
  DadosCadastro,
  Papel,
  RespostaAutenticacao,
  UsuarioPublico,
} from './auth.models';
import { TokenStorage } from './token-storage';

/** Sessão que não dá para renovar: sem refresh token, ou já vencido. */
export class SessaoExpirada extends Error {
  constructor() {
    super('Sessão expirada. Entre novamente.');
    this.name = 'SessaoExpirada';
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokens = inject(TokenStorage);
  private readonly router = inject(Router);
  private readonly base = inject(API_BASE_URL);

  private readonly _usuario = signal<UsuarioPublico | null>(null);

  /** Usuário autenticado, ou null. */
  readonly usuario = this._usuario.asReadonly();
  readonly autenticado = computed(() => this._usuario() !== null);
  readonly papel = computed<Papel | null>(() => this._usuario()?.role ?? null);

  /**
   * Renovação em curso. Existe por causa de uma regra do backend: `/auth/refresh`
   * faz ROTAÇÃO com detecção de reuso — usar o mesmo refresh token duas vezes é
   * lido como token vazado e REVOGA TODAS AS SESSÕES do usuário
   * (auth.service.ts:94-100 no auza-back).
   *
   * Sem isso, duas requisições que tomassem 401 ao mesmo tempo chamariam refresh
   * em paralelo: a primeira rotacionaria, a segunda mandaria o token já gasto, e
   * o usuário seria deslogado de tudo. Todas as chamadas simultâneas esperam a
   * MESMA promessa.
   *
   * É promessa, e não Observable compartilhado, de propósito: promessa não
   * cancela. Com `shareReplay` refCount, se todos os inscritos desistissem no
   * meio a requisição seria abortada — e o backend pode já ter rotacionado o
   * token, o que deixaria o cliente com um refresh token morto e a próxima
   * tentativa cairia justamente no REFRESH_TOKEN_REUSED.
   */
  private renovacao: Promise<string> | null = null;

  entrar(credenciais: Credenciais): Promise<UsuarioPublico> {
    return firstValueFrom(
      this.http.post<RespostaAutenticacao>(`${this.base}/auth/login`, credenciais),
    ).then((resposta) => this.aplicarSessao(resposta));
  }

  /** Cria a conta. O backend NÃO autentica no cadastro: devolve só o usuário. */
  cadastrar(dados: DadosCadastro): Promise<UsuarioPublico> {
    return firstValueFrom(this.http.post<UsuarioPublico>(`${this.base}/auth/register`, dados));
  }

  /**
   * Encerra a sessão. O backend revoga o refresh token; se a chamada falhar
   * (offline, token já revogado), o estado local é limpo do mesmo jeito — do
   * ponto de vista do usuário, sair tem que sair.
   */
  async sair(): Promise<void> {
    const refreshToken = this.tokens.refreshToken;
    if (refreshToken) {
      try {
        await firstValueFrom(
          this.http.post<{ message: string }>(`${this.base}/auth/logout`, { refreshToken }),
        );
      } catch {
        // Ignorado de propósito: logout é idempotente no backend.
      }
    }
    this.limparSessao();
    await this.router.navigate(['/login']);
  }

  /** Revoga todas as sessões do usuário (todos os dispositivos). */
  async sairDeTodosOsDispositivos(): Promise<void> {
    try {
      await firstValueFrom(this.http.post<{ message: string }>(`${this.base}/auth/logout-all`, {}));
    } finally {
      this.limparSessao();
      await this.router.navigate(['/login']);
    }
  }

  /**
   * Recupera a sessão de um recarregamento de página: com token em disco, busca
   * o perfil. Se o access token já venceu, o interceptor renova no caminho.
   */
  async restaurarSessao(): Promise<boolean> {
    if (this._usuario()) {
      return true;
    }
    if (!this.tokens.accessToken) {
      return false;
    }
    try {
      const usuario = await firstValueFrom(this.http.get<UsuarioPublico>(`${this.base}/auth/me`));
      this._usuario.set(usuario);
      return true;
    } catch {
      this.limparSessao();
      return false;
    }
  }

  /**
   * Troca o refresh token por um par novo. Todas as chamadas concorrentes
   * recebem a mesma promessa — ver o comentário de `renovacao`.
   */
  renovar(): Observable<string> {
    this.renovacao ??= this.executarRenovacao();
    return from(this.renovacao);
  }

  private executarRenovacao(): Promise<string> {
    const refreshToken = this.tokens.refreshToken;

    // Sem token, ou vencido: nem vale gastar uma requisição.
    if (!refreshToken || this.tokens.refreshExpirado) {
      this.encerrarPorExpiracao();
      return Promise.reject(new SessaoExpirada());
    }

    const promessa = firstValueFrom(
      this.http.post<RespostaAutenticacao>(`${this.base}/auth/refresh`, { refreshToken }),
    )
      .then((resposta) => {
        this.aplicarSessao(resposta);
        return resposta.tokens.accessToken;
      })
      .catch((erro: unknown) => {
        this.encerrarPorExpiracao();
        throw erro;
      });

    // Libera o campo quando assentar, para o próximo 401 poder tentar de novo.
    promessa.finally(() => {
      this.renovacao = null;
    });
    return promessa;
  }

  private aplicarSessao(resposta: RespostaAutenticacao): UsuarioPublico {
    this.tokens.gravar(resposta.tokens);
    this._usuario.set(resposta.user);
    return resposta.user;
  }

  private limparSessao(): void {
    this.tokens.limpar();
    this._usuario.set(null);
  }

  /**
   * Sessão perdida sem ação do usuário: limpa e manda para o login guardando de
   * onde ele saiu, para voltar ao mesmo lugar depois de entrar.
   */
  private encerrarPorExpiracao(): void {
    const url = this.router.url;
    this.limparSessao();
    void this.router.navigate(['/login'], {
      queryParams: url && !url.startsWith('/login') ? { redirecionar: url } : {},
    });
  }
}
