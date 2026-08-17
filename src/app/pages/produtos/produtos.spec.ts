import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { API_BASE_URL } from '../../core/auth/api.config';
import { Produtos } from './produtos';
import { GaleriaProduto } from './galeria/galeria';
import { CATEGORIAS, type Foto } from '../home/home.data';

const BASE = 'http://api.teste/api/v1';

function publico(nome: string, category: string, imageUrl: string | null = null) {
  return {
    id: nome.toLowerCase().replace(/ /g, '-'),
    name: nome,
    category,
    categoryLabel: category === 'AGRO' ? 'Agro' : category,
    // Longa de propósito: passa dos 120 caracteres que ligam o "Ver mais", que é
    // o caso comum (a API aceita de 10 a 5000).
    description:
      `Como o ${nome} se comporta em operação: painel com ajuste de temperatura, ` +
      'guias reguláveis para diferentes larguras, estrutura em inox e comandos ao ' +
      'alcance do operador sem interromper o ciclo.',
    imageUrl,
    link: `https://www.mercadolivre.com.br/${nome.toLowerCase().replace(/ /g, '-')}`,
    featured: false,
    createdAt: '2026-08-17T14:19:04.420Z',
  };
}

const CATALOGO = [
  publico('Escaldadeira Agro', 'AGRO', '/uploads/products/escaldadeira.webp'),
  publico('Depenadeira', 'AGRO'),
  publico('Cortador de EVA', 'COMUNICACAO_VISUAL'),
];

describe('Produtos', () => {
  beforeEach(async () => {
    // jsdom não implementa matchMedia; o trilho da vitrine (no rodapé reaproveitado
    // e nas seções importadas) consulta prefers-reduced-motion.
    window.matchMedia ??= ((query: string) =>
      ({
        matches: false,
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList) as typeof window.matchMedia;

    await TestBed.configureTestingModule({
      imports: [Produtos],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE },
      ],
    }).compileComponents();
  });

  /** Monta a página e responde ao catálogo público. */
  async function montar(catalogo: unknown[] = CATALOGO): Promise<ComponentFixture<Produtos>> {
    const fixture = TestBed.createComponent(Produtos);
    fixture.detectChanges();
    TestBed.inject(HttpTestingController)
      .expectOne((r) => r.url === `${BASE}/public/products`)
      .flush({
        data: catalogo,
        meta: { page: 1, perPage: 100, total: catalogo.length, totalPages: 1 },
      });
    await fixture.whenStable();
    return fixture;
  }

  it('lista o catálogo da API com nome, rótulo e descritivo de operação', async () => {
    const fixture = await montar();
    const root = fixture.nativeElement as HTMLElement;

    const cartoes = root.querySelectorAll('main article');
    expect(cartoes.length).toBe(CATALOGO.length);
    expect(root.textContent).toContain(`${CATALOGO.length} produtos`);

    // O "Como funciona" é o motivo da página existir: tem de estar em TODO cartão.
    const comoFunciona = Array.from(cartoes).filter((c) =>
      c.textContent?.includes('Como funciona'),
    );
    expect(comoFunciona.length).toBe(CATALOGO.length);

    const primeiro = cartoes[0];
    expect(primeiro.querySelector('h2')?.textContent?.trim()).toBe(CATALOGO[0].name);
    // O texto do bloco é o `description` da API — o contrato não tem um segundo
    // campo de texto para separar frase curta de descritivo.
    expect(primeiro.textContent).toContain(CATALOGO[0].description);
    // Rótulo pronto da API, não de-para local.
    expect(primeiro.textContent).toContain('Agro');
    // Compra aponta para o link de venda do produto.
    expect(primeiro.querySelector('a[target="_blank"]')?.getAttribute('href')).toBe(
      CATALOGO[0].link,
    );
  });

  it('filtra por segmento (pelo código da API) e anuncia a contagem', async () => {
    const fixture = await montar();
    const root = fixture.nativeElement as HTMLElement;

    const alvo = CATEGORIAS[0];
    const esperados = CATALOGO.filter((p) => p.category === alvo.codigo);
    expect(esperados.length).toBe(2);

    const botao = Array.from(root.querySelectorAll('main button')).find(
      (b) => b.textContent?.trim() === alvo.nome,
    ) as HTMLButtonElement;
    botao.click();
    await fixture.whenStable();

    expect(root.querySelectorAll('main article').length).toBe(esperados.length);
    expect(botao.getAttribute('aria-pressed')).toBe('true');
    expect(root.querySelector('[aria-live="polite"]')?.textContent).toContain(
      String(esperados.length),
    );
  });

  it('usa a foto da API em quem tem e o placeholder do DS em quem não tem', async () => {
    const fixture = await montar();
    const root = fixture.nativeElement as HTMLElement;

    // Caminho de upload é resolvido na RAIZ da API, fora do /api/v1.
    const foto = root.querySelector<HTMLImageElement>('main article img');
    expect(foto?.getAttribute('src')).toBe('http://api.teste/uploads/products/escaldadeira.webp');
    // Sem campo de alt no contrato, o nome do produto é o melhor que existe.
    expect(foto?.getAttribute('alt')).toBe(CATALOGO[0].name);

    // O placeholder cobre exatamente os dois sem imagem.
    expect(root.querySelectorAll('main .media-ph').length).toBe(2);
  });

  describe('cartão', () => {
    it('tem altura fixa e um único botão de ação no rodapé', async () => {
      const fixture = await montar();
      const cartao = (fixture.nativeElement as HTMLElement).querySelector('main article')!;

      // Altura fixa a partir de lg: é onde os cartões ficam lado a lado e a grade
      // precisa ser regular. Em coluna única não há degrau para corrigir.
      expect(cartao.className).toMatch(/\blg:h-\[48rem\]/);

      // Um botão de ação, e é o de compra. O "Ver mais" é um <button>, não um link.
      const acoes = cartao.querySelectorAll('a[href^="http"]');
      expect(acoes.length).toBe(1);
      expect(acoes[0].textContent?.trim()).toContain('COMPRE AGORA');
      expect(acoes[0].getAttribute('href')).toBe(CATALOGO[0].link);
      expect(acoes[0].getAttribute('target')).toBe('_blank');
      expect(acoes[0].getAttribute('rel')).toContain('noopener');
      expect(acoes[0].classList.contains('btn-primary')).toBe(true);
    });

    it('corta o descritivo e abre no "Ver mais", sem crescer o cartão', async () => {
      const fixture = await montar();
      const root = fixture.nativeElement as HTMLElement;
      const cartao = root.querySelector('main article')!;

      const texto = cartao.querySelector('p.whitespace-pre-line')!;
      const ver = Array.from(cartao.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('Ver mais'),
      )!;

      // Fechado: três linhas e corta.
      expect(texto.classList.contains('line-clamp-3')).toBe(true);
      expect(ver.getAttribute('aria-expanded')).toBe('false');

      ver.click();
      await fixture.whenStable();

      // Aberto: sem corte, e a área rola DENTRO do cartão — a altura fixa fica.
      expect(texto.classList.contains('line-clamp-3')).toBe(false);
      expect(texto.parentElement!.classList.contains('overflow-y-auto')).toBe(true);
      expect(ver.textContent?.trim()).toBe('Ver menos');
      expect(ver.getAttribute('aria-expanded')).toBe('true');
      expect(cartao.className).toMatch(/\blg:h-\[48rem\]/);

      // Abrir um cartão não abre os outros.
      const outro = root.querySelectorAll('main article')[1];
      expect(outro.querySelector('p.whitespace-pre-line')!.classList.contains('line-clamp-3')).toBe(
        true,
      );
    });

    it('não oferece "Ver mais" em descritivo curto', async () => {
      const curto = { ...publico('Bancada', 'AGRO'), description: 'Bancada simples.' };
      const fixture = await montar([curto]);
      const cartao = (fixture.nativeElement as HTMLElement).querySelector('main article')!;

      expect(
        Array.from(cartao.querySelectorAll('button')).some((b) => b.textContent?.includes('Ver')),
      ).toBe(false);
    });

    it('conta o clique do COMPRE AGORA na rota de cliques', async () => {
      const fixture = await montar();
      const cartao = (fixture.nativeElement as HTMLElement).querySelector('main article')!;
      const http = TestBed.inject(HttpTestingController);

      // Clique sem navegar de verdade: o que importa é o POST sair.
      const compre = cartao.querySelector<HTMLAnchorElement>('a[href^="http"]')!;
      compre.addEventListener('click', (e) => e.preventDefault());
      compre.click();

      const req = http.expectOne(`${BASE}/public/products/${CATALOGO[0].id}/click`);
      expect(req.request.method).toBe('POST');
      // A resposta traz a contagem nova; a página não depende dela para navegar.
      req.flush({ id: CATALOGO[0].id, clickCount: 42, link: CATALOGO[0].link });
    });
  });

  it('mostra esqueleto enquanto o catálogo não chega', async () => {
    // O Render leva ~22s para acordar no plano free: sem sinal, a página parece
    // quebrada em vez de lenta.
    const fixture = TestBed.createComponent(Produtos);
    fixture.detectChanges();
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;

    // Esqueleto no ar, e nenhum cartão de produto ainda.
    expect(root.querySelectorAll('main .ds-esqueleto').length).toBeGreaterThan(0);
    expect(root.textContent).not.toContain('COMPRE AGORA');
    // Nem a mensagem de vazio: catálogo chegando não é catálogo vazio.
    expect(root.textContent).not.toContain('Nenhum produto publicado');
    // A contagem do cabeçalho não mostra zero enquanto não sabe.
    expect(root.textContent).not.toContain('0 produtos');

    // Chegou: esqueleto sai, cartões entram.
    TestBed.inject(HttpTestingController)
      .expectOne((r) => r.url === `${BASE}/public/products`)
      .flush({
        data: CATALOGO,
        meta: { page: 1, perPage: 100, total: CATALOGO.length, totalPages: 1 },
      });
    await fixture.whenStable();

    expect(root.querySelectorAll('main .ds-esqueleto').length).toBe(0);
    expect(root.querySelectorAll('main article').length).toBe(CATALOGO.length);
  });

  it('distingue catálogo vazio de filtro sem resultado', async () => {
    const fixture = await montar([]);
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelectorAll('main article').length).toBe(0);
    expect(root.textContent).toContain('Nenhum produto publicado no catálogo');
  });
});

/**
 * A galeria de VÁRIAS fotos é testada no componente, e não pela página: hoje
 * nenhum produto tem duas fotos (as de `public/img/pecas` são recortes das
 * mesmas), então este é o único lugar onde o caminho de duas ou mais fotos roda.
 * Quando entrar a segunda foto de algum produto, ela já cai num caminho coberto.
 */
describe('GaleriaProduto', () => {
  const FOTOS: readonly Foto[] = [
    { src: '/img/caldeira.jpg', alt: 'Caldeira em inox sobre estrutura de pés.' },
    { src: '/img/estufa.jpg', alt: 'Detalhe do painel de comandos.' },
    { src: '/img/cortador-cinta.jpg', alt: 'Mesa vista de cima.' },
  ];

  async function montar(fotos: readonly Foto[]) {
    await TestBed.configureTestingModule({ imports: [GaleriaProduto] }).compileComponents();
    const fixture = TestBed.createComponent(GaleriaProduto);
    fixture.componentRef.setInput('fotos', fotos);
    fixture.componentRef.setInput('icone', 'flame');
    fixture.componentRef.setInput('rotulo', 'Caldeira Inox');
    await fixture.whenStable();
    return { fixture, root: fixture.nativeElement as HTMLElement };
  }

  it('sem foto: placeholder, sem miniaturas nem setas', async () => {
    const { root } = await montar([]);

    expect(root.querySelector('.media-ph')).toBeTruthy();
    expect(root.querySelectorAll('button').length).toBe(0);
    expect(root.querySelectorAll('img').length).toBe(0);
  });

  it('uma foto: só a foto — controlar uma foto só é ruído', async () => {
    const { root } = await montar([FOTOS[0]]);

    expect(root.querySelectorAll('img').length).toBe(1);
    expect(root.querySelector('img')?.getAttribute('alt')).toBe(FOTOS[0].alt);
    expect(root.querySelectorAll('button').length).toBe(0);
    expect(root.querySelector('.media-ph')).toBeFalsy();
  });

  it('várias fotos: miniaturas, setas e contador, com uma visível por vez', async () => {
    const { fixture, root } = await montar(FOTOS);

    const miniaturas = Array.from(root.querySelectorAll<HTMLButtonElement>('.galeria-miniatura'));
    expect(miniaturas.length).toBe(3);

    // Uma foto grande por foto declarada, e só a atual sem `opacity-0`.
    const grandes = Array.from(root.querySelectorAll<HTMLImageElement>('.ds-stack img'));
    expect(grandes.length).toBe(3);
    const visiveis = () => grandes.filter((img) => !img.classList.contains('opacity-0'));
    expect(visiveis().length).toBe(1);
    expect(visiveis()[0].getAttribute('src')).toBe(FOTOS[0].src);
    expect(root.textContent).toContain('1/3');

    // Clique na miniatura troca a foto exibida e move o `aria-current`.
    miniaturas[2].click();
    await fixture.whenStable();
    expect(visiveis()[0].getAttribute('src')).toBe(FOTOS[2].src);
    expect(miniaturas[2].getAttribute('aria-current')).toBe('true');
    expect(miniaturas[0].getAttribute('aria-current')).toBe('false');
    expect(root.textContent).toContain('3/3');

    // A seta seguinte, na última foto, volta para a primeira.
    const proxima = Array.from(root.querySelectorAll<HTMLButtonElement>('button')).find((b) =>
      b.getAttribute('aria-label')?.startsWith('Próxima foto'),
    )!;
    proxima.click();
    await fixture.whenStable();
    expect(visiveis()[0].getAttribute('src')).toBe(FOTOS[0].src);
  });

  it('mantém a foto exibida quando a lista muda, sem estourar o índice', async () => {
    const { fixture, root } = await montar(FOTOS);
    const miniaturas = root.querySelectorAll<HTMLButtonElement>('.galeria-miniatura');

    miniaturas[2].click();
    await fixture.whenStable();

    // Lista encurta para duas: o índice 2 não existe mais e é preso na última.
    fixture.componentRef.setInput('fotos', FOTOS.slice(0, 2));
    await fixture.whenStable();

    const grandes = Array.from(root.querySelectorAll<HTMLImageElement>('.ds-stack img'));
    expect(grandes.length).toBe(2);
    const visiveis = grandes.filter((img) => !img.classList.contains('opacity-0'));
    expect(visiveis.length).toBe(1);
    expect(visiveis[0].getAttribute('src')).toBe(FOTOS[1].src);
  });
});
