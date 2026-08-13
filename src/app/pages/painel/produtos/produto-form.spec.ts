import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { API_BASE_URL } from '../../../core/auth/api.config';
import { validarImagem } from '../../../core/produtos/produto.models';
import type { Produto } from '../../../core/produtos/produto.models';
import { ProdutoForm } from './produto-form';

const BASE = 'http://api.teste/api/v1';

const OPCOES = {
  categories: [
    { value: 'AGRO', label: 'Agro' },
    { value: 'CALDEIRAS_MISTURADOR_INOX', label: 'Caldeiras e Misturador Inox' },
  ],
  statuses: [
    { value: 'VISIVEL', label: 'Visível' },
    { value: 'OCULTO', label: 'Oculto' },
  ],
};

function produto(extra: Partial<Produto> = {}): Produto {
  return {
    id: 'p1',
    name: 'Misturador Inox 200L',
    category: 'CALDEIRAS_MISTURADOR_INOX',
    categoryLabel: 'Caldeiras e Misturador Inox',
    status: 'OCULTO',
    statusLabel: 'Oculto',
    description: 'Misturador industrial em inox 304 com pás removíveis.',
    imageUrl: null,
    link: 'https://www.mercadolivre.com.br/exemplo',
    featured: false,
    clickCount: 12,
    createdAt: '2026-08-12T14:26:39.251Z',
    updatedAt: '2026-08-12T17:49:27.926Z',
    ...extra,
  };
}

/** Preenche o formulário como o usuário faria. */
function preencher(fixture: ComponentFixture<ProdutoForm>, valores: Record<string, unknown>): void {
  const form = (
    fixture.componentInstance as unknown as { form: { patchValue: (v: unknown) => void } }
  ).form;
  form.patchValue(valores);
}

function salvar(fixture: ComponentFixture<ProdutoForm>): void {
  (fixture.componentInstance as unknown as { salvar: () => void }).salvar();
}

describe('ProdutoForm', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ProdutoForm],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  /** Cria a tela e responde às opções, que o construtor sempre busca. */
  async function abrir(id = ''): Promise<ComponentFixture<ProdutoForm>> {
    const fixture = TestBed.createComponent(ProdutoForm);
    fixture.componentRef.setInput('id', id);
    fixture.detectChanges();
    http.expectOne(`${BASE}/products/options`).flush(OPCOES);
    if (id) {
      http.expectOne(`${BASE}/products/${id}`).flush(produto());
    }
    await fixture.whenStable();
    return fixture;
  }

  it('busca as opções dos selects em vez de usar lista fixa', async () => {
    const fixture = await abrir();
    const opcoes = (fixture.componentInstance as unknown as { opcoes: () => unknown }).opcoes();
    expect(opcoes).toEqual(OPCOES);
    http.verify();
  });

  it('cadastra e, havendo arquivo, sobe a imagem no produto criado', async () => {
    const fixture = await abrir();
    preencher(fixture, {
      name: 'Caldeira Inox 100L',
      category: 'CALDEIRAS_MISTURADOR_INOX',
      status: 'VISIVEL',
      description: 'Caldeira em inox com controle de temperatura.',
      link: 'https://www.mercadolivre.com.br/caldeira',
      featured: true,
    });

    const arquivo = new File(['x'], 'caldeira.png', { type: 'image/png' });
    (fixture.componentInstance as unknown as { arquivo: { set: (f: File) => void } }).arquivo.set(
      arquivo,
    );

    salvar(fixture);

    // 1) cria o produto…
    const criacao = http.expectOne(`${BASE}/products`);
    expect(criacao.request.method).toBe('POST');
    expect(criacao.request.body.status).toBe('VISIVEL');
    criacao.flush(produto({ id: 'novo-1', status: 'VISIVEL', statusLabel: 'Visível' }));

    // 2) …e só então sobe a imagem, porque a rota de upload precisa do id.
    const upload = http.expectOne(`${BASE}/products/novo-1/image`);
    expect(upload.request.method).toBe('POST');
    expect((upload.request.body as FormData).get('file')).toBe(arquivo);
    upload.flush(produto({ id: 'novo-1', imageUrl: '/uploads/products/x.png' }));

    http.verify();
  });

  it('na edição manda só o campo que mudou', async () => {
    const fixture = await abrir('p1');
    preencher(fixture, { status: 'VISIVEL' });
    salvar(fixture);

    const req = http.expectOne(`${BASE}/products/p1`);
    expect(req.request.method).toBe('PATCH');
    // Nada além do status: mandar o resto sobrescreveria alteração de outra pessoa.
    expect(req.request.body).toEqual({ status: 'VISIVEL' });
    req.flush(produto({ status: 'VISIVEL', statusLabel: 'Visível' }));
    http.verify();
  });

  it('não chama a API quando nada mudou (corpo vazio responde 400)', async () => {
    const fixture = await abrir('p1');
    salvar(fixture);
    // Nenhuma requisição pendente: o PATCH sem campos seria recusado pela API.
    http.verify();
  });

  it('não apaga a imagem enviada por upload ao salvar sem tocar na URL', async () => {
    // Produto com imagem de upload: o campo de URL externa fica vazio de propósito,
    // e esse vazio não pode virar `imageUrl: null` no PATCH.
    const fixture = TestBed.createComponent(ProdutoForm);
    fixture.componentRef.setInput('id', 'p1');
    fixture.detectChanges();
    http.expectOne(`${BASE}/products/options`).flush(OPCOES);
    http.expectOne(`${BASE}/products/p1`).flush(produto({ imageUrl: '/uploads/products/x.png' }));
    await fixture.whenStable();

    preencher(fixture, { name: 'Nome novo' });
    salvar(fixture);

    const req = http.expectOne(`${BASE}/products/p1`);
    expect(req.request.body).toEqual({ name: 'Nome novo' });
    expect('imageUrl' in req.request.body).toBe(false);
    req.flush(produto({ name: 'Nome novo', imageUrl: '/uploads/products/x.png' }));
    http.verify();
  });

  it('pinta o erro de validação no campo que a API apontou', async () => {
    const fixture = await abrir();
    preencher(fixture, {
      name: 'Ab',
      category: 'AGRO',
      status: 'VISIVEL',
      description: 'Descrição suficientemente longa.',
      link: 'https://www.mercadolivre.com.br/x',
    });
    salvar(fixture);

    http.expectOne(`${BASE}/products`).flush(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Dados enviados são inválidos.',
          details: [{ field: 'name', message: 'Nome deve ter ao menos 2 caracteres' }],
        },
      },
      { status: 400, statusText: 'Bad Request' },
    );
    await fixture.whenStable();

    const alvo = fixture.componentInstance as unknown as {
      erroDoCampo: (c: string) => string | null;
      erro: () => string | null;
    };
    expect(alvo.erroDoCampo('name')).toBe('Nome deve ter ao menos 2 caracteres');
    expect(alvo.erro()).toBe('Dados enviados são inválidos.');
    http.verify();
  });

  it('recusa o arquivo localmente antes de subir', () => {
    // As regras são do contrato (§6.1); validar aqui evita esperar o upload de
    // 5 MB para receber o erro.
    const pdf = new File(['x'], 'manual.pdf', { type: 'application/pdf' });
    expect(validarImagem(pdf)).toContain('Formato não aceito');

    const grande = new File([new Uint8Array(6 * 1024 * 1024)], 'foto.png', { type: 'image/png' });
    expect(validarImagem(grande)).toContain('limite é 5 MB');

    const ok = new File(['x'], 'foto.webp', { type: 'image/webp' });
    expect(validarImagem(ok)).toBeNull();
  });
});
