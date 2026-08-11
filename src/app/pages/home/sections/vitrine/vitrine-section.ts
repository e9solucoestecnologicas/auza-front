import {
  afterNextRender,
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { CATEGORIAS, PRODUTOS, type Produto } from '../../home.data';
import { Icon } from '../../../../ui/icon/icon';

/**
 * Vitrine de produtos: card padrão do DS (Service Card), tags de filtro e um
 * trilho que anda sozinho. Aqui a lista pode crescer bastante, então tem setas
 * para esquerda/direita.
 *
 * O trilho é um scroller nativo — as setas e a deriva só empurram o scroll.
 * Assim a quantidade de cards visíveis se resolve por CSS, sem cálculo de
 * largura por breakpoint.
 *
 * O movimento é uma DERIVA CONTÍNUA, e não um passo de um card a cada N
 * segundos: o passo mostrava o trilho já parado na maior parte do tempo, e a
 * troca acontecia rápido demais para o olho ler os cards atravessando a tela.
 * Contínuo, o trilho está sempre em movimento — é o que faz os cards passarem
 * de um lado para o outro em vez de aparecerem em outra posição.
 *
 * A volta é sem costura: a lista é renderizada duas vezes e, ao completar uma
 * volta, o scroll recua exatamente o comprimento dela. Como as duas voltas são
 * idênticas, o recuo cai sobre pixels iguais e não aparece.
 *
 * TUDO passa por um único laço de `requestAnimationFrame`, o `tique`: a deriva e
 * a rolagem das setas. Dois motivos:
 *
 *  - só um dono escreve `scrollLeft`. Antes as setas usavam o
 *    `scrollBy({behavior: 'smooth'})` do browser, e a deriva escrevendo
 *    `scrollLeft` a cada quadro cancelava essa rolagem no meio do caminho;
 *  - o `behavior: 'smooth'` não é confiável: com `prefers-reduced-motion:
 *    reduce` o Chromium o IGNORA e rola em salto seco, mesmo em chamada
 *    programática. Era o que fazia a seta "piscar" em vez de animar.
 *
 * Decisão de produto: esta vitrine se move para todos, inclusive para quem pede
 * menos movimento no sistema. É o oposto da política do hero (que corta o
 * movimento e preserva o fade, via `--movimento: 0`) e foi pedido explícito —
 * animar por conta própria é o que torna isso possível, já que o browser não
 * anima rolagem nesse modo.
 */
@Component({
  selector: 'app-vitrine-section',
  imports: [Icon, RouterLink],
  templateUrl: './vitrine-section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VitrineSection {
  /**
   * Deriva, em px/s. Um card tem ~344px com o gap, então a 45px/s ele leva
   * ~7,6s para atravessar o próprio lugar: dá para ler o card enquanto ele
   * passa. Antes era um salto de 344px a cada 4s (~86px/s de média), só que
   * todo gasto em meio segundo de rolagem.
   */
  private static readonly VELOCIDADE_PX_S = 45;

  /**
   * Duração da rolagem de um card pela seta. 480ms com desaceleração é a ordem
   * de grandeza do scroll suave nativo: rápido o bastante para responder ao
   * clique, longo o bastante para o olho seguir os cards andando.
   */
  private static readonly ROLAGEM_MS = 480;

  protected readonly categorias = CATEGORIAS;
  protected readonly filtro = signal('todos');

  protected readonly produtos = computed<readonly Produto[]>(() => {
    const filtro = this.filtro();
    return filtro === 'todos' ? PRODUTOS : PRODUTOS.filter((p) => p.categoriaId === filtro);
  });

  /** Ligado por `medir()`: é o que decide se existe a segunda volta e a deriva. */
  private readonly emLoop = signal(false);

  /**
   * O que o trilho renderiza: a lista, ou a lista duas vezes quando está em
   * loop. Os cards da segunda volta são os mesmos objetos — quem lê a tela
   * recebe só a primeira, marcada no template por `aria-hidden`.
   */
  protected readonly cards = computed<readonly Produto[]>(() => {
    const produtos = this.produtos();
    return this.emLoop() ? [...produtos, ...produtos] : produtos;
  });

  private readonly trilho = viewChild.required<ElementRef<HTMLElement>>('trilho');

  /** Comprimento de uma volta em px: o quanto o trilho anda antes de recuar. 0 = sem loop. */
  private ciclo = 0;
  private quadro: number | undefined;
  private ultimoQuadro = 0;
  /** Nossa cópia do scrollLeft, com a fração que o inteiro do scroller perderia. */
  private posicao = 0;
  private ponteiro = false;
  private visivel = false;

  /** Rolagem de seta em curso. Enquanto existe, ela manda na posição no lugar da deriva. */
  private rolagem: { de: number; para: number; decorrido: number } | undefined;

  constructor() {
    const aoDestruir = inject(DestroyRef);

    // Remede a cada render que mexe na lista (é o filtro que mexe), com o DOM
    // já montado: o loop depende da largura real do card e do trilho.
    afterRenderEffect(() => {
      this.produtos();
      this.medir();
    });

    afterNextRender(() => {
      const el = this.trilho().nativeElement;

      const aoRedimensionar = () => this.medir();
      window.addEventListener('resize', aoRedimensionar, { passive: true });
      aoDestruir.onDestroy(() => window.removeEventListener('resize', aoRedimensionar));

      // Fora da tela a deriva não roda: escrever scrollLeft a cada quadro numa
      // seção que ninguém está vendo é trabalho jogado fora. De brinde, quem
      // chega rolando a página encontra o trilho no começo, e não no meio.
      // O `typeof` é pelo jsdom dos testes, que não tem IntersectionObserver.
      if (typeof IntersectionObserver === 'function') {
        const observador = new IntersectionObserver(
          (entradas) => {
            this.visivel = entradas.some((entrada) => entrada.isIntersecting);
            this.sincronizar();
          },
          { threshold: 0.05 },
        );
        observador.observe(el);
        aoDestruir.onDestroy(() => observador.disconnect());
      } else {
        this.visivel = true;
        this.sincronizar();
      }
    });

    aoDestruir.onDestroy(() => this.parar());
  }

  protected filtrar(id: string): void {
    this.filtro.set(id);
    // Volta ao começo em salto: a lista trocou, não há posição equivalente para
    // animar até. Uma rolagem de seta em curso perde o sentido junto com ela.
    this.rolagem = undefined;
    this.posicao = 0;
    this.trilho().nativeElement.scrollTo({ left: 0, behavior: 'auto' });
  }

  protected nomeCategoria(id: string): string {
    return this.categorias.find((c) => c.id === id)?.nome ?? '';
  }

  protected iconeCategoria(id: string): string {
    return this.categorias.find((c) => c.id === id)?.icone ?? 'box';
  }

  protected avancar(): void {
    this.deslocar(1);
  }

  protected voltar(): void {
    this.deslocar(-1);
  }

  /** Ponteiro ou foco no trilho: a deriva para, para o card poder ser lido. */
  protected pausar(): void {
    this.ponteiro = true;
    this.sincronizar();
  }

  protected retomar(): void {
    this.ponteiro = false;
    this.sincronizar();
  }

  /**
   * Decide se o trilho entra em loop e mede a volta.
   *
   * A volta precisa cobrir o trilho visível mais o gap, e esse limiar dá
   * exatamente três coisas de uma vez:
   *
   *  - é a mesma condição de a lista TRANSBORDAR o trilho (a largura real do
   *    conteúdo é a volta menos o gap final). Categoria que cabe inteira na
   *    tela não tem para onde derivar, e fica parada — é o caso de Caldeiras,
   *    Impressão 3D e Têxtil numa tela larga;
   *  - a janela visível fica mais estreita que uma volta, então as duas cópias
   *    do mesmo produto nunca aparecem juntas na tela;
   *  - garante `ciclo <= scrollWidth - clientWidth`, ou seja: reposicionar o
   *    scroll uma volta atrás (em `deslocar`) nunca é clampado pelo scroller —
   *    se fosse, a volta daria um tranco visível.
   *
   * Um card de sobra, que era o limiar anterior, é estrito demais: matava a
   * deriva de Agro e Comunicação Visual, que transbordam ~260px.
   */
  private medir(): void {
    const el = this.trilho().nativeElement;
    const card = el.firstElementChild as HTMLElement | null;
    const gap = this.gap(el);
    const volta = card ? (card.getBoundingClientRect().width + gap) * this.produtos().length : 0;
    const emLoop = volta >= el.clientWidth + gap;

    this.emLoop.set(emLoop);
    this.ciclo = emLoop ? volta : 0;
    this.sincronizar();
  }

  /**
   * Liga ou desliga o laço conforme o estado atual; idempotente.
   *
   * A rolagem de uma seta roda o laço mesmo com o ponteiro no trilho: ela é um
   * gesto explícito do usuário, e pausar no meio dele seria ignorar o clique.
   */
  private sincronizar(): void {
    const derivar = this.ciclo > 0 && this.visivel && !this.ponteiro;

    if (derivar || this.rolagem) {
      if (this.quadro === undefined) {
        this.ultimoQuadro = 0;
        this.quadro = requestAnimationFrame(this.tique);
      }
      return;
    }
    this.parar();
  }

  private parar(): void {
    if (this.quadro !== undefined) {
      cancelAnimationFrame(this.quadro);
      this.quadro = undefined;
    }
  }

  /**
   * Um quadro, de rolagem de seta ou de deriva — a seta tem precedência
   * enquanto durar.
   *
   * O avanço vem do tempo decorrido, não de um valor fixo por quadro: em 60Hz e
   * em 144Hz o trilho anda os mesmos px/s. O `dt` é limitado a 50ms para a volta
   * de uma aba em segundo plano — ou de um quadro perdido — não jogar o trilho
   * meia volta à frente de uma vez.
   *
   * `posicao` é LÓGICA: pode passar de uma volta ou ficar negativa, e só na hora
   * de escrever no scroller é trazida para dentro de [0, ciclo). É o que permite
   * a rolagem da seta atravessar a costura sem tratamento especial — o recuo de
   * uma volta cai sobre pixels idênticos, no meio da animação ou fora dela.
   * A alternativa, reposicionar o scroll antes de animar, precisaria de trilho
   * sobrando à frente, e nas categorias que transbordam pouco (Agro) o scroller
   * clampava o começo da animação: a seta ficava um instante parada.
   */
  private readonly tique = (agora: number): void => {
    const el = this.trilho().nativeElement;
    const dt = this.ultimoQuadro ? Math.min(agora - this.ultimoQuadro, 50) : 0;
    this.ultimoQuadro = agora;

    const rolagem = this.rolagem;
    if (rolagem) {
      rolagem.decorrido += dt;
      const t = Math.min(1, rolagem.decorrido / VitrineSection.ROLAGEM_MS);
      this.posicao = rolagem.de + (rolagem.para - rolagem.de) * VitrineSection.desacelerar(t);
      if (t >= 1) {
        this.rolagem = undefined;
      }
    } else {
      // A posição de verdade é a do scroller: se alguém mexeu nele por fora
      // (roda, arraste, teclado), a deriva segue de onde ele ficou em vez de
      // arrancá-lo de volta para onde nós achávamos que ele estava. A folga de
      // 1px é o arredondamento do próprio scroller.
      if (Math.abs(el.scrollLeft - this.posicao) > 1) {
        this.posicao = el.scrollLeft;
      }
      this.posicao += (VitrineSection.VELOCIDADE_PX_S * dt) / 1000;
    }

    if (this.ciclo > 0) {
      this.posicao = ((this.posicao % this.ciclo) + this.ciclo) % this.ciclo;
    }
    el.scrollLeft = this.posicao;

    if (this.rolagem || (this.ciclo > 0 && this.visivel && !this.ponteiro)) {
      this.quadro = requestAnimationFrame(this.tique);
    } else {
      this.quadro = undefined;
    }
  };

  /** Desaceleração cúbica: arranca rápido e assenta parado, como o scroll nativo. */
  private static desacelerar(t: number): number {
    return 1 - (1 - t) ** 3;
  }

  /**
   * Um card para o lado pedido, animado por nós.
   *
   * Cliques em sequência se ACUMULAM: o novo destino sai do destino anterior, e
   * a animação parte de onde o trilho está agora. Reiniciar do zero perderia
   * cards em quem clica rápido, e partir do destino anterior daria um salto.
   *
   * Como a rolagem assenta com velocidade zero, a deriva retoma dali sem
   * degrau — e por isso a seta não precisa de pausa depois.
   */
  private deslocar(direcao: 1 | -1): void {
    const el = this.trilho().nativeElement;
    const passo = this.passo(el) * direcao;
    const de = this.rolagem ? this.posicao : el.scrollLeft;

    this.rolagem = {
      de,
      para: (this.rolagem ? this.rolagem.para : de) + passo,
      decorrido: 0,
    };
    this.sincronizar();
  }

  /** Largura de um card + gap; cai para 320px se o trilho estiver vazio. */
  private passo(el: HTMLElement): number {
    const card = el.firstElementChild as HTMLElement | null;
    return card ? card.getBoundingClientRect().width + this.gap(el) : 320;
  }

  private gap(el: HTMLElement): number {
    return Number.parseFloat(getComputedStyle(el).columnGap) || 0;
  }
}
