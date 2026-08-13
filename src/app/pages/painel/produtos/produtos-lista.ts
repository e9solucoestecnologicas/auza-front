import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ProdutosService } from '../../../core/produtos/produtos.service';
import { ehErroApi } from '../../../core/auth/auth.models';
import { Icon } from '../../../ui/icon/icon';
import type {
  FiltroProdutos,
  MetaPagina,
  Ordenacao,
  OpcoesProduto,
  Produto,
} from '../../../core/produtos/produto.models';

const POR_PAGINA = 20;

/**
 * Listagem dos produtos cadastrados.
 *
 * Diferente da vitrine, aqui aparecem os OCULTOS e cada linha traz `clickCount` —
 * é a única tela onde se vê quantas vezes o produto foi clicado na landing.
 *
 * Filtro, ordenação e paginação são todos do SERVIDOR. Filtrar no cliente daria
 * resultado errado assim que passasse de uma página: o filtro só veria os 20 itens
 * carregados, não os do banco.
 */
@Component({
  selector: 'app-produtos-lista',
  imports: [RouterLink, DatePipe, Icon],
  templateUrl: './produtos-lista.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProdutosLista {
  private readonly api = inject(ProdutosService);

  protected readonly produtos = signal<readonly Produto[]>([]);
  protected readonly meta = signal<MetaPagina | null>(null);
  protected readonly opcoes = signal<OpcoesProduto | null>(null);
  protected readonly carregando = signal(true);
  protected readonly erro = signal<string | null>(null);

  /** Id em confirmação de remoção. Não há lixeira na API: apagar é definitivo. */
  protected readonly removendo = signal<string | null>(null);
  protected readonly apagando = signal(false);

  protected readonly filtro = signal<FiltroProdutos>({
    page: 1,
    perPage: POR_PAGINA,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    search: '',
    category: '',
    status: '',
  });

  protected readonly pagina = computed(() => this.meta()?.page ?? 1);
  protected readonly totalPaginas = computed(() => this.meta()?.totalPages ?? 0);
  protected readonly vazio = computed(() => !this.carregando() && this.produtos().length === 0);

  /** True quando algum filtro está ativo: muda o texto do estado vazio. */
  protected readonly filtrado = computed(() => {
    const f = this.filtro();
    return Boolean(f.search || f.category || f.status);
  });

  constructor() {
    this.api.opcoes().subscribe({
      next: (opcoes) => this.opcoes.set(opcoes),
      // Sem as opções os selects de filtro ficam vazios, mas a lista funciona:
      // não vale derrubar a tela por causa dos rótulos.
      error: () => this.opcoes.set(null),
    });
    this.buscar();
  }

  protected buscar(): void {
    this.carregando.set(true);
    this.erro.set(null);
    this.api.listar(this.filtro()).subscribe({
      next: (pagina) => {
        this.produtos.set(pagina.data);
        this.meta.set(pagina.meta);
        this.carregando.set(false);
      },
      error: (falha: unknown) => {
        this.erro.set(this.mensagem(falha, 'Não foi possível carregar os produtos.'));
        this.carregando.set(false);
      },
    });
  }

  /** Qualquer mudança de filtro volta para a página 1: a paginação antiga não vale mais. */
  protected filtrarPor(mudanca: Partial<FiltroProdutos>): void {
    this.filtro.update((atual) => ({ ...atual, ...mudanca, page: 1 }));
    this.buscar();
  }

  protected irParaPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas()) {
      return;
    }
    this.filtro.update((atual) => ({ ...atual, page: pagina }));
    this.buscar();
  }

  /**
   * Clique no cabeçalho: primeira vez ordena descendente (mais recente, maior
   * contagem), segunda inverte. Descendente primeiro porque é o que se quer ver
   * em "mais clicados" e "mais novos" — asc seria mostrar o fundo da lista.
   */
  protected ordenarPor(campo: Ordenacao): void {
    const atual = this.filtro();
    const inverter = atual.sortBy === campo && atual.sortOrder === 'desc';
    this.filtrarPor({ sortBy: campo, sortOrder: inverter ? 'asc' : 'desc' });
  }

  protected seta(campo: Ordenacao): string {
    const f = this.filtro();
    if (f.sortBy !== campo) {
      return '';
    }
    return f.sortOrder === 'desc' ? '↓' : '↑';
  }

  protected imagem(produto: Produto): string | null {
    return this.api.urlDaImagem(produto.imageUrl);
  }

  protected confirmarRemocao(id: string): void {
    this.removendo.set(id);
  }

  protected cancelarRemocao(): void {
    this.removendo.set(null);
  }

  protected remover(id: string): void {
    this.apagando.set(true);
    this.api.remover(id).subscribe({
      next: () => {
        this.apagando.set(false);
        this.removendo.set(null);
        // Recarrega em vez de tirar da lista local: a página perdeu um item e o
        // total mudou, então a paginação do servidor é a única fonte correta.
        this.buscar();
      },
      error: (falha: unknown) => {
        this.apagando.set(false);
        this.removendo.set(null);
        this.erro.set(this.mensagem(falha, 'Não foi possível remover o produto.'));
      },
    });
  }

  /**
   * A API responde em português e com detalhe, então a mensagem dela vale mais
   * que qualquer texto genérico daqui. O nosso texto entra só quando não há
   * mensagem — falha de rede, por exemplo.
   */
  private mensagem(falha: unknown, padrao: string): string {
    const corpo = (falha as { error?: unknown })?.error ?? falha;
    return ehErroApi(corpo) ? corpo.error.message : padrao;
  }
}
