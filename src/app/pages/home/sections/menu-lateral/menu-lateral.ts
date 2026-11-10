import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { CATEGORIAS } from '../../home.data';
import { Icon } from '../../../../ui/icon/icon';

interface ItemMenu {
  readonly rotulo: string;
  readonly icone: string;
  /** Ausente no item que abre o submenu de produtos. */
  readonly href?: string;
}

/**
 * Navegação persistente da landing. Um componente, duas formas:
 *
 * - ≥ 1336px: rail flutuante à esquerda, 20px da borda (o componente do DS).
 * - abaixo disso: barra fixa no rodapé da tela, largura total e sem cantos
 *   arredondados. Nessa forma cada item mostra o rótulo abaixo do ícone, já que
 *   tooltip de hover não serve para toque.
 *
 * Produtos não ocupa um item por seção: um único ícone abre as categorias e a
 * vitrine. Abre no hover no desktop e por clique/foco em qualquer tamanho —
 * hover não existe em toque.
 */
@Component({
  selector: 'app-menu-lateral',
  imports: [Icon],
  templateUrl: './menu-lateral.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuLateral {
  private readonly host = inject(ElementRef) as ElementRef<HTMLElement>;

  protected readonly categorias = CATEGORIAS;
  protected readonly produtosAberto = signal(false);

  protected readonly itens: readonly ItemMenu[] = [
    { rotulo: 'Topo', icone: 'home', href: '#inicio' },
    { rotulo: 'Sobre', icone: 'user', href: '#sobre' },
    { rotulo: 'Produtos', icone: 'layout' },
    { rotulo: 'Contato', icone: 'mail', href: '#contato' },
  ];

  protected abrir(): void {
    this.produtosAberto.set(true);
  }

  protected fechar(): void {
    this.produtosAberto.set(false);
  }

  protected alternar(): void {
    this.produtosAberto.update((aberto) => !aberto);
  }

  /**
   * `focusout` borbulha ao andar entre os filhos, o que fecharia o menu no meio
   * da navegação por Tab. Só fecha quando o foco realmente sai do menu.
   */
  protected onFocusOut(event: FocusEvent): void {
    if (!this.dentroDoMenu(event.relatedTarget)) {
      this.fechar();
    }
  }

  /** Toque/clique fora fecha — no mobile o menu abre por clique, não por hover. */
  @HostListener('document:pointerdown', ['$event'])
  protected onPointerDownFora(event: Event): void {
    if (this.produtosAberto() && !this.dentroDoMenu(event.target)) {
      this.fechar();
    }
  }

  private dentroDoMenu(alvo: EventTarget | null): boolean {
    return alvo instanceof Node && this.host.nativeElement.contains(alvo);
  }
}
