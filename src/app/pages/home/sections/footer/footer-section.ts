import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CATEGORIAS } from '../../home.data';
import { Logo } from '../../../../ui/logo/logo';

/** Rodapé — fecha a página na superfície escura da marca. */
@Component({
  selector: 'app-footer-section',
  imports: [Logo],
  templateUrl: './footer-section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterSection {
  protected readonly categorias = CATEGORIAS;
  protected readonly ano = new Date().getFullYear();

  protected readonly institucional = [
    { rotulo: 'Sobre nós', href: '#sobre' },
    { rotulo: 'Soluções', href: '#solucoes' },
    { rotulo: 'Produtos', href: '#produtos' },
    { rotulo: 'Contato', href: '#contato' },
  ];
}
