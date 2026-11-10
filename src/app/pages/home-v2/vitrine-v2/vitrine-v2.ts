import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../../../ui/icon/icon';
import { VitrineSection } from '../../home/sections/vitrine/vitrine-section';

/**
 * Vitrine — versão do plano C (referência: "Hardware Inventory" do AEX).
 *
 * Só o TEMPLATE é novo. O comportamento — filtro por categoria, trilho que deriva
 * sozinho e entra em loop, setas, pausa no ponteiro, contagem de cliques — é
 * herdado da vitrine atual, que já foi acertado com o cliente (inclusive a
 * deriva ignorar o reduced-motion, a pedido dele). O template mantém as mesmas
 * ligações: `#trilho`, `cards()`, `produtos()`, `filtrar()`, `pausar()`…
 */
@Component({
  selector: 'app-vitrine-v2',
  imports: [Icon, RouterLink],
  templateUrl: './vitrine-v2.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VitrineV2 extends VitrineSection {}
