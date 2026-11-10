import { ChangeDetectionStrategy, Component, computed, input, linkedSignal } from '@angular/core';
import type { Foto } from '../../home/home.data';
import { Icon } from '../../../ui/icon/icon';

/**
 * Galeria de fotos de um produto.
 *
 * Três estados, e cada um existe porque o catálogo está em fases diferentes:
 *
 *  - SEM foto (11 dos 15 produtos hoje): placeholder do DS (`media-ph`) com o
 *    ícone da categoria, igual ao das seções de destaque. O cartão não fica com
 *    um buraco nem com moldura vazia;
 *  - UMA foto: só a foto. Sem miniaturas, sem setas, sem contador — controles
 *    para navegar entre uma foto só são ruído;
 *  - DUAS OU MAIS: miniaturas, setas sobre a imagem e contador. Ligam sozinhos
 *    ao aparecer a segunda foto em `home.data.ts`.
 *
 * As fotos ficam TODAS no DOM, empilhadas com `ds-stack`, e a troca é de
 * opacidade: é o que faz a foto trocar por dissolução em vez de piscar. O custo
 * é que as fotos de um cartão visível baixam juntas, mesmo as ainda não vistas —
 * aceitável enquanto são poucas por produto, e é a razão do lembrete sobre gerar
 * versões reduzidas em `home.data.ts`.
 */
@Component({
  selector: 'app-galeria-produto',
  imports: [Icon],
  templateUrl: './galeria.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GaleriaProduto {
  readonly fotos = input.required<readonly Foto[]>();
  /** Ícone da categoria, para o placeholder de quem ainda não tem foto. */
  readonly icone = input.required<string>();
  /** Nome do produto: rotula o placeholder e os controles para leitor de tela. */
  readonly rotulo = input.required<string>();

  /**
   * Classe de tamanho da área de mídia. Padrão: proporção 4/3, como era antes.
   *
   * A /produtos passa ALTURA FIXA porque os cartões dela têm altura fixa: numa
   * coluna de ~530px a proporção 4/3 daria uma foto de ~400px, e o cartão
   * passaria de 700px só de mídia e botão.
   */
  readonly midia = input<string>('aspect-[4/3]');

  /**
   * `linkedSignal` e não `signal`: se a lista de fotos mudar, o índice guardado
   * pode passar a apontar para fora dela. Aqui ele é reprojetado sobre a lista
   * nova em vez de zerar — trocar a foto exibida por causa de uma edição de
   * dados é perda de contexto para quem está olhando o cartão.
   */
  protected readonly atual = linkedSignal<readonly Foto[], number>({
    source: this.fotos,
    computation: (fotos, anterior) => Math.min(anterior?.value ?? 0, Math.max(fotos.length - 1, 0)),
  });

  protected readonly temGaleria = computed(() => this.fotos().length > 1);

  protected ir(indice: number): void {
    this.atual.set(indice);
  }

  /** Circular nos dois sentidos: a última avança para a primeira. */
  protected avancar(passo: 1 | -1): void {
    const total = this.fotos().length;
    this.atual.update((i) => (i + passo + total) % total);
  }
}
