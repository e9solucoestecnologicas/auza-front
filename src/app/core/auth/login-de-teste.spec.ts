import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { API_BASE_URL } from './api.config';
import { AuthService } from './auth.service';
import { TokenStorage } from './token-storage';
import { TOKEN_DE_TESTE } from './login-de-teste';

const BASE = 'http://api.teste/api/v1';
const CREDENCIAIS = { email: 'admin@auza.local', password: 'Admin@123' };

/** PROVISÓRIO — estes testes saem junto com o login de teste. */
function montar() {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: API_BASE_URL, useValue: BASE },
    ],
  });
  return {
    auth: TestBed.inject(AuthService),
    http: TestBed.inject(HttpTestingController),
    tokens: TestBed.inject(TokenStorage),
  };
}

describe('login de teste (provisório)', () => {
  afterEach(() => {
    TestBed.inject(TokenStorage).limpar();
  });

  it('entra com o par fixo sem chamar o backend', async () => {
    const { auth, http, tokens } = montar();

    const usuario = await auth.entrar(CREDENCIAIS);

    // Nenhuma requisição: é o ponto do atalho.
    http.verify();
    expect(usuario.email).toBe('admin@auza.local');
    expect(usuario.role).toBe('ADMIN');
    expect(auth.autenticado()).toBe(true);
    expect(tokens.accessToken).toBe(TOKEN_DE_TESTE);
    // O vencimento tem de estar no futuro, senão o primeiro 401 desloga.
    expect(tokens.refreshExpirado).toBe(false);
  });

  it('aceita o e-mail em qualquer caixa, mas a senha exata', async () => {
    const { auth, http } = montar();
    await auth.entrar({ email: 'ADMIN@Auza.Local ', password: 'Admin@123' });
    http.verify();
    expect(auth.autenticado()).toBe(true);
  });

  it('senha errada cai no backend, como qualquer outro login', () => {
    const { auth, http } = montar();

    void auth.entrar({ email: 'admin@auza.local', password: 'outra' });

    const req = http.expectOne(`${BASE}/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush(
      { error: { code: 'INVALID_CREDENTIALS', message: 'E-mail ou senha inválidos.' } },
      { status: 401, statusText: 'Unauthorized' },
    );
  });

  it('sobrevive ao F5 sem chamar /auth/me', async () => {
    const { auth, http } = montar();
    await auth.entrar(CREDENCIAIS);
    http.verify();

    // Simula recarregar a página: serviço novo, tokens ainda no storage.
    const outro = montar();
    expect(await outro.auth.restaurarSessao()).toBe(true);
    expect(outro.auth.usuario()?.email).toBe('admin@auza.local');
    // `/auth/me` com token falso responderia 401 e limparia a sessão.
    outro.http.verify();
  });
});
