/**
 * Contrato de produtos do auza-back, espelhado aqui (contrato v0.1.0, §4 a §6).
 *
 * Nomes de campo em inglês de propósito, como em auth.models.ts: é o que vem no
 * JSON. Traduzir criaria uma camada de-para para manter à mão.
 *
 * Duas coisas que o contrato pede explicitamente e que este arquivo respeita:
 *
 *  - os RÓTULOS vêm prontos da API (`categoryLabel`, `statusLabel`, e as listas
 *    de `GET /products/options`). O código serve para lógica e filtro; o rótulo,
 *    para a tela. Não existe de-para de categoria aqui;
 *  - `clickCount` é somente leitura. Só `POST /public/products/:id/click`
 *    altera, e o incremento é atômico no banco.
 */

export type CategoriaProduto =
  'AGRO' | 'COMUNICACAO_VISUAL' | 'IMPRESSAO_3D' | 'TEXTIL' | 'CALDEIRAS_MISTURADOR_INOX';

export type StatusProduto = 'VISIVEL' | 'OCULTO';

/** Produto como o PAINEL o vê. A vitrine omite status, clickCount e updatedAt. */
export interface Produto {
  readonly id: string;
  readonly name: string;
  readonly category: CategoriaProduto;
  readonly categoryLabel: string;
  readonly status: StatusProduto;
  readonly statusLabel: string;
  readonly description: string;
  /** URL http(s) absoluta (CDN) ou caminho `/uploads/…` da própria API. */
  readonly imageUrl: string | null;
  readonly link: string;
  readonly featured: boolean;
  readonly clickCount: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/**
 * Corpo de `POST /products`.
 *
 * `status` é obrigatório aqui, embora a API aceite omitir: omitido, ela cria
 * OCULTO. Deixar isso implícito no front esconderia a decisão de publicar ou não
 * — o formulário sempre manda o que está selecionado.
 */
export interface NovoProduto {
  readonly name: string;
  readonly category: CategoriaProduto;
  readonly status: StatusProduto;
  readonly description: string;
  readonly link: string;
  readonly featured: boolean;
  /** Só para imagem em CDN. Upload de arquivo é outra rota. */
  readonly imageUrl?: string | null;
}

/** `PATCH /products/:id` é parcial: mande só o que mudou. Corpo vazio → 400. */
export type EdicaoProduto = Partial<NovoProduto>;

export interface Opcao<T extends string> {
  readonly value: T;
  readonly label: string;
}

/** `GET /products/options` — é daqui que saem os selects do formulário. */
export interface OpcoesProduto {
  readonly categories: readonly Opcao<CategoriaProduto>[];
  readonly statuses: readonly Opcao<StatusProduto>[];
}

export interface MetaPagina {
  readonly page: number;
  readonly perPage: number;
  readonly total: number;
  /** 0 quando não há resultado — não 1. */
  readonly totalPages: number;
}

export interface Pagina<T> {
  readonly data: readonly T[];
  readonly meta: MetaPagina;
}

/** Campos aceitos em `sortBy`. Qualquer outro valor responde 400. */
export const ORDENACOES = ['createdAt', 'name', 'clickCount'] as const;
export type Ordenacao = (typeof ORDENACOES)[number];

export interface FiltroProdutos {
  readonly page?: number;
  /** 1 a 100. Acima de 100 a API responde 400. */
  readonly perPage?: number;
  readonly sortBy?: Ordenacao;
  readonly sortOrder?: 'asc' | 'desc';
  /** Busca por nome, 1 a 180 caracteres. */
  readonly search?: string;
  readonly category?: CategoriaProduto | '';
  /** Exclusivo do painel: a vitrine só devolve VISIVEL. */
  readonly status?: StatusProduto | '';
  readonly featured?: boolean;
}

/* ----------------------------------------------------------
   Regras de imagem (§6.1), para recusar antes de subir.

   A API recusa de todo jeito; validar aqui é só para o erro chegar na hora, sem
   o usuário esperar 5MB de upload para descobrir que o formato não serve.
   ---------------------------------------------------------- */
export const IMAGEM_TIPOS = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] as const;
export const IMAGEM_TAMANHO_MAX = 5 * 1024 * 1024;

/** Mensagem do problema, ou null se o arquivo serve. */
export function validarImagem(arquivo: File): string | null {
  if (!(IMAGEM_TIPOS as readonly string[]).includes(arquivo.type)) {
    return 'Formato não aceito. Use JPEG, PNG, WebP ou AVIF.';
  }
  if (arquivo.size > IMAGEM_TAMANHO_MAX) {
    const mb = (arquivo.size / 1024 / 1024).toFixed(1);
    return `Imagem de ${mb} MB. O limite é 5 MB.`;
  }
  return null;
}

/** Resposta de `POST /public/products/:id/click`: conta e devolve o destino. */
export interface CliqueRegistrado {
  readonly id: string;
  readonly clickCount: number;
  readonly link: string;
}
