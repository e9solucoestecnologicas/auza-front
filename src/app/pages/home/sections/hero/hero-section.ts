import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CATEGORIAS } from '../../home.data';
import { Icon } from '../../../../ui/icon/icon';
import { Logo } from '../../../../ui/logo/logo';

/**
 * Hero com 5 banners (um por categoria), trocando a cada 5s até o primeiro
 * clique nas bolinhas — dali em diante a navegação é só do usuário.
 * Navegação apenas por bolinhas, como definido: sem setas.
 *
 * A troca é um crossfade, e por cima dele o banner que entra escalona os
 * próprios textos: eles sobem saindo do desfoque, um depois do outro (classes
 * `hero-slide--ativo` / `hero-surge`, em src/styles/_ds-surfaces.scss).
 *
 * Os banners também espelham o layout a cada categoria (título de um lado,
 * resumo do outro), para a sequência não ficar repetitiva.
 */
@Component({
  selector: 'app-hero-section',
  imports: [Icon, Logo],
  templateUrl: './hero-section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeroSection implements OnInit {
  private static readonly INTERVALO_MS = 5000;

  protected readonly categorias = CATEGORIAS;
  protected readonly atual = signal(0);

  protected readonly categoriaAtual = computed(() => this.categorias[this.atual()]);
  protected readonly espelhadoAtual = computed(() => this.espelhado(this.atual()));

  /**
   * Modificadores da peça: o `--<id>` liga a proporção e a máscara da varredura
   * ao arquivo certo, e o `--espelhada` a joga para o outro lado quando o texto
   * troca de lado.
   */
  protected readonly modificadoresPeca = computed(() => {
    const cat = this.categoriaAtual();
    const lado = this.espelhadoAtual() ? ' hero-peca--espelhada' : '';
    const moldura = cat.fotoEmoldurada ? ' hero-peca--moldura' : '';
    return `hero-peca--${cat.id}${lado}${moldura}`;
  });

  private timer: ReturnType<typeof setInterval> | undefined;
  private pausado = false;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.parar());
  }

  /**
   * A rotação começa sempre, inclusive com `prefers-reduced-motion: reduce`.
   * Antes ela era desligada nesse caso, e o carrossel simplesmente não girava
   * para quem tem animações desativadas no sistema.
   *
   * O que a preferência desliga é o *movimento*, no CSS (`--movimento: 0` em
   * _ds-surfaces.scss): a troca continua acontecendo, só que como crossfade e
   * desfoque, sem nada deslizando. Parar o conteúdo continua na mão do usuário
   * — as bolinhas assumem o carrossel e o hover pausa.
   */
  ngOnInit(): void {
    this.iniciar();
  }

  /**
   * Clique nas bolinhas: o usuário assume o carrossel de vez. A rotação
   * automática não volta — reiniciá-la arrancaria dele o banner que ele
   * acabou de escolher.
   */
  protected ir(indice: number): void {
    this.atual.set(indice);
    this.parar();
  }

  /**
   * Espelha o banner a cada categoria: texto à esquerda no primeiro, à direita
   * no segundo, e assim por diante. Quando o texto vai para a direita, o bloco
   * inteiro se alinha por lá — título e tags encostam na borda direita da
   * coluna, senão ficariam soltos no meio do banner.
   *
   * A posição vem de `col-start` e não de `order`: título e resumo são dois
   * itens de grade em linhas diferentes que precisam cair na MESMA coluna, e
   * `order` só reordena a sequência de colocação automática — não garante
   * coluna. A peça não participa desta grade: é camada de fundo, posicionada em
   * `%` da seção para poder sangrar e cruzar o título.
   *
   * No mobile é uma coluna só e tudo fica à esquerda: coluna e alinhamento só
   * entram a partir de `lg`.
   */
  protected colunaTexto(indice: number): string {
    return this.espelhado(indice) ? 'lg:col-start-6 lg:text-right' : 'lg:col-start-1';
  }

  /** As tags são um flex, então não seguem o `text-align` da coluna. */
  protected alinhamentoTags(indice: number): string {
    return this.espelhado(indice) ? 'lg:justify-end' : '';
  }

  /** Protegido porque o template também precisa dele para o alinhamento do resumo. */
  protected espelhado(indice: number): boolean {
    return indice % 2 === 1;
  }

  protected pausar(): void {
    this.pausado = true;
  }

  protected retomar(): void {
    this.pausado = false;
  }

  private iniciar(): void {
    this.timer = setInterval(() => {
      if (!this.pausado) {
        this.atual.update((i) => (i + 1) % this.categorias.length);
      }
    }, HeroSection.INTERVALO_MS);
  }

  private parar(): void {
    clearInterval(this.timer);
    this.timer = undefined;
  }
}
