import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Icon } from '../../../../ui/icon/icon';
import { Parallax } from '../../../../ui/parallax/parallax';

/** Sobre Nós — bloco de destaque com o texto institucional da marca. */
@Component({
  selector: 'app-sobre-section',
  imports: [Icon, Parallax],
  templateUrl: './sobre-section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SobreSection {
  protected readonly indicadores = [
    { valor: '5', rotulo: 'Segmentos atendidos' },
    { valor: '15+', rotulo: 'Equipamentos em linha' },
    { valor: '100%', rotulo: 'Fabricação própria' },
  ];
}
