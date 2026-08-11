import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Login } from './login';

/**
 * O que estes testes protegem é o CONTRASTE, não a aparência: o card do
 * formulário é marfim e vive dentro de uma página `on-dark`, onde as classes
 * semânticas do DS resolvem para marfim. Um `on-light` esquecido, ou um
 * `text-white` que volte para dentro do card, produz marfim sobre marfim — texto
 * invisível numa tela de login, que é onde ninguém pode ficar sem enxergar.
 */
describe('Login', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('põe TODO o conteúdo do login dentro do card marfim', async () => {
    const fixture = TestBed.createComponent(Login);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;

    const card = root.querySelector('.on-light')!;
    expect(card).toBeTruthy();
    // Marfim vem do `surface` do tema claro, que o `.on-light` reabre.
    expect(card.classList.contains('surface')).toBe(true);

    // Marca, título e formulário: nada do login mora fora do card.
    for (const seletor of ['app-logo', 'h1', 'form']) {
      expect(card.querySelector(seletor), seletor).toBeTruthy();
      expect(root.querySelectorAll(seletor).length, seletor).toBe(1);
    }

    // A página segue escura: o card é uma ilha, não o novo fundo. A superfície
    // ink é descendente do `.ds-root` — ver o teste do fundo, logo abaixo.
    expect(root.querySelector('.ds-root .on-dark')).toBeTruthy();
  });

  it('mantém a superfície ink DENTRO do .ds-root, e não no mesmo elemento', async () => {
    const fixture = TestBed.createComponent(Login);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;

    // O remap da paleta é `.ds-root .bg-neutral-900`, seletor descendente: com as
    // duas classes no mesmo elemento ele não casa e o fundo vira o neutral-900
    // cru do Tailwind (#171717) em vez do #4a1d06 da marca. jsdom não aplica a
    // folha global, então o que se testa é a estrutura que a torna válida.
    const dsRoot = root.querySelector('.ds-root')!;
    const ink = root.querySelector('.bg-neutral-900')!;
    expect(ink).toBeTruthy();
    expect(dsRoot.classList.contains('bg-neutral-900')).toBe(false);
    expect(dsRoot.contains(ink)).toBe(true);
  });

  it('centraliza marca, rótulo e título, e deixa o formulário à esquerda', async () => {
    const fixture = TestBed.createComponent(Login);
    await fixture.whenStable();
    const card = (fixture.nativeElement as HTMLElement).querySelector('.on-light')!;

    const cabecalho = card.querySelector('.text-center')!;
    expect(cabecalho).toBeTruthy();
    expect(cabecalho.querySelector('app-logo')).toBeTruthy();
    expect(cabecalho.querySelector('h1')).toBeTruthy();
    // Rótulo e campo começam à esquerda: é a ordem de leitura de um formulário.
    expect(cabecalho.querySelector('form')).toBeFalsy();
  });

  it('usa a marca em marrom, a que se lê sobre o marfim', async () => {
    const fixture = TestBed.createComponent(Login);
    await fixture.whenStable();
    const card = (fixture.nativeElement as HTMLElement).querySelector('.on-light')!;

    // A variante `escuro` é a marca em marfim: no card ela desapareceria.
    const logo = card.querySelector<HTMLImageElement>('app-logo img')!;
    expect(logo.getAttribute('src')).toBe('/img/logo-fundo-claro.png');
  });

  it('não deixa nenhuma cor de texto claro na tela', async () => {
    const fixture = TestBed.createComponent(Login);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;

    // `text-white` é remapeada para o marfim da marca com !important: dentro do
    // card ela venceria o `.on-light` e sumiria no fundo. Com tudo dentro do
    // card, não sobrou lugar legítimo para ela nesta tela.
    expect(root.querySelectorAll('.text-white').length).toBe(0);
    expect(root.querySelector('.on-light h1')?.classList.contains('text-ink')).toBe(true);
  });

  it('usa as peças de formulário do tema claro, e não as da superfície ink', async () => {
    const fixture = TestBed.createComponent(Login);
    await fixture.whenStable();
    const card = (fixture.nativeElement as HTMLElement).querySelector('.on-light')!;

    expect(card.querySelectorAll('input.ds-input').length).toBe(2);
    expect(card.querySelectorAll('.login-campo').length).toBe(0);
    expect(card.querySelector('button[type="submit"]')?.classList.contains('btn-primary')).toBe(
      true,
    );
  });

  it('mostra o erro por campo com a cor de erro do DS', async () => {
    const fixture = TestBed.createComponent(Login);
    await fixture.whenStable();
    const componente = fixture.componentInstance as unknown as {
      errosDeCampo: { set: (v: Record<string, string>) => void };
    };

    componente.errosDeCampo.set({ email: 'E-mail não cadastrado.' });
    await fixture.whenStable();

    const card = (fixture.nativeElement as HTMLElement).querySelector('.on-light')!;
    const erro = card.querySelector('.ds-error-text')!;
    expect(erro.textContent).toContain('E-mail não cadastrado.');
    expect(card.querySelector('input.ds-input--error')).toBeTruthy();
  });
});
