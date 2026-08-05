import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

type Variante = 'claro' | 'escuro';

/** Dimensões reais dos arquivos — evitam salto de layout enquanto a imagem carrega. */
const ARQUIVOS: Record<Variante, { largura: number; altura: number }> = {
  claro: { largura: 940, altura: 307 },
  escuro: { largura: 1410, altura: 460 },
};

/**
 * Logotipo da AUZA. Duas variantes: `claro` (marca em marrom, para superfícies
 * claras) e `escuro` (marca em marfim, para a superfície ink). Quem usa define
 * a largura pela classe do host — a altura acompanha.
 */
@Component({
  selector: 'app-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <img
      [src]="'/img/logo-fundo-' + variante() + '.png'"
      [attr.width]="dimensoes().largura"
      [attr.height]="dimensoes().altura"
      [attr.loading]="lazy() ? 'lazy' : null"
      alt="AUZA — Engenharia e Automação"
      decoding="async"
      class="block h-auto w-full"
    />
  `,
})
export class Logo {
  readonly variante = input<Variante>('claro');
  /** Use no rodapé e em qualquer logo fora da primeira dobra. */
  readonly lazy = input(false);

  protected readonly dimensoes = computed(() => ARQUIVOS[this.variante()]);
}
