import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Ícones do DS (set Lucide) declarados como dados.
 *
 * O DS documenta os ícones via `<i data-lucide>` + script do Lucide, que
 * substitui o elemento por um <svg>. Em listas dinâmicas (filtros, sliders) o
 * Angular recria os nós e a substituição se perde. Aqui as formas vêm de um
 * mapa e são renderizadas pelo próprio template — mesmo desenho, sem depender
 * do runtime nem de sanitização de HTML.
 */
type Shape =
  | { readonly kind: 'path'; readonly d: string }
  | { readonly kind: 'circle'; readonly cx: number; readonly cy: number; readonly r: number }
  | {
      readonly kind: 'rect';
      readonly x: number;
      readonly y: number;
      readonly w: number;
      readonly h: number;
      readonly rx: number;
    };

const p = (d: string): Shape => ({ kind: 'path', d });
const c = (cx: number, cy: number, r: number): Shape => ({ kind: 'circle', cx, cy, r });

const ICONS: Record<string, readonly Shape[]> = {
  leaf: [
    p('M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z'),
    p('M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12'),
  ],
  scissors: [
    p('M20 4 8.12 15.88'),
    p('M14.47 14.48 20 20'),
    p('M8.12 8.12 12 12'),
    c(6, 6, 3),
    c(6, 18, 3),
  ],
  box: [
    p(
      'M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z',
    ),
    p('m3.3 7 8.7 5 8.7-5'),
    p('M12 22V12'),
  ],
  shirt: [
    p(
      'M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z',
    ),
  ],
  flame: [
    p(
      'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z',
    ),
  ],
  home: [
    p('M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8'),
    p(
      'M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
    ),
  ],
  user: [p('M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2'), c(12, 7, 4)],
  layout: [{ kind: 'rect', x: 3, y: 3, w: 18, h: 18, rx: 2 }, p('M3 9h18'), p('M9 21V9')],
  'arrow-right': [p('M5 12h14'), p('m12 5 7 7-7 7')],
  'arrow-down': [p('M12 5v14'), p('m19 12-7 7-7-7')],
  'arrow-down-right': [p('m7 7 10 10'), p('M17 7v10H7')],
  'chevron-left': [p('m15 18-6-6 6-6')],
  'chevron-right': [p('m9 18 6-6-6-6')],
  mail: [
    { kind: 'rect', x: 2, y: 4, w: 20, h: 16, rx: 2 },
    p('m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7'),
  ],
  phone: [
    p(
      'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z',
    ),
  ],
  'map-pin': [p('M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z'), c(12, 10, 3)],
  check: [p('M20 6 9 17l-5-5')],
  plus: [p('M5 12h14'), p('M12 5v14')],
  send: [p('m22 2-7 20-4-9-9-4Z'), p('M22 2 11 13')],

  /**
   * WhatsApp. Não vem do Lucide: o set não tem marcas, por decisão dele. É o
   * glifo oficial da marca (viewBox 24, três subpaths: fone, anel interno e
   * bolha com a cauda), e por isso é CHEIO, não de traço — ver PREENCHIDOS.
   */
  whatsapp: [
    p(
      'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.966 1.164-.198.199-.396.223-.694.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.05-.52-.099-.148-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.885 9.888-9.885 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z',
    ),
  ],
};

/**
 * Ícones que são GLIFO CHEIO, e não desenho de traço.
 *
 * O resto do set é Lucide: contorno de 2px com `fill: none`. Uma marca desenhada
 * assim sai irreconhecível — o miolo vaza e a espessura não é dela. Estes
 * invertem: pintam o preenchimento e não traçam contorno.
 */
const PREENCHIDOS = new Set(['whatsapp']);

export type IconName = keyof typeof ICONS;

@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-grid place-items-center' },
  template: `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      [attr.fill]="preenchido() ? 'currentColor' : 'none'"
      [attr.stroke]="preenchido() ? 'none' : 'currentColor'"
      [attr.stroke-width]="preenchido() ? null : strokeWidth()"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      class="w-full h-full"
    >
      @for (shape of shapes(); track $index) {
        @switch (shape.kind) {
          @case ('path') {
            <svg:path [attr.d]="shape.d" />
          }
          @case ('circle') {
            <svg:circle [attr.cx]="shape.cx" [attr.cy]="shape.cy" [attr.r]="shape.r" />
          }
          @case ('rect') {
            <svg:rect
              [attr.x]="shape.x"
              [attr.y]="shape.y"
              [attr.width]="shape.w"
              [attr.height]="shape.h"
              [attr.rx]="shape.rx"
            />
          }
        }
      }
    </svg>
  `,
})
export class Icon {
  readonly name = input.required<string>();
  readonly strokeWidth = input(2);

  protected readonly shapes = computed<readonly Shape[]>(() => ICONS[this.name()] ?? []);
  protected readonly preenchido = computed(() => PREENCHIDOS.has(this.name()));
}
