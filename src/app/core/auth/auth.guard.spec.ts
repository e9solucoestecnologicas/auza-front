import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  Router,
  provideRouter,
  type ActivatedRouteSnapshot,
  type RouterStateSnapshot,
  type UrlTree,
} from '@angular/router';
import { API_BASE_URL } from './api.config';
import { authGuard, papelGuard } from './auth.guard';
import { authInterceptor } from './auth.interceptor';
import type { RespostaAutenticacao } from './auth.models';
import { AuthService } from './auth.service';
import { TokenStorage } from './token-storage';

const BASE = 'http://api.teste/api/v1';

function usuario(role: 'ADMIN' | 'USER' = 'USER') {
  return {
    id: 'u1',
    name: 'Fulano',
    email: 'fulano@auza.local',
    role,
    isActive: true,
    lastLoginAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

function sessao(role: 'ADMIN' | 'USER' = 'USER'): RespostaAutenticacao {
  return {
    user: usuario(role),
    tokens: {
      tokenType: 'Bearer',
      accessToken: 'access-1',
      expiresIn: '15m',
      refreshToken: 'refresh-1',
      refreshTokenExpiresAt: new Date(Date.now() + 7 * 864e5).toISOString(),
    },
  };
}

const rota = {} as ActivatedRouteSnapshot;
const estado = (url: string): RouterStateSnapshot => ({ url }) as RouterStateSnapshot;

describe('authGuard', () => {
  let mock: HttpTestingController;
  let auth: AuthService;
  let tokens: TokenStorage;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE },
      ],
    });
    mock = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    tokens = TestBed.inject(TokenStorage);
    router = TestBed.inject(Router);
  });

  afterEach(() => mock.verify());

  const rodar = (guard = authGuard, url = '/painel') =>
    TestBed.runInInjectionContext(() => guard(rota, estado(url))) as Promise<boolean | UrlTree>;

  it('libera quem já está autenticado', async () => {
    const login = auth.entrar({ email: 'a@b.c', password: 'x' });
    mock.expectOne(`${BASE}/auth/login`).flush(sessao());
    await login;

    await expect(rodar()).resolves.toBe(true);
  });

  it('manda para o login guardando de onde a pessoa veio', async () => {
    const resultado = await rodar(authGuard, '/painel/pedidos');

    // Sem isso, entrar sempre jogaria a pessoa no painel raiz e ela perderia o
    // caminho que tentou abrir.
    expect(router.serializeUrl(resultado as UrlTree)).toBe(
      '/login?redirecionar=%2Fpainel%2Fpedidos',
    );
  });

  it('restaura a sessão quando só o token sobreviveu ao recarregamento', async () => {
    // É o caso do F5 numa rota protegida: usuário em memória vazio, token em disco.
    tokens.gravar(sessao().tokens);

    const resultado = rodar();
    mock.expectOne(`${BASE}/auth/me`).flush(usuario());

    await expect(resultado).resolves.toBe(true);
    expect(auth.autenticado()).toBe(true);
  });

  it('barra e limpa quando o token em disco não vale mais', async () => {
    tokens.gravar(sessao().tokens);

    const resultado = rodar();
    mock.expectOne(`${BASE}/auth/me`).flush(
      { error: { code: 'UNAUTHORIZED', message: 'Não autenticado.' } },
      {
        status: 401,
        statusText: 'Unauthorized',
      },
    );
    // O interceptor tenta renovar; a renovação também falha.
    await new Promise((r) => setTimeout(r, 0));
    mock
      .expectOne(`${BASE}/auth/refresh`)
      .flush(
        { error: { code: 'REFRESH_TOKEN_EXPIRED', message: 'Refresh token expirado.' } },
        { status: 401, statusText: 'Unauthorized' },
      );

    expect(router.serializeUrl((await resultado) as UrlTree)).toContain('/login');
    expect(tokens.accessToken).toBeNull();
  });

  it('papelGuard exige o papel, e desvia para o painel quem não tem', async () => {
    const login = auth.entrar({ email: 'a@b.c', password: 'x' });
    mock.expectOne(`${BASE}/auth/login`).flush(sessao('USER'));
    await login;

    await expect(rodar(papelGuard('USER', 'ADMIN'))).resolves.toBe(true);

    // Autenticado sem permissão volta para o painel, não para o login: mandar
    // para o login sugeriria que o problema é a sessão.
    const negado = await rodar(papelGuard('ADMIN'), '/admin');
    expect(router.serializeUrl(negado as UrlTree)).toBe('/painel');
  });
});
