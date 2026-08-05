import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { CATEGORIAS, PRODUTOS, type Produto } from '../../home.data';
import { Icon } from '../../../../ui/icon/icon';

/**
 * Vitrine de produtos: card padrão do DS (Service Card), tags de filtro e
 * carrossel que anda sozinho. Aqui a lista pode crescer bastante, então tem
 * setas para esquerda/direita.
 *
 * O trilho é um scroller nativo com scroll-snap — as setas e o autoplay só
 * empurram o scroll. Assim a quantidade de cards visíveis se resolve por CSS,
 * sem cálculo de largura por breakpoint.
 */
@Component({
  selector: 'app-vitrine-section',
  imports: [Icon],
  templateUrl: './vitrine-section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VitrineSection implements OnInit {
  private static readonly INTERVALO_MS = 4000;

  protected readonly categorias = CATEGORIAS;
  protected readonly filtro = signal('todos');

  protected readonly produtos = computed<readonly Produto[]>(() => {
    const filtro = this.filtro();
    return filtro === 'todos' ? PRODUTOS : PRODUTOS.filter((p) => p.categoriaId === filtro);
  });

  private readonly trilho = viewChild.required<ElementRef<HTMLElement>>('trilho');
  private timer: ReturnType<typeof setInterval> | undefined;
  private pausado = false;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearInterval(this.timer));
  }

  ngOnInit(): void {
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.timer = setInterval(() => {
        if (!this.pausado) {
          this.avancar();
        }
      }, VitrineSection.INTERVALO_MS);
    }
  }

  protected filtrar(id: string): void {
    this.filtro.set(id);
    this.trilho().nativeElement.scrollTo({ left: 0, behavior: 'auto' });
  }

  protected nomeCategoria(id: string): string {
    return this.categorias.find((c) => c.id === id)?.nome ?? '';
  }

  protected iconeCategoria(id: string): string {
    return this.categorias.find((c) => c.id === id)?.icone ?? 'box';
  }

  protected avancar(): void {
    const el = this.trilho().nativeElement;
    const fim = el.scrollWidth - el.clientWidth - 8;
    if (el.scrollLeft >= fim) {
      el.scrollTo({ left: 0, behavior: 'smooth' });
      return;
    }
    el.scrollBy({ left: this.passo(el), behavior: 'smooth' });
  }

  protected voltar(): void {
    const el = this.trilho().nativeElement;
    if (el.scrollLeft <= 8) {
      el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
      return;
    }
    el.scrollBy({ left: -this.passo(el), behavior: 'smooth' });
  }

  protected pausar(): void {
    this.pausado = true;
  }

  protected retomar(): void {
    this.pausado = false;
  }

  /** Largura de um card + gap; cai para 320px se o trilho estiver vazio. */
  private passo(el: HTMLElement): number {
    const card = el.firstElementChild as HTMLElement | null;
    if (!card) {
      return 320;
    }
    const gap = Number.parseFloat(getComputedStyle(el).columnGap) || 0;
    return card.getBoundingClientRect().width + gap;
  }
}
