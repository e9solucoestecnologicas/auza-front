import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CATEGORIAS } from '../../home.data';
import { Icon } from '../../../../ui/icon/icon';

/**
 * Superfície comum às cinco seções: o marfim (#fff8ea) que a Têxtil já usava.
 * Antes elas alternavam ink / areia / marfim e o bloco ficava colorido demais.
 * Sem `on-dark`, as classes semânticas (`text-ink`, `border-soft`,
 * `btn-primary`, `media-ph`) resolvem sozinhas no tema claro.
 */
const SUPERFICIE = 'bg-white';

/**
 * Uma seção de destaque por categoria: área de imagem + texto ao lado.
 * As cinco correm como uma superfície contínua, sem régua entre elas; o que
 * quebra o ritmo da leitura é o lado da imagem, que alterna a cada seção.
 */
@Component({
  selector: 'app-destaques-section',
  imports: [Icon],
  templateUrl: './destaques-section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DestaquesSection {
  protected readonly categorias = CATEGORIAS;

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
