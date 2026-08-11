import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Produtos } from './produtos';
import { GaleriaProduto } from './galeria/galeria';
import { CATEGORIAS, PRODUTOS, type Foto } from '../home/home.data';

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
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('lista todos os produtos com nome e descritivo de operação', async () => {
    const fixture = TestBed.createComponent(Produtos);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;

    const cartoes = root.querySelectorAll('main article');
    expect(cartoes.length).toBe(PRODUTOS.length);

    // O "Como funciona" é o motivo da página existir: tem de estar em TODO
    // cartão, não só nos que já receberam texto definitivo.
    const comoFunciona = Array.from(root.querySelectorAll('main article')).filter((cartao) =>
      cartao.textContent?.includes('Como funciona'),
    );
    expect(comoFunciona.length).toBe(PRODUTOS.length);

    const primeiro = cartoes[0];
    expect(primeiro.querySelector('h2')?.textContent?.trim()).toBe(PRODUTOS[0].nome);
    expect(primeiro.textContent).toContain(PRODUTOS[0].comportamento);
  });

  it('filtra por segmento e anuncia a contagem', async () => {
    const fixture = TestBed.createComponent(Produtos);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;

    const alvo = CATEGORIAS[0];
    const esperados = PRODUTOS.filter((p) => p.categoriaId === alvo.id);

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

  it('usa o placeholder do DS em quem não tem foto e a foto em quem tem', async () => {
    const fixture = TestBed.createComponent(Produtos);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;

    const comFoto = PRODUTOS.filter((p) => p.fotos?.length);
    expect(comFoto.length).toBeGreaterThan(0);

    // Toda foto declarada tem alt: galeria sem alt é galeria vazia no leitor de tela.
    for (const produto of comFoto) {
      for (const foto of produto.fotos!) {
        expect(foto.alt.length, `${produto.nome} — ${foto.src}`).toBeGreaterThan(20);
        expect(root.querySelector(`main img[src="${foto.src}"]`)).toBeTruthy();
      }
    }

    // O placeholder cobre exatamente o resto.
    expect(root.querySelectorAll('main .media-ph').length).toBe(PRODUTOS.length - comFoto.length);
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
