import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

type Variante = 'claro' | 'escuro';
type Forma = 'horizontal' | 'vertical' | 'simbolo';

/**
 * Proporção (viewBox) de cada SVG em public/img/marca — vai para width/height
 * do <img> e evita salto de layout enquanto o arquivo carrega.
 *
 * Os SVGs foram vetorizados a partir dos PNGs da identidade visual
 * (Identidade Visual Nova/, fora do repositório): o texto saiu do logo
 * principal em alta resolução e a diagramação horizontal, da Submarca.
 */
const PROPORCOES: Record<Forma, { largura: number; altura: number }> = {
  horizontal: { largura: 4227, altura: 1118 },
  vertical: { largura: 2484, altura: 2211 },
  simbolo: { largura: 1479, altura: 957 },
};

/**
 * Logotipo da AUZA. A variante diz a SUPERFÍCIE onde ele vai: `claro` (texto
 * marinho, para fundo claro) e `escuro` (texto branco, para fundo marinho). O
 * símbolo é laranja nas duas e por isso não tem variante.
 *
 * Quem usa define a largura pela classe do host — a altura acompanha.
 */
@Component({
  selector: 'app-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <img
      [src]="arquivo()"
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
  readonly forma = input<Forma>('horizontal');
  /** Use no rodapé e em qualquer logo fora da primeira dobra. */
  readonly lazy = input(false);

  protected readonly dimensoes = computed(() => PROPORCOES[this.forma()]);
  protected readonly arquivo = computed(() =>
    this.forma() === 'simbolo'
      ? '/img/marca/simbolo.svg'
      : `/img/marca/logo-${this.forma()}-${this.variante()}.svg`,
  );
}
