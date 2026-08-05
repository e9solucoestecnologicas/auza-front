/**
 * Conteúdo da landing. Textos descritivos ainda são lorem ipsum — o copy
 * definitivo entra seção por seção depois.
 */

export interface Categoria {
  /** slug usado nas âncoras (#solucao-agro) e no filtro da vitrine */
  readonly id: string;
  /** nome curto exibido em eyebrow / tag / filtro */
  readonly nome: string;
  /** linha de produtos da categoria, mostrada no hero */
  readonly produtos: readonly string[];
  /** texto curto do slide do hero */
  readonly resumo: string;
  /** texto maior da seção de destaque */
  readonly descricao: string;
  /** nome do ícone no set do DS (ver src/app/ui/icon/icon.ts) */
  readonly icone: string;
  /**
   * Imagem da máquina, já recortada, para o hero usar como camada de fundo.
   * Opcional de propósito: quem não tem não ganha a camada, e o banner continua
   * de pé.
   *
   * Cada peça precisa de uma regra `.hero-peca--<id>` em _ds-surfaces.scss, com
   * a proporção do recorte e a máscara da silhueta. Nas fotos, a máscara é um
   * PNG separado (só alpha) e a cor vem em JPEG — foto em PNG de 24 bits custa
   * dez vezes mais bytes.
   */
  readonly imagem?: string;
  /**
   * Marca a imagem como FOTO, não recorte. Serve para as fotos em que o fundo
   * não é separável — produto branco sobre superfície branca, ou objeto saindo
   * pelas bordas do quadro. Em vez de forçar um recorte ruim, o hero as trata
   * como fotografia sobre a folha: emolduradas, com véu para o branco não
   * estourar o ink. Ver `.hero-peca--moldura`.
   */
  readonly fotoEmoldurada?: boolean;
}

export interface Produto {
  readonly nome: string;
  readonly categoriaId: string;
  readonly descricao: string;
}

export const CATEGORIAS: readonly Categoria[] = [
  {
    id: 'agro',
    nome: 'Agro',
    produtos: ['Mini Abatedouro', 'Pássaros', 'Frango'],
    resumo:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    descricao:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse.',
    icone: 'leaf',
    imagem: '/img/agro-escaldeira.png',
  },
  {
    id: 'comunicacao-visual',
    nome: 'Comunicação Visual',
    produtos: ['Dobradeira de Acrílico', 'Cortador XPS', 'EPS', 'EVA'],
    resumo:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere.',
    descricao:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae. Nulla facilisi morbi tempus iaculis urna id volutpat lacus laoreet non curabitur gravida. Arcu ac tortor dignissim convallis aenean et tortor.',
    icone: 'scissors',
    imagem: '/img/pecas/comunicacao-visual.jpg',
  },
  {
    id: 'impressao-3d',
    nome: 'Impressão 3D',
    produtos: ['Estufa de Filamento'],
    resumo:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent commodo cursus magna vel scelerisque nisl consectetur.',
    descricao:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent commodo cursus magna vel scelerisque nisl consectetur et. Cras mattis consectetur purus sit amet fermentum. Donec ullamcorper nulla non metus auctor fringilla, vestibulum id ligula porta felis euismod semper.',
    icone: 'box',
    imagem: '/img/pecas/impressao-3d.jpg',
    fotoEmoldurada: true,
  },
  {
    id: 'textil',
    nome: 'Têxtil',
    produtos: ['Cortador de Cintas', 'Fuxico'],
    resumo:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante venenatis dapibus posuere velit aliquet.',
    descricao:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante venenatis dapibus posuere velit aliquet. Maecenas sed diam eget risus varius blandit sit amet non magna. Aenean lacinia bibendum nulla sed consectetur, etiam porta sem malesuada magna mollis.',
    icone: 'shirt',
    imagem: '/img/pecas/textil.jpg',
    fotoEmoldurada: true,
  },
  {
    id: 'caldeiras',
    nome: 'Caldeiras & Misturador Inox',
    produtos: ['Misturadores', 'Caldeiras', 'Caldeira com Misturador Automático'],
    resumo:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur blandit tempus porttitor, nullam quis risus eget urna mollis.',
    descricao:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur blandit tempus porttitor. Nullam quis risus eget urna mollis ornare vel eu leo. Fusce dapibus tellus ac cursus commodo, tortor mauris condimentum nibh ut fermentum massa justo sit amet risus.',
    icone: 'flame',
    imagem: '/img/pecas/caldeiras.jpg',
  },
];

const LOREM_CURTO =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.';

export const PRODUTOS: readonly Produto[] = [
  { nome: 'Mini Abatedouro', categoriaId: 'agro', descricao: LOREM_CURTO },
  { nome: 'Abatedouro de Pássaros', categoriaId: 'agro', descricao: LOREM_CURTO },
  { nome: 'Abatedouro de Frango', categoriaId: 'agro', descricao: LOREM_CURTO },
  { nome: 'Depenadeira', categoriaId: 'agro', descricao: LOREM_CURTO },
  {
    nome: 'Dobradeira de Acrílico',
    categoriaId: 'comunicacao-visual',
    descricao: LOREM_CURTO,
  },
  { nome: 'Cortador de XPS', categoriaId: 'comunicacao-visual', descricao: LOREM_CURTO },
  { nome: 'Cortador de EPS', categoriaId: 'comunicacao-visual', descricao: LOREM_CURTO },
  { nome: 'Cortador de EVA', categoriaId: 'comunicacao-visual', descricao: LOREM_CURTO },
  { nome: 'Estufa de Filamento', categoriaId: 'impressao-3d', descricao: LOREM_CURTO },
  { nome: 'Estufa de Filamento Dupla', categoriaId: 'impressao-3d', descricao: LOREM_CURTO },
  { nome: 'Cortador de Cintas', categoriaId: 'textil', descricao: LOREM_CURTO },
  { nome: 'Máquina de Fuxico', categoriaId: 'textil', descricao: LOREM_CURTO },
  { nome: 'Misturador Inox', categoriaId: 'caldeiras', descricao: LOREM_CURTO },
  { nome: 'Caldeira Inox', categoriaId: 'caldeiras', descricao: LOREM_CURTO },
  {
    nome: 'Caldeira com Misturador Automático',
    categoriaId: 'caldeiras',
    descricao: LOREM_CURTO,
  },
];
