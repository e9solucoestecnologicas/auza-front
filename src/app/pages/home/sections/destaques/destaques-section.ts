import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CATEGORIAS } from '../../home.data';
import { Icon } from '../../../../ui/icon/icon';
import { VitrineStore } from '../../../../core/produtos/vitrine.store';
import type { CategoriaProduto, ProdutoPublico } from '../../../../core/produtos/produto.models';

/**
 * Superfície comum às cinco seções: o marfim (#fff8ea) que a Têxtil já usava.
 * Antes elas alternavam ink / areia / marfim e o bloco ficava colorido demais.
 * Sem `on-dark`, as classes semânticas (`text-ink`, `border-soft`,
 * `btn-primary`, `media-ph`) resolvem sozinhas no tema claro.
 */
const SUPERFICIE = 'bg-white';

/** Tempo de cada produto em cena, quando a seção tem mais de um. */
const INTERVALO_MS = 4500;

/**
 * Uma seção de destaque por categoria: área de imagem + texto ao lado.
 * As cinco correm como uma superfície contínua, sem régua entre elas; o que
 * quebra o ritmo da leitura é o lado da imagem, que alterna a cada seção.
 *
 * O que cada seção mostra vem da API (`/public/products`), pela regra do
 * `VitrineStore.daCategoria`: os produtos em DESTAQUE da categoria, ou todos os
 * dela quando nenhum está destacado.
 *
 * Com mais de um produto, eles se revezam em crossfade — é o que deixa a linha
 * inteira ser vista sem o visitante precisar clicar. Um índice só governa as
 * cinco seções: cada uma tem sua própria lista, e o resto do índice pela lista
 * dela mantém o revezamento em passo, sem cinco timers desalinhados.
 *
 * Sem produto (API caindo, cold start do Render ou categoria vazia), a seção cai
 * para o placeholder e a lista estática de `home.data.ts` — que é exatamente o
 * que ela mostrava antes de existir API. Ninguém vê seção quebrada.
 */
@Component({
  selector: 'app-destaques-section',
  imports: [Icon],
  templateUrl: './destaques-section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DestaquesSection {
  protected readonly categorias = CATEGORIAS;
  private readonly store = inject(VitrineStore);

  /** Passo do revezamento. Cresce sem parar; cada seção tira o resto pelo seu total. */
  private readonly passo = signal(0);
  private timer: ReturnType<typeof setInterval> | undefined;
  private pausado = false;

  constructor() {
    this.store.carregar();

    this.timer = setInterval(() => {
      if (!this.pausado) {
        this.passo.update((n) => n + 1);
      }
    }, INTERVALO_MS);

    inject(DestroyRef).onDestroy(() => clearInterval(this.timer));
  }

  /** Ponteiro sobre a mídia: o revezamento para, para o produto poder ser lido. */
  protected pausar(): void {
    this.pausado = true;
  }

  protected retomar(): void {
    this.pausado = false;
  }

  protected produtos(codigo: CategoriaProduto): readonly ProdutoPublico[] {
    return this.store.daCategoria(codigo);
  }

  /** Índice em cena nesta categoria. */
  protected atual(codigo: CategoriaProduto): number {
    const total = this.produtos(codigo).length;
    return total === 0 ? 0 : this.passo() % total;
  }

  protected emCena(codigo: CategoriaProduto, indice: number): boolean {
    return this.atual(codigo) === indice;
  }

  protected imagem(produto: ProdutoPublico): string | null {
    return this.store.imagem(produto);
  }

  protected registrarClique(produto: ProdutoPublico): void {
    this.store.registrarClique(produto);
  }

  /**
   * Carregando é diferente de vazio: enquanto a chamada está no ar, a seção
   * mostra esqueleto. Cair na lista estática nesse momento faria o conteúdo
   * trocar debaixo do olho do visitante quando a API respondesse.
   */
  protected readonly carregando = this.store.carregando;

  /**
   * A régua horizontal sobrou só na abertura do bloco, para marcar a fronteira
   * com a Sobre — que é marfim também e, sem ela, encostaria sem costura.
   */
  protected classes(indice: number): string {
    return indice === 0 ? `${SUPERFICIE} border-t border-soft` : SUPERFICIE;
  }

  /** Inverte o lado da mídia a cada seção (no mobile a mídia vem sempre antes). */
  protected ordemMidia(indice: number): string {
    return indice % 2 === 1 ? 'lg:order-1' : 'lg:order-2';
  }

  protected ordemTexto(indice: number): string {
    return indice % 2 === 1 ? 'lg:order-2' : 'lg:order-1';
  }
}
