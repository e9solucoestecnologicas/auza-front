import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Home } from './home';
import { CATEGORIAS, PRODUTOS } from './home.data';

/** Smoke test: a landing monta e entrega todas as seções combinadas. */
describe('Home', () => {
  beforeEach(async () => {
    // jsdom não implementa matchMedia; os sliders consultam prefers-reduced-motion.
    window.matchMedia ??= ((query: string) =>
      ({
        matches: false,
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList) as typeof window.matchMedia;

    await TestBed.configureTestingModule({
      imports: [Home],
      // A vitrine leva ao catálogo por `routerLink`, e o RouterLink injeta Router.
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renderiza as seções na ordem definida', async () => {
    const fixture = TestBed.createComponent(Home);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;

    const ids = ['inicio', 'sobre', 'solucoes', 'produtos', 'contato'];
    for (const id of ids) {
      expect(root.querySelector(`#${id}`)).toBeTruthy();
    }
    expect(root.querySelector('footer')).toBeTruthy();
    // A camada de parallax da seção Sobre precisa da imagem e do véu.
    const sobre = root.querySelector('#sobre')!;
    expect(sobre.querySelector('img[src="/img/auza-fundo.jpg"]')).toBeTruthy();
    expect(sobre.querySelector('.sobre-veu')).toBeTruthy();
  });

  it('escalona a entrada dos textos só no banner ativo', async () => {
    const fixture = TestBed.createComponent(Home);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;

    // A animação é gatilhada pela classe do slide: um ativo por vez, senão os
    // cinco banners animariam empilhados.
    const ativos = root.querySelectorAll('#inicio .hero-slide--ativo');
    expect(ativos.length).toBe(1);

    // Eyebrow, título, tags, resumo e botão — em cascata, com o respiro depois
    // do título antes dos elementos menores entrarem.
    const surgem = Array.from(ativos[0].querySelectorAll('.hero-surge')) as HTMLElement[];
    expect(surgem.length).toBe(5);
    expect(surgem.map((el) => el.style.getPropertyValue('--surge-atraso'))).toEqual([
      '0.3s',
      '0.6s',
      '1.1s',
      '1.4s',
      '1.7s',
    ]);

    // Só o display foge do padrão: sobe mais alto e mais devagar.
    const titulo = surgem[1];
    expect(titulo.tagName).toBe('H1');
    expect(titulo.style.getPropertyValue('--surge-duracao')).toBe('1.6s');
    expect(titulo.style.getPropertyValue('--surge-subida')).toBe('4.5rem');
    for (const outro of [surgem[0], ...surgem.slice(2)]) {
      expect(outro.style.getPropertyValue('--surge-duracao')).toBe('');
      expect(outro.style.getPropertyValue('--surge-subida')).toBe('');
    }
  });

  it('usa a variante escura da logo nas superfícies ink', async () => {
    const fixture = TestBed.createComponent(Home);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;

    const src = (seletor: string): string | null =>
      root.querySelector(seletor)?.querySelector('img')?.getAttribute('src') ?? null;

    expect(src('#inicio app-logo')).toContain('logo-fundo-escuro');
    expect(src('footer app-logo')).toContain('logo-fundo-escuro');
  });

  it('navega pelo rail lateral, sem navbar fixa', async () => {
    const fixture = TestBed.createComponent(Home);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('.ds-nav')).toBeNull();

    const rail = root.querySelector('app-menu-lateral aside');
    expect(rail).toBeTruthy();

    // Um item por destino de primeiro nível: topo, sobre, produtos, contato.
    expect(rail!.querySelectorAll(':scope > div > a').length).toBe(3);
    expect(rail!.querySelector('button[aria-haspopup="true"]')).toBeTruthy();

    // Produtos agrupa as categorias + a vitrine num único ícone.
    const opcoes = Array.from(rail!.querySelectorAll('button[aria-haspopup] ~ div a')).map((a) =>
      a.getAttribute('href'),
    );
    expect(opcoes).toEqual([...CATEGORIAS.map((c) => `#solucao-${c.id}`), '#produtos']);
  });

  it('cria um banner e uma seção de destaque por categoria', async () => {
    const fixture = TestBed.createComponent(Home);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelectorAll('.hero-dot').length).toBe(CATEGORIAS.length);
    for (const cat of CATEGORIAS) {
      expect(root.querySelector(`#solucao-${cat.id}`)).toBeTruthy();
    }

    // O tema vem de [class] e não pode apagar as classes estáticas da seção.
    const primeira = root.querySelector(`#solucao-${CATEGORIAS[0].id}`) as HTMLElement;
    expect(primeira.classList.contains('px-6')).toBe(true);
    expect(primeira.classList.contains('bg-white')).toBe(true);

    // As cinco categorias dividem a mesma superfície (a da Têxtil, marfim) e
    // correm sem régua entre elas: a borda existe só na abertura do bloco.
    CATEGORIAS.forEach((cat, i) => {
      const secao = root.querySelector(`#solucao-${cat.id}`) as HTMLElement;
      expect(secao.classList.contains('bg-white'), cat.nome).toBe(true);
      expect(secao.classList.contains('border-t'), cat.nome).toBe(i === 0);
    });
  });

  it('lista todos os produtos na vitrine e reserva o escuro ao hero e ao rodapé', async () => {
    const fixture = TestBed.createComponent(Home);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;

    // `:not([aria-hidden])` descarta a segunda volta do trilho: quando a lista
    // transborda, ela é renderizada duas vezes para a deriva dar a volta sem
    // costura, e a cópia é marcada como decorativa.
    expect(root.querySelectorAll('.vitrine-trilho > article:not([aria-hidden])').length).toBe(
      PRODUTOS.length,
    );
    // Só o hero e o rodapé usam a superfície escura: as categorias saíram do
    // revezamento quando o bloco de Produtos foi unificado no marfim.
    expect(root.querySelectorAll('.on-dark').length).toBe(2);
  });
});
