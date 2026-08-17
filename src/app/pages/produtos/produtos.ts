import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CATEGORIAS, type Foto } from '../home/home.data';
import { VitrineStore } from '../../core/produtos/vitrine.store';
import type { ProdutoPublico } from '../../core/produtos/produto.models';
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

  private readonly store = inject(VitrineStore);

  protected readonly categorias = CATEGORIAS;
  protected readonly filtro = signal('todos');
  protected readonly carregando = this.store.carregando;
  /** Total do catálogo inteiro, não do filtro: é o número do cabeçalho. */
  protected readonly total = computed(() => this.store.produtos().length);

  /** Filtra pelo CÓDIGO da categoria na API (AGRO, TEXTIL…), não pelo slug local. */
  protected readonly produtos = computed<readonly ProdutoPublico[]>(() => {
    const filtro = this.filtro();
    const catalogo = this.store.produtos();
    return filtro === 'todos' ? catalogo : catalogo.filter((p) => p.category === filtro);
  });

  constructor() {
    // Mesmo store da home: se o visitante veio de lá, o catálogo já está em mão.
    this.store.carregar();
  }

  protected filtrar(codigo: string): void {
    this.filtro.set(codigo);
  }

  protected iconeCategoria(codigo: string): string {
    return this.categorias.find((c) => c.codigo === codigo)?.icone ?? 'box';
  }

  /**
   * A galeria fala em lista de fotos; a API dá UMA imagem por produto
   * (`imageUrl`, que pode ser null). A conversão fica aqui em vez de mudar a
   * galeria: ela já sabe exibir uma foto só, e se o contrato passar a ter várias
   * é este método que cresce.
   *
   * O `alt` sai do nome do produto. A galeria pede alt descritivo, e é o melhor
   * que existe: o contrato não tem campo de texto alternativo.
   */
  protected fotos(produto: ProdutoPublico): readonly Foto[] {
    const src = this.store.imagem(produto);
    return src ? [{ src, alt: produto.name }] : [];
  }

  /** Conta o clique; quem navega é o `href` do link de venda. */
  protected registrarClique(produto: ProdutoPublico): void {
    this.store.registrarClique(produto);
  }

  /**
   * Ids com o descritivo aberto.
   *
   * O cartão tem ALTURA FIXA, então abrir não empurra o botão para fora nem
   * desalinha a grade: o texto passa a rolar dentro da própria área. É a única
   * forma de honrar "altura fixa" e "ver mais" ao mesmo tempo — expandir o cartão
   * quebraria a primeira, e um modal seria outra tela.
   */
  private readonly abertos = signal<ReadonlySet<string>>(new Set());

  protected expandido(id: string): boolean {
    return this.abertos().has(id);
  }

  protected alternarTexto(id: string): void {
    this.abertos.update((atual) => {
      const proximo = new Set(atual);
      if (!proximo.delete(id)) {
        proximo.add(id);
      }
      return proximo;
    });
  }

  /**
   * Vale oferecer "Ver mais"?
   *
   * Decide por comprimento do texto, e não medindo o parágrafo: medir exigiria
   * ler `scrollHeight` de cada cartão depois do render, e o número muda com a
   * largura da coluna e com a fonte carregada. O corte é deliberadamente BAIXO —
   * um "Ver mais" que abre pouca coisa é um incômodo pequeno, um texto cortado
   * sem como abrir é conteúdo perdido.
   */
  protected temMais(produto: ProdutoPublico): boolean {
    return produto.description.length > 120;
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
