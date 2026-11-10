import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { API_BASE_URL } from '../auth/api.config';
import type {
  CliqueRegistrado,
  EdicaoProduto,
  FiltroProdutos,
  NovoProduto,
  OpcoesProduto,
  Pagina,
  Produto,
  ProdutoPublico,
} from './produto.models';

/**
 * Acesso às rotas de produto (contrato v0.1.0, §3 a §6).
 *
 * As rotas do painel exigem Bearer, mas nada disso aparece aqui: o
 * `authInterceptor` anexa o token e renova a sessão quando ele vence. Este
 * serviço só descreve o contrato.
 */
@Injectable({ providedIn: 'root' })
export class ProdutosService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  /**
   * Raiz da API, sem o prefixo de versão.
   *
   * `imageUrl` chega como `/uploads/products/<uuid>.png`, e esse arquivo é
   * servido na RAIZ — não sob `/api/v1`. Concatenar com a base daria
   * `…/api/v1/uploads/…` e 404 em toda imagem. Tira-se o prefixo em vez de usar
   * `new URL().origin` para o caso de a API viver sob um subcaminho.
   */
  private readonly raiz = this.base.replace(/\/api\/v\d+\/?$/, '');

  /** Listagem do painel: vê OCULTO e traz clickCount. */
  listar(filtro: FiltroProdutos = {}): Observable<Pagina<Produto>> {
    return this.http.get<Pagina<Produto>>(`${this.base}/products`, {
      params: this.parametros(filtro),
    });
  }

  /**
   * Vitrine: rota aberta, sem token. Devolve só os produtos VISÍVEIS e omite os
   * campos de gestão.
   */
  listarPublicos(filtro: FiltroProdutos = {}): Observable<Pagina<ProdutoPublico>> {
    return this.http.get<Pagina<ProdutoPublico>>(`${this.base}/public/products`, {
      params: this.parametros(filtro),
    });
  }

  obter(id: string): Observable<Produto> {
    return this.http.get<Produto>(`${this.base}/products/${id}`);
  }

  /** Categorias e status com rótulo, para os selects do formulário. */
  opcoes(): Observable<OpcoesProduto> {
    return this.http.get<OpcoesProduto>(`${this.base}/products/options`);
  }

  criar(dados: NovoProduto): Observable<Produto> {
    return this.http.post<Produto>(`${this.base}/products`, dados);
  }

  /** Parcial: passe só os campos alterados. Objeto vazio faria a API responder 400. */
  atualizar(id: string, mudancas: EdicaoProduto): Observable<Produto> {
    return this.http.patch<Produto>(`${this.base}/products/${id}`, mudancas);
  }

  /** Definitivo: não há lixeira, e o arquivo de imagem vai junto. */
  remover(id: string): Observable<{ readonly message: string }> {
    return this.http.delete<{ readonly message: string }>(`${this.base}/products/${id}`);
  }

  /**
   * Upload da imagem. Devolve o produto JÁ atualizado — não precisa de PATCH
   * depois, e enviar outra imagem substitui e apaga a anterior.
   *
   * O campo do form-data precisa se chamar `file`. E não se define
   * `Content-Type`: com um `FormData`, quem monta o cabeçalho (com o boundary) é
   * o browser — fixá-lo à mão quebra o parse no servidor.
   */
  enviarImagem(id: string, arquivo: File): Observable<Produto> {
    const corpo = new FormData();
    corpo.append('file', arquivo);
    return this.http.post<Produto>(`${this.base}/products/${id}/image`, corpo);
  }

  /**
   * Rota aberta: conta o clique do visitante e devolve o link de venda na mesma
   * resposta, para a landing contar e redirecionar numa só chamada.
   */
  registrarClique(id: string): Observable<CliqueRegistrado> {
    return this.http.post<CliqueRegistrado>(`${this.base}/public/products/${id}/click`, null);
  }

  /**
   * Endereço de exibição da imagem: absoluto quando é CDN, prefixado com a raiz
   * quando é upload nosso. Produto sem imagem devolve null — é estado normal, e
   * quem chama decide o placeholder.
   */
  urlDaImagem(imageUrl: string | null): string | null {
    if (!imageUrl) {
      return null;
    }
    return /^https?:\/\//i.test(imageUrl) ? imageUrl : `${this.raiz}${imageUrl}`;
  }

  /**
   * Só o que tem valor entra na query.
   *
   * String vazia é o "todos" dos selects de filtro e não pode virar
   * `?category=`: a API valida o enum e responderia 400. `featured` vira texto
   * porque é isso que ela aceita — `true` ou `false`, nada mais.
   */
  private parametros(filtro: FiltroProdutos): HttpParams {
    let params = new HttpParams();
    for (const [chave, valor] of Object.entries(filtro)) {
      if (valor === undefined || valor === null || valor === '') {
        continue;
      }
      params = params.set(chave, String(valor));
    }
    return params;
  }
}
