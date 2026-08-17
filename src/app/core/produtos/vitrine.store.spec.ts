import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../auth/api.config';
import { VitrineStore } from './vitrine.store';
import type { CategoriaProduto, ProdutoPublico } from './produto.models';

const BASE = 'http://api.teste/api/v1';

function produto(
  nome: string,
  category: CategoriaProduto,
  featured: boolean,
  imageUrl: string | null = null,
): ProdutoPublico {
  return {
    id: nome,
    name: nome,
    category,
    categoryLabel: category,
    description: 'Descrição do equipamento.',
    imageUrl,
    link: `https://ml.com/${nome}`,
    featured,
    createdAt: '2026-08-17T14:19:04.420Z',
  };
}

describe('VitrineStore', () => {
  let store: VitrineStore;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE },
      ],
    });
    store = TestBed.inject(VitrineStore);
    http = TestBed.inject(HttpTestingController);
  });

  function responder(produtos: readonly ProdutoPublico[]) {
    http
      .expectOne((r) => r.url === `${BASE}/public/products`)
      .flush({
        data: produtos,
        meta: { page: 1, perPage: 100, total: produtos.length, totalPages: 1 },
      });
  }

  it('carrega o catálogo uma vez só, mesmo com várias partes pedindo', () => {
    // A landing tem duas: as seções por categoria e a vitrine. Duas requisições
    // seriam duas esperas do cold start do Render.
    store.carregar();
    store.carregar();
    store.carregar();

    const pedidos = http.match((r) => r.url === `${BASE}/public/products`);
    expect(pedidos.length).toBe(1);
    // Pede o teto da API: a vitrine precisa da lista inteira para a deriva.
    expect(pedidos[0].request.params.get('perPage')).toBe('100');
    pedidos[0].flush({ data: [], meta: { page: 1, perPage: 100, total: 0, totalPages: 0 } });
  });

  describe('daCategoria', () => {
    it('devolve só os destacados quando a categoria tem destaque', () => {
      store.carregar();
      responder([
        produto('Escaldadeira', 'AGRO', true),
        produto('Depenadeira', 'AGRO', false),
        produto('Cortador', 'COMUNICACAO_VISUAL', false),
      ]);

      expect(store.daCategoria('AGRO').map((p) => p.name)).toEqual(['Escaldadeira']);
    });

    it('devolve todos quando nenhum está destacado', () => {
      store.carregar();
      responder([
        produto('Cortador EVA', 'COMUNICACAO_VISUAL', false),
        produto('Cortador XPS', 'COMUNICACAO_VISUAL', false),
      ]);

      // Sem curadoria, mostrar tudo é melhor que mostrar nada: a seção continua
      // provando que a linha existe.
      expect(store.daCategoria('COMUNICACAO_VISUAL').map((p) => p.name)).toEqual([
        'Cortador EVA',
        'Cortador XPS',
      ]);
    });

    it('devolve vazio para categoria sem produto', () => {
      store.carregar();
      responder([produto('Escaldadeira', 'AGRO', true)]);
      expect(store.daCategoria('TEXTIL')).toEqual([]);
    });

    it('não mistura categorias', () => {
      store.carregar();
      responder([
        produto('Escaldadeira', 'AGRO', true),
        produto('Caldeira', 'CALDEIRAS_MISTURADOR_INOX', true),
      ]);
      expect(store.daCategoria('AGRO').map((p) => p.name)).toEqual(['Escaldadeira']);
      expect(store.daCategoria('CALDEIRAS_MISTURADOR_INOX').map((p) => p.name)).toEqual([
        'Caldeira',
      ]);
    });
  });

  it('resolve a imagem de upload na raiz da API, fora do /api/v1', () => {
    store.carregar();
    responder([produto('Caldeira', 'AGRO', true, '/uploads/products/x.png')]);

    const [p] = store.daCategoria('AGRO');
    expect(store.imagem(p)).toBe('http://api.teste/uploads/products/x.png');
  });

  it('marca erro sem derrubar nada quando a API falha', () => {
    store.carregar();
    http
      .expectOne((r) => r.url === `${BASE}/public/products`)
      .error(new ProgressEvent('falha de rede'));

    expect(store.erro()).toBe(true);
    expect(store.carregando()).toBe(false);
    // Vazio é o sinal para a landing cair no conteúdo estático.
    expect(store.vazio()).toBe(true);
  });

  describe('contagem de clique', () => {
    it('registra na rota pública', () => {
      const p = produto('Caldeira', 'AGRO', true);
      store.registrarClique(p);

      const req = http.expectOne(`${BASE}/public/products/Caldeira/click`);
      expect(req.request.method).toBe('POST');
      req.flush({ id: 'Caldeira', clickCount: 8, link: p.link });
    });

    it('engole a falha: perder a contagem não pode atrapalhar a ida à compra', () => {
      const p = produto('Caldeira', 'AGRO', true);
      // Sem tratamento, o erro subiria como unhandled e poluiria o console do
      // visitante — e a navegação, que é do href, não depende disto.
      expect(() => {
        store.registrarClique(p);
        http
          .expectOne(`${BASE}/public/products/Caldeira/click`)
          .error(new ProgressEvent('falha de rede'));
      }).not.toThrow();
    });
  });
});
