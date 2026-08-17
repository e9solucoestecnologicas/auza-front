import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { API_BASE_URL } from '../../core/auth/api.config';
import { AuthService } from '../../core/auth/auth.service';
import { Painel } from './painel';

const USUARIO = {
  id: 'u1',
  name: 'Administrador Auza',
  email: 'admin@auza.local',
  role: 'ADMIN' as const,
  isActive: true,
  lastLoginAt: '2026-08-17T19:12:00.000Z',
  createdAt: '2026-07-28T20:05:49.985Z',
};

/**
 * O que estes testes protegem é a HIERARQUIA da tela: o atalho para produtos é o
 * que se vem fazer aqui, e os dados de sessão são conferência ocasional. Já
 * estiveram invertidos — quatro cartões de sessão ocupando a metade de cima e um
 * botão sem contexto embaixo.
 */
describe('Painel (resumo)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Painel],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://api.teste/api/v1' },
      ],
    }).compileComponents();

    // A tela só desenha com usuário em sessão.
    const auth = TestBed.inject(AuthService) as unknown as {
      _usuario: { set: (u: unknown) => void };
    };
    auth._usuario.set(USUARIO);
  });

  it('destaca o atalho de produtos com destino e descrição', async () => {
    const fixture = TestBed.createComponent(Painel);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;

    const atalho = root.querySelector<HTMLAnchorElement>('a.painel-atalho')!;
    expect(atalho).toBeTruthy();
    expect(atalho.getAttribute('href')).toBe('/painel/produtos');

    // Título e descrição: o botão anterior só dizia "Gerenciar produtos" e não
    // contava o que existe do outro lado.
    expect(atalho.textContent).toContain('Produtos');
    expect(atalho.textContent).toContain('Cadastre, edite e remova');
    expect(atalho.textContent).toContain('Gerenciar produtos');

    // Superfície ink numa página clara: é o que o torna a primeira coisa vista.
    expect(atalho.classList.contains('bg-neutral-900')).toBe(true);
    expect(atalho.classList.contains('on-dark')).toBe(true);
  });

  it('mantém os dados da sessão, mas discretos', async () => {
    const fixture = TestBed.createComponent(Painel);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;

    // A informação continua toda — mudou o peso, não o conteúdo.
    const dados = root.querySelector('dl')!;
    const texto = dados.textContent?.replace(/\s+/g, ' ') ?? '';
    expect(texto).toContain('admin@auza.local');
    expect(texto).toContain('ADMIN');
    expect(texto).toContain('último acesso 17/08/2026');
    expect(texto).toContain('conta desde 07/2026');

    // Em texto pequeno e apagado, não em cartões: nenhum bloco de sessão com a
    // superfície de cartão do DS.
    expect(dados.className).toContain('text-xs');
    expect(dados.querySelectorAll('.rounded-xl').length).toBe(0);

    // Rótulos existem para leitor de tela, sem virar ruído na tela.
    expect(dados.querySelectorAll('dt.sr-only').length).toBe(4);
  });
});
