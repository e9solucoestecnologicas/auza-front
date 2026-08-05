import { TestBed } from '@angular/core/testing';
import { HeroSection } from './hero-section';
import { CATEGORIAS } from '../../home.data';

/** Deixa o matchMedia sob controle: jsdom não implementa. */
function comMovimentoReduzido(reduzido: boolean): void {
  window.matchMedia = ((query: string) =>
    ({
      matches: reduzido,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }) as unknown as MediaQueryList) as typeof window.matchMedia;
}

describe('HeroSection', () => {
  beforeEach(async () => {
    comMovimentoReduzido(false);
    vi.useFakeTimers();
    await TestBed.configureTestingModule({ imports: [HeroSection] }).compileComponents();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /** Índice da bolinha marcada como ativa. */
  function ativo(raiz: HTMLElement): number {
    return Array.from(raiz.querySelectorAll('.hero-dot')).findIndex((b) =>
      b.classList.contains('hero-dot--ativo'),
    );
  }

  it('troca de banner a cada 5s e para de vez no primeiro clique', () => {
    const fixture = TestBed.createComponent(HeroSection);
    fixture.detectChanges();
    const raiz = fixture.nativeElement as HTMLElement;
    const bolinhas = raiz.querySelectorAll<HTMLButtonElement>('.hero-dot');

    expect(bolinhas.length).toBe(CATEGORIAS.length);
    expect(ativo(raiz)).toBe(0);

    // Antes dos 5s ainda é o primeiro: é o que fixa o intervalo.
    vi.advanceTimersByTime(4900);
    fixture.detectChanges();
    expect(ativo(raiz)).toBe(0);

    vi.advanceTimersByTime(100);
    fixture.detectChanges();
    expect(ativo(raiz)).toBe(1);

    vi.advanceTimersByTime(5000);
    fixture.detectChanges();
    expect(ativo(raiz)).toBe(2);

    // Clique do usuário: dali em diante a rotação é dele.
    bolinhas[4].click();
    fixture.detectChanges();
    expect(ativo(raiz)).toBe(4);

    vi.advanceTimersByTime(30_000);
    fixture.detectChanges();
    expect(ativo(raiz), 'a rotação automática não pode voltar').toBe(4);
  });

  it('roda também para quem pede menos movimento', () => {
    // A preferência tira o movimento da troca (no CSS, via `--movimento`), não a
    // troca em si. Antes ela desligava o timer e o carrossel ficava parado.
    comMovimentoReduzido(true);
    const fixture = TestBed.createComponent(HeroSection);
    fixture.detectChanges();
    const raiz = fixture.nativeElement as HTMLElement;

    vi.advanceTimersByTime(5000);
    fixture.detectChanges();
    expect(ativo(raiz)).toBe(1);
  });

  it('mostra a peça da categoria ativa e só dela, com a classe do asset', () => {
    const fixture = TestBed.createComponent(HeroSection);
    fixture.detectChanges();
    const raiz = fixture.nativeElement as HTMLElement;
    // A peça é camada de fundo da seção (não item do banner), então segue a
    // categoria ativa: uma por vez, no máximo.
    const peca = () => raiz.querySelector('.hero-peca');
    const veu = () => raiz.querySelector('.hero-veu') as HTMLElement;

    CATEGORIAS.forEach((cat, i) => {
      if (i > 0) {
        vi.advanceTimersByTime(5000);
        fixture.detectChanges();
      }
      expect(!!peca(), cat.nome).toBe(!!cat.imagem);
      if (cat.imagem) {
        expect(peca()!.querySelector('img')?.getAttribute('src')).toBe(cat.imagem);
        // A classe do asset carrega a proporção e a máscara da varredura: sem a
        // regra correspondente em _ds-surfaces.scss a peça não tem altura útil.
        expect(peca()!.classList.contains(`hero-peca--${cat.id}`), cat.nome).toBe(true);
        expect(peca()!.querySelector('.hero-peca__varredura'), cat.nome).toBeTruthy();
      }

      // Peça e véu precisam apontar para o mesmo lado, senão o gradiente
      // escureceria justamente o lado do aço em vez do lado do texto.
      const espelhado = i % 2 === 1;
      expect(veu().classList.contains('hero-veu--espelhado'), cat.nome).toBe(espelhado);
      if (cat.imagem) {
        expect(peca()!.classList.contains('hero-peca--espelhada'), cat.nome).toBe(espelhado);

        // Dois tratamentos: recorte (silhueta) e foto emoldurada, para as fotos
        // em que o fundo não é separável. `--moldura` é o que decide, e sem ele
        // a foto entraria como se fosse recorte — com o fundo branco à mostra.
        expect(peca()!.classList.contains('hero-peca--moldura'), cat.nome).toBe(
          !!cat.fotoEmoldurada,
        );
      }
    });
  });

  it('dá imagem a todas as categorias, num dos dois tratamentos', () => {
    // Guarda a cobertura: se uma categoria perder a imagem, o banner dela fica
    // com metade da tela vazia, que é o estado que estávamos resolvendo.
    for (const cat of CATEGORIAS) {
      expect(cat.imagem, cat.nome).toBeTruthy();
    }
  });

  it('espelha o lado do texto e mantém título e resumo na mesma coluna', () => {
    const fixture = TestBed.createComponent(HeroSection);
    fixture.detectChanges();
    const raiz = fixture.nativeElement as HTMLElement;
    const slides = raiz.querySelectorAll('.hero-slide');

    CATEGORIAS.forEach((cat, i) => {
      const titulo = slides[i].querySelector('h1')!.parentElement as HTMLElement;
      const resumo = titulo.nextElementSibling as HTMLElement;
      const par = i % 2 === 0;

      // Título e resumo são itens de grade em linhas diferentes: o que garante
      // que eles caiam na MESMA coluna é o `col-start`, não a ordem.
      const coluna = par ? 'lg:col-start-1' : 'lg:col-start-6';
      expect(titulo.classList.contains(coluna), `titulo ${i}`).toBe(true);
      expect(resumo.classList.contains(coluna), `resumo ${i}`).toBe(true);
      expect(titulo.classList.contains('lg:row-start-1'), `titulo ${i}`).toBe(true);
      expect(resumo.classList.contains('lg:row-start-2'), `resumo ${i}`).toBe(true);

      // A coluna vem de [class] e não pode apagar a largura declarada estática.
      expect(titulo.classList.contains('lg:col-span-7'), `titulo ${i}`).toBe(true);
      expect(resumo.classList.contains('lg:col-span-7'), `resumo ${i}`).toBe(true);

      // Texto à direita se alinha à direita — inclusive as tags, que são um
      // flex e não obedecem ao text-align.
      const tags = titulo.querySelector('ul') as HTMLElement;
      expect(titulo.classList.contains('lg:text-right'), `titulo ${i}`).toBe(!par);
      expect(tags.classList.contains('lg:justify-end'), `tags ${i}`).toBe(!par);

      // E o alinhamento das tags não pode custar a animação de entrada delas.
      expect(tags.classList.contains('hero-surge'), `tags ${i}`).toBe(true);

      // O banner não hospeda mais a peça: ela é camada de fundo da seção, e é
      // isso que a deixa sangrar e cruzar o título.
      expect(slides[i].querySelector('.hero-peca'), cat.nome).toBeNull();
    });
  });
});
