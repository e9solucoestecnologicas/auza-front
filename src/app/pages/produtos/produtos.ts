import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CATEGORIAS, PRODUTOS, type Produto } from '../home/home.data';
import { Icon } from '../../ui/icon/icon';
import { Logo } from '../../ui/logo/logo';
import { FooterSection } from '../home/sections/footer/footer-section';
import { WhatsappFlutuante } from '../../ui/whatsapp-flutuante/whatsapp-flutuante';
import { GaleriaProduto } from './galeria/galeria';

/**
 * Catálogo completo — o destino do "Ver todos os produtos" da vitrine.
 *
 * A vitrine da home é um trilho de cartões estreitos em movimento: ali cabe o
 * nome, a categoria e uma frase. Esta página é o oposto disso de propósito — não
 * anda, os cartões são largos, e cada um abre o `comportamento` do equipamento
 * (o bloco "Como funciona") e a galeria de fotos. Mesmo conteúdo, outro
 * compromisso: lá é vitrine, aqui é consulta.
 *
 * Ritmo de superfícies, seguindo a home: cabeçalho ink → catálogo areia →
 * rodapé ink.
 */
@Component({
  selector: 'app-produtos',
  imports: [RouterLink, Icon, Logo, FooterSection, WhatsappFlutuante, GaleriaProduto],
  templateUrl: './produtos.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Produtos {
  private readonly router = inject(Router);

  protected readonly categorias = CATEGORIAS;
  protected readonly total = PRODUTOS.length;
  protected readonly filtro = signal('todos');

  protected readonly produtos = computed<readonly Produto[]>(() => {
    const filtro = this.filtro();
    return filtro === 'todos' ? PRODUTOS : PRODUTOS.filter((p) => p.categoriaId === filtro);
  });

  protected filtrar(id: string): void {
    this.filtro.set(id);
  }

  protected nomeCategoria(id: string): string {
    return this.categorias.find((c) => c.id === id)?.nome ?? '';
  }

  protected iconeCategoria(id: string): string {
    return this.categorias.find((c) => c.id === id)?.icone ?? 'box';
  }

  /**
   * Os `#ancora` desta página apontam para seções que vivem na HOME (o rodapé
   * reaproveitado, o "Solicitar orçamento" de cada cartão). Aqui elas não
   * existem: o clique vira navegação para a home com o fragmento, e o
   * `anchorScrolling` do router (ver app.config.ts) desce até a seção.
   *
   * Sem isto o `<base href="/">` resolveria `#contato` contra a raiz e o clique
   * cairia na rota coringa — o mesmo motivo do interceptador da home, com outro
   * destino.
   */
  protected onAnchorClick(event: MouseEvent): void {
    const anchor = (event.target as HTMLElement).closest('a[href^="#"]');
    if (!anchor) {
      return;
    }
    const fragment = anchor.getAttribute('href')?.slice(1);
    if (!fragment) {
      return;
    }
    event.preventDefault();
    void this.router.navigate(['/home'], { fragment });
  }
}
