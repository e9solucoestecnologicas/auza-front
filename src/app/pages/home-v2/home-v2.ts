import { ChangeDetectionStrategy, Component, ElementRef, inject } from '@angular/core';
import { HeroSection } from '../home/sections/hero/hero-section';
import { ContatoSection } from '../home/sections/contato/contato-section';
import { FooterSection } from '../home/sections/footer/footer-section';
import { MenuLateral } from '../home/sections/menu-lateral/menu-lateral';
import { WhatsappFlutuante } from '../../ui/whatsapp-flutuante/whatsapp-flutuante';
import { SobreV2 } from './sobre-v2/sobre-v2';
import { SolucoesV2 } from './solucoes-v2/solucoes-v2';
import { VitrineV2 } from './vitrine-v2/vitrine-v2';

/**
 * PROTÓTIPO do plano C do rebrand — rota /home-v2, fora do sitemap e bloqueada
 * no robots.txt. A home de produção (/home) segue intacta até a aprovação.
 *
 * Só Sobre, Soluções e Vitrine são novas (referências: Monolith Architecture +
 * AEX, do banco de referências). Hero, Contato e Rodapé são os da home atual.
 *
 * Ritmo de superfícies: hero marinho → sobre marinho (planta técnica) →
 * soluções marinho (painéis de setor) → vitrine gelo → contato branco →
 * rodapé marinho. Os estilos novos ficam em src/styles/_ds-v2.scss.
 */
@Component({
  selector: 'app-home-v2',
  imports: [
    MenuLateral,
    HeroSection,
    SobreV2,
    SolucoesV2,
    VitrineV2,
    ContatoSection,
    FooterSection,
    WhatsappFlutuante,
  ],
  template: `
    <div class="ds-root antialiased" (click)="onAnchorClick($event)">
      <app-menu-lateral />
      <app-hero-section />
      <app-sobre-v2 />
      <app-solucoes-v2 />
      <app-vitrine-v2 />
      <app-contato-section />
      <app-footer-section />
      <app-whatsapp-flutuante />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeV2 {
  private readonly host = inject(ElementRef) as ElementRef<HTMLElement>;

  /** Mesmo tratamento da home: `#ancora` rola sem navegar (ver Home). */
  protected onAnchorClick(event: MouseEvent): void {
    const anchor = (event.target as HTMLElement).closest('a[href^="#"]');
    const id = anchor?.getAttribute('href')?.slice(1);
    if (!anchor || !id) {
      return;
    }
    event.preventDefault();
    this.host.nativeElement.querySelector(`#${id}`)?.scrollIntoView({ behavior: 'smooth' });
  }
}
