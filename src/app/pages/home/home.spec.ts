import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { API_BASE_URL } from '../../core/auth/api.config';
import { Home } from './home';
import { CATEGORIAS } from './home.data';

const BASE = 'http://api.teste/api/v1';

/** Catálogo de mentira, no formato da rota pública. */
function publico(nome: string, category: string, featured: boolean) {
  return {
    id: nome.toLowerCase().replace(/ /g, '-'),
    name: nome,
    category,
    categoryLabel: category,
    description: 'Descrição do equipamento, longa o suficiente para o cartão.',
    imageUrl: null,
    link: 'https://www.mercadolivre.com.br/' + nome.toLowerCase().replace(/ /g, '-'),
    featured,
    createdAt: '2026-08-17T14:19:04.420Z',
  };
}

const CATALOGO = [
  publico('Escaldadeira Agro', 'AGRO', true),
  publico('Depenadeira', 'AGRO', false),
  publico('Cortador de EVA', 'COMUNICACAO_VISUAL', false),
  publico('Estufa de Filamento', 'IMPRESSAO_3D', true),
  publico('Misturador Inox', 'CALDEIRAS_MISTURADOR_INOX', true),
  publico('Caldeira Inox', 'CALDEIRAS_MISTURADOR_INOX', true),
];

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
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE },
      ],
    }).compileComponents();
  });

  /**
   * Monta a home e responde ao catálogo. As seções e a vitrine leem a MESMA
   * requisição — `expectOne` é o que prova que o store não pediu duas vezes.
   */
  async function montar(catalogo = CATALOGO) {
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http
      .expectOne((r) => r.url === `${BASE}/public/products`)
      .flush({
        data: catalogo,
        meta: { page: 1, perPage: 100, total: catalogo.length, totalPages: 1 },
      });
    await fixture.whenStable();
    return fixture;
  }

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

  it('traz os dados cadastrais e o crédito de desenvolvimento no rodapé', async () => {
    const fixture = TestBed.createComponent(Home);
    await fixture.whenStable();
    const rodape = (fixture.nativeElement as HTMLElement).querySelector('footer')!;
    const texto = rodape.textContent?.replace(/\s+/g, ' ') ?? '';

    // Dado cadastral: erra um dígito e o documento fica inválido, então vale
    // travar o número, não só a presença do rótulo.
    expect(texto).toContain('AUZA AUTOMAÇÃO INDUSTRIA E COMERCIO ltda.');
    expect(texto).toContain('CNPJ: 28.810.863/0001-43');
    expect(texto).toContain('IE: 118.608.650.118');
    // Nada de placeholder sobrando.
    expect(texto).not.toContain('Lorem');
    expect(texto).not.toContain('00.000.000');

    const dev = rodape.querySelector<HTMLAnchorElement>('a[href*="e9solucoes.com.br"]')!;
    expect(dev.textContent?.trim()).toBe('e9solucoes');
    expect(dev.getAttribute('href')).toBe('https://www.e9solucoes.com.br/');
    // Site de terceiro: abre fora e sem dar controle da aba à página de destino.
    expect(dev.getAttribute('target')).toBe('_blank');
    expect(dev.getAttribute('rel')).toContain('noopener');
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

  it('lista o catálogo da API na vitrine e reserva o escuro ao hero e ao rodapé', async () => {
    const fixture = await montar();
    const root = fixture.nativeElement as HTMLElement;

    // `:not([aria-hidden])` descarta a segunda volta do trilho: quando a lista
    // transborda, ela é renderizada duas vezes para a deriva dar a volta sem
    // costura, e a cópia é marcada como decorativa.
    const cards = root.querySelectorAll('.vitrine-trilho > article:not([aria-hidden])');
    expect(cards.length).toBe(CATALOGO.length);
    // Nome, rótulo pronto da API e link de venda vindos do produto.
    expect(cards[0].querySelector('h3')?.textContent?.trim()).toBe('Escaldadeira Agro');
    expect(cards[0].textContent).toContain('AGRO');
    expect(cards[0].querySelector('a[target="_blank"]')?.getAttribute('href')).toBe(
      CATALOGO[0].link,
    );

    // Só o hero e o rodapé usam a superfície escura: as categorias saíram do
    // revezamento quando o bloco de Produtos foi unificado no marfim.
    expect(root.querySelectorAll('.on-dark').length).toBe(2);
  });

  describe('produtos por seção', () => {
    /** Nomes que a seção da categoria está exibindo, na ordem. */
    function nomesDaSecao(root: HTMLElement, slug: string): string[] {
      const secao = root.querySelector(`#solucao-${slug}`)!;
      return Array.from(secao.querySelectorAll('ul li span')).map((s) => s.textContent!.trim());
    }

    it('mostra só os destacados quando a categoria tem destaque', async () => {
      const fixture = await montar();
      const root = fixture.nativeElement as HTMLElement;

      // Agro tem dois produtos, um destacado: a seção mostra só ele.
      expect(nomesDaSecao(root, 'agro')).toEqual(['Escaldadeira Agro']);
    });

    it('mostra todos quando nenhum produto da categoria está destacado', async () => {
      const fixture = await montar();
      const root = fixture.nativeElement as HTMLElement;

      // Comunicação Visual só tem um produto, e ele NÃO é destaque: aparece do
      // mesmo jeito, senão a seção ficaria vazia por falta de curadoria.
      expect(nomesDaSecao(root, 'comunicacao-visual')).toEqual(['Cortador de EVA']);
    });

    it('reveza os destacados quando há mais de um, um em cena por vez', async () => {
      const fixture = await montar();
      const root = fixture.nativeElement as HTMLElement;

      // Caldeiras tem dois destacados.
      const secao = root.querySelector('#solucao-caldeiras')!;
      expect(nomesDaSecao(root, 'caldeiras')).toEqual(['Misturador Inox', 'Caldeira Inox']);

      // A mídia empilha os dois no mesmo espaço, e só um está visível — é a
      // opacidade que troca, então a caixa não muda de altura na virada.
      const midia = secao.querySelectorAll('.ds-stack > a');
      expect(midia.length).toBe(2);
      const visiveis = Array.from(midia).filter((a) => !a.classList.contains('opacity-0'));
      expect(visiveis.length).toBe(1);
      // O que está fora de cena não recebe clique nem foco.
      const fora = Array.from(midia).filter((a) => a.classList.contains('opacity-0'))[0];
      expect(fora.classList.contains('pointer-events-none')).toBe(true);
      expect(fora.getAttribute('tabindex')).toBe('-1');

      // Bolinhas só onde há revezamento.
      expect(secao.querySelectorAll('.destaque-dot').length).toBe(2);
      expect(
        root.querySelector('#solucao-comunicacao-visual')!.querySelectorAll('.destaque-dot').length,
      ).toBe(0);
    });

    it('mostra esqueleto enquanto o catálogo não chega, na vitrine e nas seções', async () => {
      const fixture = TestBed.createComponent(Home);
      fixture.detectChanges();
      await fixture.whenStable();
      const root = fixture.nativeElement as HTMLElement;

      // Vitrine e seções avisam que está carregando, cada uma na sua forma.
      expect(root.querySelectorAll('.vitrine-trilho .ds-esqueleto').length).toBeGreaterThan(0);
      expect(root.querySelectorAll('#solucao-agro .ds-esqueleto').length).toBeGreaterThan(0);
      // Carregando NÃO é o mesmo que falhar: a lista estática não entra agora,
      // senão o conteúdo trocaria debaixo do olho do visitante ao responder.
      expect(root.querySelector('#solucao-agro')!.textContent).not.toContain(
        CATEGORIAS[0].produtos[0],
      );

      TestBed.inject(HttpTestingController)
        .expectOne((r) => r.url === `${BASE}/public/products`)
        .flush({
          data: CATALOGO,
          meta: { page: 1, perPage: 100, total: CATALOGO.length, totalPages: 1 },
        });
      await fixture.whenStable();

      expect(root.querySelectorAll('.ds-esqueleto').length).toBe(0);
    });

    it('cai no conteúdo estático quando o catálogo não responde', async () => {
      const fixture = TestBed.createComponent(Home);
      fixture.detectChanges();
      TestBed.inject(HttpTestingController)
        .expectOne((r) => r.url === `${BASE}/public/products`)
        .error(new ProgressEvent('erro de rede'));
      await fixture.whenStable();
      const root = fixture.nativeElement as HTMLElement;

      // A seção não fica vazia: volta a mostrar a lista de home.data.ts e o
      // placeholder, que é o que a landing exibia antes de existir API.
      expect(nomesDaSecao(root, 'agro')).toEqual([...CATEGORIAS[0].produtos]);
      expect(root.querySelector('#solucao-agro .media-ph')).toBeTruthy();
    });
  });
});
