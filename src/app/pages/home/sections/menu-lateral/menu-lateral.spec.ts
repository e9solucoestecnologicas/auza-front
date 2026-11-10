import { TestBed } from '@angular/core/testing';
import { MenuLateral } from './menu-lateral';
import { CATEGORIAS } from '../../home.data';

describe('MenuLateral', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [MenuLateral] }).compileComponents();
  });

  it('abre o menu de produtos no hover e fecha ao sair', async () => {
    const fixture = TestBed.createComponent(MenuLateral);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;

    const botao = root.querySelector('button[aria-haspopup]')!;
    const grupo = botao.parentElement!;

    expect(botao.getAttribute('aria-expanded')).toBe('false');

    grupo.dispatchEvent(new MouseEvent('mouseenter'));
    await fixture.whenStable();
    expect(botao.getAttribute('aria-expanded')).toBe('true');

    grupo.dispatchEvent(new MouseEvent('mouseleave'));
    await fixture.whenStable();
    expect(botao.getAttribute('aria-expanded')).toBe('false');
  });

  it('mantém as opções fora da ordem de tabulação enquanto fechado', async () => {
    const fixture = TestBed.createComponent(MenuLateral);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;

    const opcoes = Array.from(
      root.querySelectorAll<HTMLAnchorElement>('button[aria-haspopup] ~ div a'),
    );
    expect(opcoes.length).toBe(CATEGORIAS.length + 1);
    expect(opcoes.every((a) => a.tabIndex === -1)).toBe(true);

    root
      .querySelector('button[aria-haspopup]')!
      .parentElement!.dispatchEvent(new MouseEvent('mouseenter'));
    await fixture.whenStable();
    expect(opcoes.every((a) => a.tabIndex === 0)).toBe(true);
  });
});
