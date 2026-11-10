import type { CategoriaProduto } from '../../core/produtos/produto.models';

/**
 * Conteúdo da landing e da página de produtos.
 *
 * O copy definitivo já entrou em `descricao` (as cinco categorias) e em `resumo`
 * de Agro, Comunicação Visual, Caldeiras e Impressão 3D. Continuam com lorem, por
 * falta de texto enviado:
 *   - `resumo` da Têxtil (a frase curta do banner do hero);
 *   - `descricao` de cada PRODUTO, em PRODUTOS (os cartões da vitrine);
 *   - `comportamento` dos 11 produtos sem foto (ver LOREM_COMPORTAMENTO).
 *
 * ATENÇÃO ao `comportamento` dos quatro produtos que TÊM foto: ele foi escrito a
 * partir do que a própria foto mostra (painel, comandos, guias, estrutura), e não
 * de ficha técnica. É descrição do que se vê, não especificação — precisa ser
 * confirmado com a AUZA antes de ir para produção.
 */

/**
 * Um telefone em três formas, porque cada destino exige a sua: o que se lê na
 * tela, o `tel:` (E.164, com país) e o `wa.me` (só dígitos, sem `+`).
 *
 * Guardar as três juntas é o que impede o número de divergir entre a seção de
 * contato, o link de discagem e o botão flutuante — três lugares que precisam
 * apontar para o mesmo aparelho.
 */
export interface Telefone {
  readonly exibicao: string;
  readonly discagem: string;
  readonly whatsapp: string;
}

/**
 * Contato oficial da AUZA.
 *
 * FALTA DADO: o endereço da seção de contato e o CNPJ do rodapé continuam
 * placeholder — não vieram no material de referência.
 */
export const CONTATO = {
  /** Fixo do atendimento. É para cá que aponta o botão flutuante de WhatsApp. */
  atendimento: {
    exibicao: '(11) 2532-3679',
    discagem: '+551125323679',
    whatsapp: '551125323679',
  } satisfies Telefone,
  /** Celular — é o número que aparece com o selo do WhatsApp no material. */
  celular: {
    exibicao: '(11) 96124-4335',
    discagem: '+5511961244335',
    whatsapp: '5511961244335',
  } satisfies Telefone,
  email: 'contato@auza.com.br',
} as const;

/** Primeira frase da conversa, já preenchida para quem chega pelo site. */
const MENSAGEM_WHATSAPP =
  'Olá! Vim pelo site da AUZA e gostaria de falar com o atendimento sobre um equipamento.';

/**
 * Link de conversa do WhatsApp.
 *
 * `wa.me` e não `api.whatsapp.com`: é o encurtador oficial e o único que resolve
 * igual no app do celular e no WhatsApp Web, sem os parâmetros extras que a URL
 * de API exige. A mensagem vai codificada — acento e pontuação quebram a query
 * se forem cru.
 */
export function linkWhatsapp(telefone: Telefone, mensagem: string = MENSAGEM_WHATSAPP): string {
  return `https://wa.me/${telefone.whatsapp}?text=${encodeURIComponent(mensagem)}`;
}

export interface Categoria {
  /** slug usado nas âncoras (#solucao-agro) */
  readonly id: string;
  /**
   * Código da categoria na API (enum de `/public/products/categories`).
   *
   * É o elo entre esta cópia de marketing e o catálogo: a landing casa produto
   * com seção por ele. Não dá para derivar do `id` — 'caldeiras' viraria
   * CALDEIRAS, e o código é CALDEIRAS_MISTURADOR_INOX.
   */
  readonly codigo: CategoriaProduto;
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

/**
 * Uma foto do equipamento.
 *
 * `alt` é obrigatório e descreve o que aparece — não é o nome do produto, que
 * já está no título ao lado. Uma galeria de fotos sem alt é uma galeria vazia
 * para quem usa leitor de tela.
 */
export interface Foto {
  readonly src: string;
  readonly alt: string;
}

/**
 * SEM USO NA TELA desde que a vitrine, as seções e a /produtos passaram a ler o
 * catálogo da API (`/public/products`).
 *
 * Fica de pé por dois motivos, e não por esquecimento:
 *
 *  - é o único inventário das FOTOS que existem em `public/img/` — o `src` e o
 *    `alt` de cada uma. Serve de roteiro para subir essas imagens no cadastro do
 *    painel, uma a uma;
 *  - o `comportamento` de cada produto é texto escrito à mão que a API ainda não
 *    tem onde guardar (ela tem um campo de texto só, o `description`). Apagar
 *    aqui perderia o texto.
 *
 * Quando as fotos e os textos estiverem no banco, isto pode sair inteiro — junto
 * com a interface `Produto` e o tipo `Foto`, se a galeria já não precisar deles.
 */
export interface Produto {
  readonly nome: string;
  readonly categoriaId: string;
  /** Frase curta do cartão da vitrine. */
  readonly descricao: string;
  /**
   * Como o equipamento se comporta em operação: comandos, ajustes, o que o
   * operador faz. É o texto que a página /produtos abre em "Como funciona", e o
   * motivo de ela existir — a vitrine da home só tem espaço para a frase curta.
   */
  readonly comportamento: string;
  /**
   * Fotos do produto, na ordem de exibição — a primeira é a capa do cartão.
   * Ausente ou vazio cai no placeholder do DS (`media-ph`) com o ícone da
   * categoria, que é o estado de 11 dos 15 produtos hoje.
   *
   * Para acrescentar fotos, basta pôr o arquivo em `public/img/` e somar uma
   * entrada aqui — a galeria liga as miniaturas, as setas e o contador sozinha a
   * partir de duas fotos. Não use `public/img/pecas/*`: são recortes das MESMAS
   * fotos daqui, feitos para o hero, e entrariam na galeria como duplicata.
   *
   * As fotos originais são grandes (a da caldeira tem 2826x3150). Enquanto são
   * quatro, passa; ao encher o catálogo, vale gerar versões reduzidas — a
   * miniatura hoje baixa a foto inteira para exibir 80px.
   */
  readonly fotos?: readonly Foto[];
}

export const CATEGORIAS: readonly Categoria[] = [
  {
    id: 'agro',
    codigo: 'AGRO',
    nome: 'Agro',
    produtos: ['Mini Abatedouro', 'Pássaros', 'Frango'],
    resumo:
      'Equipamentos e soluções sob medida para o agronegócio, de mini abatedouros a sistemas automatizados para criação de aves e pássaros.',
    descricao:
      'Oferecemos soluções completas em engenharia para o agronegócio, atendendo desde pequenos produtores a estruturas de grande porte. Desenvolvemos mini abatedouros e sistemas inteligentes para a criação de frangos e pássaros, garantindo o padrão de qualidade e a segurança que sua operação precisa.',
    icone: 'leaf',
    imagem: '/img/agro-escaldeira.png',
  },
  {
    id: 'comunicacao-visual',
    codigo: 'COMUNICACAO_VISUAL',
    nome: 'Comunicação Visual',
    produtos: ['Dobradeira de Acrílico', 'Cortador XPS', 'EPS', 'EVA'],
    resumo:
      'Dobradeiras de acrílico e cortadores para EPS, EVA e XPS voltados à alta performance na comunicação visual.',
    descricao:
      'Oferecemos tecnologia de ponta para elevar o patamar produtivo no setor de comunicação visual. Unindo engenharia e precisão, disponibilizamos cortadores de alta performance para EPS, EVA e XPS, além de dobradeiras de acrílico estruturadas para garantir agilidade, otimização de insumos e acabamentos superiores em múltiplos materiais.',
    icone: 'scissors',
    imagem: '/img/pecas/comunicacao-visual.jpg',
  },
  {
    id: 'impressao-3d',
    codigo: 'IMPRESSAO_3D',
    nome: 'Impressão 3D',
    produtos: ['Estufa de Filamento'],
    resumo:
      'Secadoras e estufas de filamento com controle de temperatura, para manter o material seco e o acabamento constante na impressão 3D.',
    descricao:
      'Oferecemos tecnologia de ponta para elevar o patamar produtivo no setor de fabricação digital. Unindo engenharia e precisão, disponibilizamos impressoras 3D estruturadas para garantir agilidade, otimização de insumos e acabamentos superiores em múltiplos materiais.',
    icone: 'box',
    imagem: '/img/pecas/secadora-recorte.webp',
  },
  {
    id: 'textil',
    codigo: 'TEXTIL',
    nome: 'Têxtil',
    produtos: ['Cortador de Cintas', 'Fuxico'],
    resumo:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante venenatis dapibus posuere velit aliquet.',
    descricao:
      'Unindo engenharia e precisão, disponibilizamos cortadores de cintas e equipamentos especializados para fuxico estruturados para garantir agilidade, otimização de insumos e acabamentos superiores em múltiplos tecidos e aviamentos.',
    icone: 'shirt',
    imagem: '/img/pecas/textil-mesa.jpg',
  },
  {
    id: 'caldeiras',
    codigo: 'CALDEIRAS_MISTURADOR_INOX',
    nome: 'Caldeiras & Misturador Inox',
    produtos: ['Misturadores', 'Caldeiras', 'Caldeira com Misturador Automático'],
    resumo:
      'Linha completa de caldeiras, misturadores em inox e equipamentos combinados com automação para processos industriais.',
    descricao:
      'Desenvolvida para atender às rigorosas exigências do mercado industrial, nossa engenharia entrega equipamentos robustos para transformações de alta precisão. Combinamos misturadores especializados com caldeiras e sistemas de mistura automática, assegurando velocidade de entrega e padrão de excelência em cada etapa.',
    icone: 'flame',
    imagem: '/img/pecas/caldeiras.jpg',
  },
];

const LOREM_CURTO =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.';

/**
 * Placeholder do "Como funciona" enquanto o descritivo de operação não chega.
 * Propositalmente lorem, e não um texto plausível: descrever o comportamento de
 * uma máquina industrial por dedução é o tipo de erro que só aparece depois de
 * publicado.
 */
const LOREM_COMPORTAMENTO =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent commodo cursus magna vel ' +
  'scelerisque nisl consectetur et. Integer posuere erat a ante venenatis dapibus posuere velit ' +
  'aliquet, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

export const PRODUTOS: readonly Produto[] = [
  {
    nome: 'Mini Abatedouro',
    categoriaId: 'agro',
    descricao: LOREM_CURTO,
    comportamento: LOREM_COMPORTAMENTO,
  },
  {
    nome: 'Abatedouro de Pássaros',
    categoriaId: 'agro',
    descricao: LOREM_CURTO,
    comportamento: LOREM_COMPORTAMENTO,
  },
  {
    nome: 'Abatedouro de Frango',
    categoriaId: 'agro',
    descricao: LOREM_CURTO,
    comportamento: LOREM_COMPORTAMENTO,
  },
  {
    nome: 'Depenadeira',
    categoriaId: 'agro',
    descricao: LOREM_CURTO,
    comportamento: LOREM_COMPORTAMENTO,
  },
  {
    nome: 'Dobradeira de Acrílico',
    categoriaId: 'comunicacao-visual',
    descricao: LOREM_CURTO,
    comportamento:
      'Mesa plana com uma resistência linear embutida na faixa de dobra: a chapa apoia sobre a ' +
      'mesa, aquece só na linha e é dobrada ali. A guia de alumínio corre paralela à resistência ' +
      'e trava por manípulos nas duas pontas, o que repete a mesma distância de dobra peça após ' +
      'peça. O painel tem liga/desliga, ajuste de potência e porta-fusível — é pela potência que ' +
      'se acerta o aquecimento à espessura do acrílico.',
    fotos: [
      {
        src: '/img/dobrador-acrilico.jpg',
        alt: 'Dobradeira de acrílico da AUZA em vista diagonal: mesa branca com a resistência linear ao centro, guia de alumínio paralela travada por manípulos e painel preto com chave liga/desliga, ajuste de potência e porta-fusível.',
      },
    ],
  },
  {
    nome: 'Cortador de XPS',
    categoriaId: 'comunicacao-visual',
    descricao: LOREM_CURTO,
    comportamento: LOREM_COMPORTAMENTO,
  },
  {
    nome: 'Cortador de EPS',
    categoriaId: 'comunicacao-visual',
    descricao: LOREM_CURTO,
    comportamento: LOREM_COMPORTAMENTO,
  },
  {
    nome: 'Cortador de EVA',
    categoriaId: 'comunicacao-visual',
    descricao: LOREM_CURTO,
    comportamento: LOREM_COMPORTAMENTO,
  },
  {
    nome: 'Estufa de Filamento',
    categoriaId: 'impressao-3d',
    descricao: LOREM_CURTO,
    comportamento:
      'Câmara fechada com gaveta sobre trilhos: o filamento fica em bandejas teladas, que deixam ' +
      'o ar circular por todos os lados do rolo. O controlador digital no painel frontal mostra a ' +
      'temperatura da câmara e recebe o valor de trabalho, e aquecedor e iluminação têm ' +
      'acionamento independente — dá para conferir o rolo pela tampa transparente sem abrir a ' +
      'gaveta nem interromper o aquecimento.',
    fotos: [
      {
        src: '/img/estufa.jpg',
        alt: 'Estufa de filamento da AUZA com a gaveta aberta, mostrando as bandejas teladas; no painel frontal, o controlador digital marca 29.8 °C ao lado dos acionamentos de aquecedor e iluminação.',
      },
    ],
  },
  {
    nome: 'Estufa de Filamento Dupla',
    categoriaId: 'impressao-3d',
    descricao: LOREM_CURTO,
    comportamento: LOREM_COMPORTAMENTO,
  },
  {
    nome: 'Cortador de Cintas',
    categoriaId: 'textil',
    descricao: LOREM_CURTO,
    comportamento:
      'Mesa de corte com fio tensionado na coluna e réguas graduadas nos dois eixos. A guia de ' +
      'alumínio trava por manípulo na medida escolhida e passa a ser o batente: a cinta encosta ' +
      'nela e sai na mesma largura em toda a tiragem, sem remarcar peça por peça.',
    fotos: [
      {
        src: '/img/cortador-cinta.jpg',
        alt: 'Mesa do cortador de cintas da AUZA vista de cima: tampo branco com o logotipo gravado, réguas graduadas em dois eixos, guia de alumínio travada por manípulo e o fio de corte tensionado na coluna.',
      },
    ],
  },
  {
    nome: 'Máquina de Fuxico',
    categoriaId: 'textil',
    descricao: LOREM_CURTO,
    comportamento: LOREM_COMPORTAMENTO,
  },
  {
    nome: 'Misturador Inox',
    categoriaId: 'caldeiras',
    descricao: LOREM_CURTO,
    comportamento: LOREM_COMPORTAMENTO,
  },
  {
    nome: 'Caldeira Inox',
    categoriaId: 'caldeiras',
    descricao: LOREM_CURTO,
    comportamento:
      'Corpo em inox de fundo cônico montado sobre estrutura própria, com registro de esfera na ' +
      'parte baixa: o produto sai pelo ponto mais fundo do tanque, o que esvazia e limpa sem ' +
      'tombar o corpo. A tampa transparente é articulada e as duas alças laterais são fixas à ' +
      'estrutura.',
    fotos: [
      {
        src: '/img/caldeira.jpg',
        alt: 'Caldeira em inox da AUZA sobre estrutura de pés, com tampa transparente articulada, duas alças laterais e registro de esfera vermelho na saída do fundo cônico.',
      },
    ],
  },
  {
    nome: 'Caldeira com Misturador Automático',
    categoriaId: 'caldeiras',
    descricao: LOREM_CURTO,
    comportamento: LOREM_COMPORTAMENTO,
  },
];
