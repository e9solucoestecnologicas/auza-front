import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../auth/api.config';
import { ProdutosService } from './produtos.service';
import type { Produto } from './produto.models';

const BASE = 'http://api.teste/api/v1';

function produto(extra: Partial<Produto> = {}): Produto {
  return {
    id: 'p1',
    name: 'Misturador Inox 200L',
    category: 'CALDEIRAS_MISTURADOR_INOX',
    categoryLabel: 'Caldeiras e Misturador Inox',
    status: 'VISIVEL',
    statusLabel: 'Visível',
    description: 'Misturador industrial em inox 304 com pás removíveis.',
    imageUrl: null,
    link: 'https://www.mercadolivre.com.br/exemplo',
    featured: false,
    clickCount: 0,
    createdAt: '2026-08-12T14:26:39.251Z',
    updatedAt: '2026-08-12T17:49:27.926Z',
    ...extra,
  };
}

/**
 * Estes testes são o contrato da API escrito em código: URL, verbo, query e corpo
 * de cada rota. É a parte que não dá para conferir lendo o componente, e a que
 * quebra em silêncio quando o backend muda de forma.
 */
describe('ProdutosService', () => {
  let api: ProdutosService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE },
      ],
    });
    api = TestBed.inject(ProdutosService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  describe('listagem do painel', () => {
    it('manda paginação e filtros na query', () => {
      api
        .listar({
          page: 2,
          perPage: 20,
          sortBy: 'clickCount',
          sortOrder: 'desc',
          search: 'inox',
          category: 'AGRO',
          status: 'OCULTO',
          featured: true,
        })
        .subscribe();

      const req = http.expectOne((r) => r.url === `${BASE}/products`);
      expect(req.request.method).toBe('GET');
      const p = req.request.params;
      expect(p.get('page')).toBe('2');
      expect(p.get('perPage')).toBe('20');
      expect(p.get('sortBy')).toBe('clickCount');
      expect(p.get('sortOrder')).toBe('desc');
      expect(p.get('search')).toBe('inox');
      expect(p.get('category')).toBe('AGRO');
      expect(p.get('status')).toBe('OCULTO');
      // A API aceita só as strings "true"/"false" em featured.
      expect(p.get('featured')).toBe('true');
      req.flush({ data: [], meta: { page: 2, perPage: 20, total: 0, totalPages: 0 } });
    });

    it('omite filtro vazio em vez de mandar chave sem valor', () => {
      // `category=` faria a API validar o enum contra string vazia e responder 400.
      api.listar({ page: 1, search: '', category: '', status: '' }).subscribe();

      const req = http.expectOne((r) => r.url === `${BASE}/products`);
      expect(req.request.params.has('category')).toBe(false);
      expect(req.request.params.has('status')).toBe(false);
      expect(req.request.params.has('search')).toBe(false);
      expect(req.request.params.get('page')).toBe('1');
      req.flush({ data: [], meta: { page: 1, perPage: 20, total: 0, totalPages: 0 } });
    });
  });

  it('cadastra com POST e devolve o produto criado', () => {
    const criado = produto();
    let recebido: Produto | undefined;
    api
      .criar({
        name: criado.name,
        category: criado.category,
        status: 'VISIVEL',
        description: criado.description,
        link: criado.link,
        featured: false,
        imageUrl: null,
      })
      .subscribe((p) => (recebido = p));

    const req = http.expectOne(`${BASE}/products`);
    expect(req.request.method).toBe('POST');
    // Status explícito: omitir criaria OCULTO no servidor.
    expect(req.request.body.status).toBe('VISIVEL');
    expect(req.request.body.imageUrl).toBeNull();
    req.flush(criado);
    expect(recebido).toEqual(criado);
  });

  it('atualiza com PATCH e só com os campos passados', () => {
    api.atualizar('p1', { status: 'OCULTO', featured: false }).subscribe();

    const req = http.expectOne(`${BASE}/products/p1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: 'OCULTO', featured: false });
    req.flush(produto({ status: 'OCULTO', statusLabel: 'Oculto' }));
  });

  it('remove com DELETE', () => {
    api.remover('p1').subscribe();
    const req = http.expectOne(`${BASE}/products/p1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'Produto removido.' });
  });

  it('busca as opções dos selects na API', () => {
    api.opcoes().subscribe();
    const req = http.expectOne(`${BASE}/products/options`);
    expect(req.request.method).toBe('GET');
    req.flush({ categories: [], statuses: [] });
  });

  describe('upload de imagem', () => {
    it('manda multipart no campo "file" e sem Content-Type nosso', () => {
      const arquivo = new File(['x'], 'foto.png', { type: 'image/png' });
      api.enviarImagem('p1', arquivo).subscribe();

      const req = http.expectOne(`${BASE}/products/p1/image`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body instanceof FormData).toBe(true);

      const corpo = req.request.body as FormData;
      // O nome do campo é exigido pelo contrato: qualquer outro é 400.
      expect(corpo.get('file')).toBe(arquivo);

      // Fixar Content-Type à mão apagaria o boundary que o browser calcula, e o
      // servidor não conseguiria separar as partes do multipart.
      expect(req.request.headers.has('Content-Type')).toBe(false);
      req.flush(produto({ imageUrl: '/uploads/products/abc.png' }));
    });
  });

  it('registra clique na rota pública', () => {
    api.registrarClique('p1').subscribe();
    const req = http.expectOne(`${BASE}/public/products/p1/click`);
    expect(req.request.method).toBe('POST');
    req.flush({ id: 'p1', clickCount: 7, link: 'https://ml.com/x' });
  });

  describe('urlDaImagem', () => {
    it('tira o prefixo de versão no caminho de upload', () => {
      // O arquivo é servido na RAIZ. Concatenar com a base daria
      // http://api.teste/api/v1/uploads/… e 404 em toda imagem do painel.
      expect(api.urlDaImagem('/uploads/products/abc.png')).toBe(
        'http://api.teste/uploads/products/abc.png',
      );
    });

    it('mantém URL de CDN como veio', () => {
      expect(api.urlDaImagem('https://cdn.exemplo.com/f.jpg')).toBe(
        'https://cdn.exemplo.com/f.jpg',
      );
      expect(api.urlDaImagem('HTTPS://CDN.EXEMPLO.COM/F.JPG')).toBe(
        'HTTPS://CDN.EXEMPLO.COM/F.JPG',
      );
    });

    it('devolve null quando não há imagem', () => {
      expect(api.urlDaImagem(null)).toBeNull();
      expect(api.urlDaImagem('')).toBeNull();
    });
  });
});
