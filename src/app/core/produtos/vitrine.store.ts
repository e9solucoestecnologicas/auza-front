import { Injectable, computed, inject, signal } from '@angular/core';
import { ProdutosService } from './produtos.service';
import type { CategoriaProduto, ProdutoPublico } from './produto.models';

/**
 * Uma vez que a página do público tem DUAS partes lendo o mesmo catálogo — as
 * seções por categoria e a vitrine —, o carregamento vive aqui.
 *
 * `carregar()` é idempotente: a primeira chamada dispara a requisição e as
 * seguintes não fazem nada. Sem isso seriam duas requisições iguais, e no plano
 * free do Render a primeira leva ~22s para acordar o serviço — duas esperas onde
 * cabe uma.
 *
 * Pede `perPage: 100` e filtra em memória em vez de refazer a chamada por
 * categoria. São dois motivos: a vitrine precisa da lista inteira para a deriva
 * dar a volta sem costura, e cada troca de filtro custaria uma ida à rede numa
 * página de marketing.
 */
@Injectable({ providedIn: 'root' })
export class VitrineStore {
  /** Teto da API. Acima de 100 ela responde 400. */
  private static readonly POR_PAGINA = 100;

  private readonly api = inject(ProdutosService);

  private readonly _produtos = signal<readonly ProdutoPublico[]>([]);
  private readonly _carregando = signal(false);
  private readonly _erro = signal(false);
  private pedido = false;

  readonly produtos = this._produtos.asReadonly();
  readonly carregando = this._carregando.asReadonly();
  /** Só um sinalizador: a landing não mostra mensagem de erro de API ao visitante. */
  readonly erro = this._erro.asReadonly();

  /** True enquanto não há nada para desenhar — carregando ou falhou. */
  readonly vazio = computed(() => this._produtos().length === 0);

  carregar(): void {
    if (this.pedido) {
      return;
    }
    this.pedido = true;
    this._carregando.set(true);

    this.api.listarPublicos({ perPage: VitrineStore.POR_PAGINA }).subscribe({
      next: (pagina) => {
        this._produtos.set(pagina.data);
        this._carregando.set(false);
      },
      error: () => {
        // Sem alarme na tela: a landing cai para o conteúdo estático, que é o que
        // ela mostrava antes de existir API. Visitante não tem o que fazer com
        // "falha 500 no catálogo".
        this._erro.set(true);
        this._carregando.set(false);
      },
    });
  }

  /**
   * O que uma seção de categoria deve mostrar: os produtos em DESTAQUE dela; e,
   * se nenhum estiver destacado, todos os que ela tem.
   *
   * O destaque é uma curadoria — "estes são os que quero na vitrine da seção".
   * Quando ninguém curou, mostrar tudo é melhor que mostrar nada: a seção
   * continua provando que a linha existe.
   */
  daCategoria(categoria: CategoriaProduto): readonly ProdutoPublico[] {
    const todos = this._produtos().filter((p) => p.category === categoria);
    const destacados = todos.filter((p) => p.featured);
    return destacados.length > 0 ? destacados : todos;
  }

  /** Endereço de exibição da imagem, ou null quando o produto não tem. */
  imagem(produto: ProdutoPublico): string | null {
    return this.api.urlDaImagem(produto.imageUrl);
  }

  /**
   * Conta o clique do visitante — e só isso.
   *
   * A navegação NÃO passa por aqui: quem leva ao Mercado Livre é o `href` do
   * próprio link do card. Abrir a janela dentro do `subscribe` cairia no
   * bloqueador de pop-up, porque nesse ponto a execução já saiu do gesto do
   * usuário. E como o link de venda vem no payload do produto, não há motivo
   * para esperar a resposta da contagem só para descobri-lo.
   *
   * Erro é ignorado de propósito: perder uma contagem é aceitável, atrapalhar a
   * ida do visitante para a compra não.
   */
  registrarClique(produto: ProdutoPublico): void {
    this.api.registrarClique(produto.id).subscribe({ error: () => undefined });
  }
}
