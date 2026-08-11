import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
  type TestRequest,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from './api.config';
import { authInterceptor } from './auth.interceptor';
import type { RespostaAutenticacao } from './auth.models';
import { TokenStorage } from './token-storage';

const BASE = 'http://api.teste/api/v1';

/** Router de mentira: o interceptor não navega, mas o AuthService navega ao perder a sessão. */
function routerFalso() {
  return {
    url: '/painel',
    navigate: (): Promise<boolean> => Promise.resolve(true),
    createUrlTree: () => ({}) as never,
  };
}

function sessao(accessToken: string, refreshToken = 'refresh-1'): RespostaAutenticacao {
  return {
    user: {
      id: 'u1',
      name: 'Admin',
      email: 'admin@auza.local',
      role: 'ADMIN',
      isActive: true,
      lastLoginAt: null,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    tokens: {
      tokenType: 'Bearer',
      accessToken,
      expiresIn: '15m',
      refreshToken,
      refreshTokenExpiresAt: new Date(Date.now() + 7 * 864e5).toISOString(),
    },
  };
}

/** Deixa as promessas internas (renovação) assentarem antes de olhar as requisições. */
const assentar = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

const naoAutorizado = { status: 401, statusText: 'Unauthorized' };
const corpo401 = { error: { code: 'UNAUTHORIZED', message: 'Não autenticado.' } };

describe('authInterceptor', () => {
  let http: HttpClient;
  let mock: HttpTestingController;
  let tokens: TokenStorage;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE },
        { provide: Router, useValue: routerFalso() },
      ],
    });
    http = TestBed.inject(HttpClient);
    mock = TestBed.inject(HttpTestingController);
    tokens = TestBed.inject(TokenStorage);
  });

  afterEach(() => mock.verify());

  it('anexa o Bearer nas requisições da nossa API', async () => {
    tokens.gravar(sessao('access-1').tokens);
    const pedido = firstValueFrom(http.get(`${BASE}/auth/me`));

    const req = mock.expectOne(`${BASE}/auth/me`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer access-1');
    req.flush({ id: 'u1' });
    await pedido;
  });

  it('não anexa o token em host de terceiro', async () => {
    tokens.gravar(sessao('access-1').tokens);
    const pedido = firstValueFrom(http.get('https://outro.servico/dados'));

    const req = mock.expectOne('https://outro.servico/dados');
    // Mandar a credencial da Auza para fora seria vazamento.
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
    await pedido;
  });

  it('não anexa o token nas rotas que emitem token', async () => {
    tokens.gravar(sessao('access-1').tokens);
    const pedido = firstValueFrom(http.post(`${BASE}/auth/login`, {}));

    const req = mock.expectOne(`${BASE}/auth/login`);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush(sessao('access-2'));
    await pedido;
  });

  it('renova e repete a requisição quando o access token vence', async () => {
    tokens.gravar(sessao('access-velho').tokens);
    const pedido = firstValueFrom(http.get(`${BASE}/pedidos`));

    mock.expectOne(`${BASE}/pedidos`).flush(corpo401, naoAutorizado);
    await assentar();

    const renovacao = mock.expectOne(`${BASE}/auth/refresh`);
    expect(renovacao.request.body).toEqual({ refreshToken: 'refresh-1' });
    renovacao.flush(sessao('access-novo', 'refresh-2'));
    await assentar();

    const repetida = mock.expectOne(`${BASE}/pedidos`);
    expect(repetida.request.headers.get('Authorization')).toBe('Bearer access-novo');
    repetida.flush({ ok: true });

    await expect(pedido).resolves.toEqual({ ok: true });
    // A rotação do backend invalidou o refresh antigo: o novo tem que estar guardado.
    expect(tokens.refreshToken).toBe('refresh-2');
  });

  it('renova UMA vez quando duas requisições tomam 401 juntas', async () => {
    // A falha que isto guarda é a pior do fluxo: o backend trata reuso de refresh
    // token como vazamento e revoga TODAS as sessões do usuário. Duas renovações
    // em paralelo deslogariam a pessoa de tudo.
    tokens.gravar(sessao('access-velho').tokens);
    const a = firstValueFrom(http.get(`${BASE}/pedidos`));
    const b = firstValueFrom(http.get(`${BASE}/clientes`));

    mock.expectOne(`${BASE}/pedidos`).flush(corpo401, naoAutorizado);
    mock.expectOne(`${BASE}/clientes`).flush(corpo401, naoAutorizado);
    await assentar();

    const renovacoes = mock.match(`${BASE}/auth/refresh`);
    expect(renovacoes.length, 'só pode existir uma renovação em curso').toBe(1);
    renovacoes[0].flush(sessao('access-novo', 'refresh-2'));
    await assentar();

    const repetidas: TestRequest[] = [
      mock.expectOne(`${BASE}/pedidos`),
      mock.expectOne(`${BASE}/clientes`),
    ];
    for (const req of repetidas) {
      expect(req.request.headers.get('Authorization')).toBe('Bearer access-novo');
      req.flush({ ok: true });
    }

    await expect(Promise.all([a, b])).resolves.toEqual([{ ok: true }, { ok: true }]);
  });

  it('não entra em laço quando a repetição também toma 401', async () => {
    tokens.gravar(sessao('access-velho').tokens);
    const pedido = firstValueFrom(http.get(`${BASE}/pedidos`));

    mock.expectOne(`${BASE}/pedidos`).flush(corpo401, naoAutorizado);
    await assentar();
    mock.expectOne(`${BASE}/auth/refresh`).flush(sessao('access-novo', 'refresh-2'));
    await assentar();
    // Segundo 401: sobe para quem chamou em vez de renovar de novo.
    mock.expectOne(`${BASE}/pedidos`).flush(corpo401, naoAutorizado);

    await expect(pedido).rejects.toMatchObject({ status: 401 });
    mock.expectNone(`${BASE}/auth/refresh`);
  });

  it('limpa a sessão quando a renovação falha', async () => {
    tokens.gravar(sessao('access-velho').tokens);
    const pedido = firstValueFrom(http.get(`${BASE}/pedidos`));

    mock.expectOne(`${BASE}/pedidos`).flush(corpo401, naoAutorizado);
    await assentar();
    mock
      .expectOne(`${BASE}/auth/refresh`)
      .flush(
        { error: { code: 'REFRESH_TOKEN_REUSED', message: 'Faça login novamente.' } },
        naoAutorizado,
      );

    await expect(pedido).rejects.toMatchObject({ status: 401 });
    expect(tokens.refreshToken).toBeNull();
  });

  it('não gasta requisição quando o refresh token já venceu', async () => {
    const vencida = sessao('access-velho');
    tokens.gravar({
      ...vencida.tokens,
      refreshTokenExpiresAt: new Date(Date.now() - 1000).toISOString(),
    });
    const pedido = firstValueFrom(http.get(`${BASE}/pedidos`));

    mock.expectOne(`${BASE}/pedidos`).flush(corpo401, naoAutorizado);
    await assentar();

    mock.expectNone(`${BASE}/auth/refresh`);
    await expect(pedido).rejects.toMatchObject({ status: 401 });
  });
});
