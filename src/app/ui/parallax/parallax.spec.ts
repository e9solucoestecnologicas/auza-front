import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Parallax } from './parallax';

@Component({
  imports: [Parallax],
  template: `
    <div class="secao">
      <div class="fundo-fixo">
        <div class="fundo-fixo__trilho">
          <img appParallax />
        </div>
      </div>
    </div>
  `,
})
class Hospede {}

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

const JANELA = 800;
const ALTURA_SECAO = 1000;
/** Da entrada por baixo até a saída por cima. */
const PASSAGEM = JANELA + ALTURA_SECAO;

/** Leitura do que a diretiva aplicou na imagem. */
interface Estado {
  /** `translate3d` vertical, ou NaN quando a diretiva não mexeu na imagem. */
  desvio: number;
  /** `--fundo-folga`, o curso que o CSS reserva de cada lado. */
  folga: string;
}

/**
 * Monta a seção uma única vez e devolve um sonda: dado o `rect.top` da seção
 * (JANELA = encostando na base, 0 = alinhada ao topo, negativo = saindo por
 * cima), rola e lê o estado da imagem. Um fixture por posição faria cada varredura
 * levar segundos.
 */
async function montarSonda(): Promise<(topo: number) => Promise<Estado>> {
  const fixture = TestBed.createComponent(Hospede);
  const raiz = fixture.nativeElement as HTMLElement;
  const secao = raiz.querySelector('.secao') as HTMLElement;
  const img = raiz.querySelector('img') as HTMLImageElement;

  let topoAtual = JANELA;
  secao.getBoundingClientRect = () =>
    ({ top: topoAtual, bottom: topoAtual + ALTURA_SECAO, height: ALTURA_SECAO }) as DOMRect;

  fixture.detectChanges(); // dispara ngOnInit -> assina o scroll

  return async (topo: number) => {
    topoAtual = topo;
    window.dispatchEvent(new Event('scroll'));
    await new Promise<void>((r) => requestAnimationFrame(() => r()));

    const transform = img.style.transform;
    return {
      desvio: transform
        ? Number.parseFloat(/translate3d\(0, (-?[\d.]+)px/.exec(transform)![1])
        : Number.NaN,
      folga: img.style.getPropertyValue('--fundo-folga'),
    };
  };
}

describe('Parallax', () => {
  beforeEach(async () => {
    // jsdom define innerHeight como propriedade só de leitura.
    Object.defineProperty(window, 'innerHeight', { value: JANELA, configurable: true });
    comMovimentoReduzido(false);
    await TestBed.configureTestingModule({ imports: [Hospede] }).compileComponents();
  });

  it('sobe um terço de cada pixel rolado', async () => {
    const sonda = await montarSonda();
    // 300px de rolagem = 100px de imagem, para cima.
    const antes = (await sonda(0)).desvio;
    const depois = (await sonda(-300)).desvio;

    expect(depois - antes).toBeCloseTo(-100, 1);
  });

  it('mantém a mesma velocidade nas pontas da passagem', async () => {
    // A falha que isto guarda: com o desvio limitado, a imagem congelava na
    // entrada e na saída e só andava no meio.
    const sonda = await montarSonda();
    const naEntrada = (await sonda(JANELA - 310)).desvio - (await sonda(JANELA - 10)).desvio;
    const naSaida =
      (await sonda(10 - ALTURA_SECAO)).desvio - (await sonda(310 - ALTURA_SECAO)).desvio;

    expect(naEntrada).toBeCloseTo(-100, 1);
    expect(naSaida).toBeCloseTo(-100, 1);
  });

  it('fica neutra no meio e simétrica nas pontas', async () => {
    const sonda = await montarSonda();
    // Meio da passagem: percorrido = PASSAGEM / 2.
    const meio = (await sonda(JANELA - PASSAGEM / 2)).desvio;
    const entrando = (await sonda(JANELA - 1)).desvio;
    const saindo = (await sonda(1 - ALTURA_SECAO)).desvio;

    expect(meio).toBeCloseTo(0, 1);
    expect(entrando).toBeCloseTo(-saindo, 1);
  });

  it('publica a folga dimensionada pelo trecho apertado da passagem', async () => {
    const sonda = await montarSonda();
    // |altura - janela| / (2 * divisor), mais a margem de segurança.
    expect((await sonda(0)).folga).toBe(`${Math.ceil(Math.abs(ALTURA_SECAO - JANELA) / 6) + 16}px`);
  });

  it('nunca deixa a borda da imagem aparecer na seção', async () => {
    // Reproduz a geometria do CSS: o trilho fica preso no topo da janela, a
    // imagem sobe `folga` (margin-top) e mede `janela + 2 * folga`.
    const sonda = await montarSonda();
    const folga = Number.parseInt((await sonda(0)).folga, 10);
    const alturaImg = JANELA + 2 * folga;

    for (let percorrido = 1; percorrido < PASSAGEM; percorrido += 13) {
      const topoSecao = JANELA - percorrido;
      const topoImg = -folga + (await sonda(topoSecao)).desvio;
      const baseImg = topoImg + alturaImg;

      // Fatia da seção visível na janela: é o que precisa estar coberto.
      const fatiaTopo = Math.max(0, topoSecao);
      const fatiaBase = Math.min(JANELA, topoSecao + ALTURA_SECAO);
      if (fatiaBase <= fatiaTopo) {
        continue;
      }
      expect(topoImg, `topo descoberto em ${percorrido}px`).toBeLessThanOrEqual(fatiaTopo);
      expect(baseImg, `base descoberta em ${percorrido}px`).toBeGreaterThanOrEqual(fatiaBase);
    }
  });

  it('não mexe na imagem quando o usuário pede menos movimento', async () => {
    comMovimentoReduzido(true);
    const sonda = await montarSonda();

    expect((await sonda(0)).desvio).toBeNaN();
  });
});
