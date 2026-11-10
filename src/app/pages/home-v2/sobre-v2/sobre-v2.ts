import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Icon } from '../../../ui/icon/icon';
import { Parallax } from '../../../ui/parallax/parallax';

/**
 * Sobre — versão do plano C (referência: Monolith Architecture, "From concept to
 * construct"). Superfície marinho com o desenho técnico em planta (blueprint),
 * no mesmo parallax da versão atual.
 *
 * As três disciplinas saem do próprio texto institucional ("integramos as áreas
 * mecânica, elétrica e de automação"). O texto de cada cartão é PROVISÓRIO:
 * descreve a disciplina sem prometer nada que o material da AUZA não diga —
 * validar com o cliente antes de publicar.
 */
@Component({
  selector: 'app-sobre-v2',
  imports: [Icon, Parallax],
  templateUrl: './sobre-v2.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SobreV2 {
  protected readonly disciplinas = [
    {
      icone: 'wrench',
      nome: 'Mecânica',
      texto:
        'Estruturas, mecanismos e acabamento projetados e fabricados internamente, do desenho à peça pronta.',
    },
    {
      icone: 'zap',
      nome: 'Elétrica',
      texto:
        'Comando, potência e proteção dimensionados para cada equipamento operar com segurança.',
    },
    {
      icone: 'cpu',
      nome: 'Automação',
      texto:
        'Controle de temperatura, tempo e processo para a máquina trabalhar com menos intervenção.',
    },
  ];
}
