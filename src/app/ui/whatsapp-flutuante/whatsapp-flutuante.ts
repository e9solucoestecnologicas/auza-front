import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CONTATO, linkWhatsapp } from '../../pages/home/home.data';
import { Icon } from '../icon/icon';

/**
 * Botão flutuante de WhatsApp — atalho permanente para o atendimento, em
 * qualquer ponto da rolagem.
 *
 * Aponta para o FIXO do atendimento (11 2532-3679), e não para o celular que
 * aparece com o selo do WhatsApp no material impresso: foi o número pedido.
 *
 * Posição e camada convivem com o menu lateral, que é a outra peça fixa da tela:
 *
 *  - abaixo de 1336px o menu é uma BARRA no rodapé (~56px). O botão sobe para
 *    `4.5rem`, a mesma altura que o submenu de produtos usa para não cobri-la;
 *  - de 1336px para cima o menu vira rail à esquerda e o canto inferior direito
 *    fica livre: aí o botão desce para o rodapé da janela;
 *  - `z-30` contra o `z-40` do menu, de propósito: no mobile o submenu de
 *    produtos abre para cima e ocupa exatamente esta faixa. Quem abriu o menu
 *    quer o menu, não o botão por cima dele.
 *
 * O verde é o da marca do WhatsApp, a única cor fora da paleta AUZA na página.
 * É o que a torna reconhecível como canal de conversa antes de qualquer leitura
 * — o mesmo motivo pelo qual o selo aparece verde no material de contato.
 *
 * O branco do glifo é `#fff` literal, e não `text-white`: dentro de `.ds-root` a
 * classe do Tailwind é remapeada para o branco da marca (`!important`), e a marca
 * de outra empresa sobre o verde dela não é lugar de aplicar nossa paleta.
 */
@Component({
  selector: 'app-whatsapp-flutuante',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!--
      Quadrado explícito (h-14 w-14) com o ícone centrado por place-items-center,
      e não padding em volta do ícone: é o que garante o círculo redondo. Antes
      havia um rótulo com o número que abria no hover, e o gap entre ele e o
      ícone continuava contando com o rótulo fechado — a caixa ficava 12px mais
      larga que alta, sobrando à direita.

      O número segue no aria-label: quem usa leitor de tela ouve para onde o
      botão leva, sem que ele apareça na tela.
    -->
    <a
      class="fixed bottom-[4.5rem] right-4 z-30 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-[#fff] shadow-lg transition-all hover:bg-[#1ebe5b] hover:shadow-xl min-[1336px]:bottom-6 min-[1336px]:right-6"
      [href]="link"
      target="_blank"
      rel="noopener"
      [attr.aria-label]="'Falar com o atendimento da AUZA no WhatsApp: ' + numero.exibicao"
    >
      <app-icon name="whatsapp" class="h-7 w-7" />
    </a>
  `,
})
export class WhatsappFlutuante {
  protected readonly numero = CONTATO.atendimento;
  protected readonly link = linkWhatsapp(CONTATO.atendimento);
}
