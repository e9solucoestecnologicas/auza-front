import { ChangeDetectionStrategy, Component, ElementRef, inject } from '@angular/core';
import { HeroSection } from './sections/hero/hero-section';
import { SobreSection } from './sections/sobre/sobre-section';
import { DestaquesSection } from './sections/destaques/destaques-section';
import { VitrineSection } from './sections/vitrine/vitrine-section';
import { ContatoSection } from './sections/contato/contato-section';
import { FooterSection } from './sections/footer/footer-section';
import { MenuLateral } from './sections/menu-lateral/menu-lateral';
import { WhatsappFlutuante } from '../../ui/whatsapp-flutuante/whatsapp-flutuante';

/**
 * Landing page da AUZA — versão inicial.
 *
 * Ritmo de superfícies (alterna claro/escuro para não cansar a leitura):
 * hero ink → sobre branco → destaques (branco nas cinco categorias)
 * → vitrine gelo → contato branco → rodapé ink.
 */
@Component({
  selector: 'app-home',
  imports: [
    MenuLateral,
    HeroSection,
    SobreSection,
    DestaquesSection,
    VitrineSection,
    ContatoSection,
    FooterSection,
    WhatsappFlutuante,
  ],
  templateUrl: './home.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  private readonly host = inject(ElementRef) as ElementRef<HTMLElement>;

  /**
   * O `<base href="/">` do Angular resolve `#ancora` contra a raiz e cairia na
   * rota coringa, então o scroll é feito aqui sem navegar.
   */
  protected onAnchorClick(event: MouseEvent): void {
    const anchor = (event.target as HTMLElement).closest('a[href^="#"]');
    if (!anchor) {
      return;
    }
    const id = anchor.getAttribute('href')?.slice(1);
    if (!id) {
      return;
    }
    event.preventDefault();
    this.host.nativeElement.querySelector(`#${id}`)?.scrollIntoView({ behavior: 'smooth' });
  }
}
