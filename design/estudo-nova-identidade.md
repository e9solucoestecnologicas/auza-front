# Estudo — Nova identidade visual AUZA

Branch: `feat/nova-identidade-visual` · Fonte: `../Identidade Visual Nova/`

## Andamento

**Plano A (re-skin) concluído em 2026-11-07.** Decisões do cliente: só
Montserrat (a Geist Mono saiu), tons de apoio aprovados, SVG e versão para fundo
claro gerados aqui, desenho do Sobre recolorido, protótipos `/landing*`
removidos.

- Logo: `public/img/marca/` com `logo-{horizontal,vertical}-{claro,escuro}.svg`,
  `simbolo.svg` e `logo-auza.png` (JSON-LD). Vetorizados com potrace a partir do
  PNG preto de 2773 px; diagramação horizontal tirada da Submarca. Degradê do
  símbolo: `#fc6b1e` → `#fa8c3c` (amostrado do `Símbolo.png`).
- `app-logo` ganhou a entrada `forma` (`horizontal` | `vertical` | `simbolo`).
- Montserrat variável (300–700) self-hosted em `public/fonts/`, com preload.
- Favicon, ícones PWA e `og-auza.jpg` refeitos a partir dos SVGs.
- `auza-fundo.jpg` recolorido para a reta marinho→gelo, preservando a luminância
  (o sépia original ficou só no histórico do git).
- Paleta trocada em `_ds-brand.scss` e `_ds-surfaces.scss` (seção 4).
  `btn-primary` agora é laranja com texto marinho nos dois temas, e os CTAs do
  hero e do contato passaram a usá-lo.

## 1. O que a identidade nova entrega

**Ficha técnica**

| Papel | Cor | Observação |
| --- | --- | --- |
| Primária (fundo) | `#021d36`, azul-marinho | RGB 2/29/54 |
| Destaque | `#fa8c3c`, laranja | RGB 250/140/60 |
| Neutra | `#ffffff` | — |

- No logo o laranja é **degradê**, não chapado: começa num laranja mais fechado à
  esquerda (≈ `#f96a1e`) e termina no `#fa8c3c` à direita. A ficha só traz o tom claro.
  Vale confirmar com o designer os dois pontos exatos.
- **Tipografia:** Montserrat, só ela. Bold para títulos e Regular para texto. O
  "ENGENHARIA E AUTOMAÇÃO" do logo usa Montserrat Regular com espaçamento largo, e
  esse traço serve de referência para os rótulos (eyebrows) do site.
- **Linguagem:** o símbolo é feito de lâminas diagonais paralelas (um "A" que também
  lembra um telhado ou uma estrutura). Daí saem motivos gráficos que a marca permite:
  cortes diagonais, faixas inclinadas e o ângulo do "A" como divisor de seção.
- A fachada da ficha mostra o uso principal: **marinho dominante, laranja pontual,
  branco no texto**.

**Arquivos (todos PNG com transparência, nenhum vetor)**

| Peça | Arquivo | Tamanho | Fundo |
| --- | --- | --- | --- |
| Logo principal (vertical) | `Logo Principal.png` | 4500² | marinho chapado |
| | `… Marca D_água 1` | 2739×2432 | transparente, texto **branco** e símbolo laranja |
| | `… 2 (preto)` / `3 (branco)` | ~2770×2430 | transparente, monocromático |
| Submarca (horizontal) | `Submarca.png` | 1080² | marinho chapado |
| | `… Marca D_água 1/2/3` | **707×186** | transparente |
| Símbolo | `Símbolo.png` | 1080² | marinho chapado |
| | `… Marca D_água 1/2/3` | ~611×429 | transparente |

"Marca d'água", nesses arquivos, quer dizer **versão sem fundo**. São elas que vão
para o site.

**Lacunas nos arquivos (pedir ao designer):**
1. **Não existe versão para fundo claro.** A versão colorida tem texto branco. Para
   fundo branco só há a preta ou a branca, as duas monocromáticas. Falta a versão
   *texto marinho + símbolo laranja*. Se o designer não mandar, dá para gerar
   recolorindo o branco da versão 1 para `#021d36`.
2. **Nenhum SVG.** Com SVG o logo fica nítido em qualquer tamanho, pesa menos e
   aceita mudança de cor por CSS. A submarca sem fundo tem só 707 px de largura:
   serve no cabeçalho (~190 px em tela 2x), mas fica no limite.
3. Valores exatos do degradê (ver acima).

## 2. Contraste: o que pode e o que não pode

Calculado pelo WCAG (mínimo de 4,5:1 para texto normal e 3:1 para texto grande):

| Combinação | Contraste | Uso |
| --- | --- | --- |
| Branco sobre marinho | **17,1:1** | texto corrido em seção escura ✔ |
| Laranja sobre marinho | **7,2:1** | destaque, links e títulos em seção escura ✔ |
| Marinho sobre laranja | **7,2:1** | **texto do botão primário** ✔ |
| Marinho sobre branco | 17,1:1 | texto em seção clara ✔ |
| Laranja sobre branco | **2,4:1** | ✘ reprovado para texto; só ornamento, ícone grande ou fio |
| Branco sobre laranja | **2,4:1** | ✘ botão laranja com texto branco **reprova** |

Consequência direta: o botão laranja leva **texto marinho**, e não branco. Em seção
clara, o destaque de texto é marinho, e o laranja entra como fio, sublinhado, ícone ou
fundo de selo. Se for preciso texto alaranjado sobre branco, usar um tom escurecido
(≈ `#c2560f`, ~4,6:1), mas isso cria um tom que a ficha não tem e precisa do aval do
cliente.

## 3. Como o front está hoje

A boa notícia é que a cor está **centralizada**. Os templates usam a escala neutra do
Tailwind (`bg-white`, `text-neutral-900`, `border-neutral-200`… ~600 ocorrências), e
dois arquivos remapeiam essas classes para o marrom/marfim sob `.ds-root`:

- `src/styles/_ds-brand.scss`: paleta, overrides da escala neutra, inputs (37 `!important`)
- `src/styles/_ds-surfaces.scss`: camada semântica (`text-ink`, `text-muted`,
  `surface`, `btn-primary`, `.on-dark`) e peças da landing (hero, parallax, vitrine,
  abas, selos)

Hex fixo nos templates é quase nulo: só comentários, o verde do WhatsApp (que fica) e
um `decoration-[rgba(254,235,202,…)]` no rodapé.

**Fora dos tokens, e com troca obrigatória:**

| Item | Onde | Situação |
| --- | --- | --- |
| Componente de logo | `src/app/ui/logo/logo.ts` | aponta para `logo-fundo-claro/escuro.png` (logo antigo) |
| Uso do logo | hero, footer, login, painel-layout, produtos | trocar a variante conforme o fundo |
| Fontes | `_ds-fonts.scss` + `public/ds-assets/*.woff2` | Geist, Geist Mono e Inter. Entra Montserrat self-hosted |
| `font-geist-mono` | rótulos, botões, nav, inputs | linguagem "mono" do DS antigo; decidir se vira Montserrat espaçada |
| Favicon / ícones PWA | `public/favicon.ico`, `icon-192/512`, `apple-touch-icon` | recortados do logo antigo; refazer a partir do símbolo |
| Imagem OG | `public/og-auza.jpg` | logo antigo em fundo marrom; refazer 1200×630 em marinho |
| `theme-color` | `src/index.html:84` | `#4a1d06` → `#021d36` |
| Fundo do "Sobre" | `public/img/auza-fundo.jpg` | desenho técnico em sépia; não combina com marinho (recolorir para azul ou trocar) |
| Página `/design-system` | `pages/design-system/*` | documenta a paleta antiga (amostras e textos com os hex) |
| Login | `login.html` | usa `#171717` no lugar da marca (ver comentário no arquivo) |
| Hero: textura, véu, foco de luz | `_ds-surfaces.scss` | gradientes e sombras em `rgba(74,29,6,…)`, ~40 ocorrências |
| Cores de estado | `text-red-700`, `bg-green-50`… | ficam, mas convém conferir contra o marinho |

Rotas `/landing`, `/landing2`, `/landing3` e `src/app/sections/*` são protótipos
antigos, fora da home atual. **Proposta: deixar fora do escopo** (ou removê-las).

## 4. Proposta de mapeamento de tokens

Marinho no papel do antigo "ink" e laranja como cor nova de ação/destaque:

| Token atual | Antes | Depois |
| --- | --- | --- |
| `--brand-ink` (primária) | `#4a1d06` | `#021d36` |
| `--brand-700` | `#6f3d20` | `#0b2f52` (marinho um passo acima, para hover e camadas) |
| `--brand-500` | `#a17a58` | `#5b7189` (marinho dessaturado, para texto suave) |
| `--brand-sand` (secundária) | `#feebca` | `#f3f6f9` (branco-gelo, para seção clara alternada) |
| `--brand-ivory` (card) | `#fff8ea` | `#ffffff` |
| **novo** `--brand-accent` | — | `#fa8c3c` |
| **novo** `--brand-accent-deep` | — | `#f96a1e` (início do degradê, hover do botão) |
| `--brand-error` | `#b3402a` | revisar: vermelho perto do laranja confunde; sugerir `#d64545` |

O branco-gelo e os dois marinhos intermediários **não estão na ficha**. Saem dos tons
oficiais e servem para dar hierarquia (só marinho + branco + laranja chapados deixam o
painel e os formulários sem camadas). Precisam do aval do cliente.

**Por que reescrever, e não só trocar hex:** hoje a camada semântica tem um papel só
(`ink`) que inverte com `.on-dark`. A marca nova tem um segundo papel, a ação em
laranja, que **não inverte** (é laranja nos dois fundos e muda só a cor do texto
dentro dele). O certo é:
1. Passar a paleta para **variáveis CSS** (`--c-ink`, `--c-muted`, `--c-surface`,
   `--c-accent`, `--c-on-accent`…) definidas em `.ds-root` e redefinidas em `.on-dark`.
   As ~90 regras com hex repetido viram leitura de variável, e trocar a marca de novo
   passa a ser editar um bloco só.
2. Opcionalmente, registrar essas variáveis no `tailwind.config.js` (`colors.brand.*`)
   para escrever `bg-brand-accent` direto, em vez de depender do remap da escala
   neutra com `!important`. É a correção estrutural; pode ficar para uma segunda etapa.

## 5. Escopo: re-skin ou redesenho?

A decisão maior do projeto é o tamanho do trabalho:

- **A. Re-skin (trocar a pele):** cores, fonte, logo, favicon/OG, fundo do Sobre. Mantém
  estrutura, seções, carrossel do hero, parallax e vitrine. Quase tudo concentrado em
  ~5 arquivos de estilo e no componente de logo. Rápido e de baixo risco.
- **B. Re-skin + linguagem da marca:** A, mais os motivos do símbolo (cortes
  diagonais entre seções, faixa laranja inclinada, eyebrows em Montserrat espaçada como
  no logo, botões com canto chanfrado em vez de arredondado). A estrutura das seções
  continua.
- **C. Redesenho de layout:** A + B + nova composição das seções (hero, sobre,
  destaques, vitrine, contato, rodapé) e do painel. Pede referência visual ou mockup
  antes de codar.

## 6. Plano de execução sugerido (vale para A e B; C entra entre as etapas 3 e 4)

1. **Assets:** gerar a versão do logo para fundo claro; copiar as versões sem fundo
   para `public/img/marca/` com nomes estáveis (`logo-vertical-escuro.png`,
   `logo-horizontal-claro.png`, `simbolo.png`…); converter para WebP; atualizar
   `ARQUIVOS` no `logo.ts` com as dimensões reais e criar a variante `simbolo`.
2. **Fonte:** baixar Montserrat (400/500/600/700, latin + latin-ext) em woff2 para
   `public/fonts/`, criar `_ds-fonts.scss` novo e retirar Geist/Inter (e Geist Mono, se
   aprovado). Trocar `--font-sans` e decidir o destino de `.font-geist-mono`.
3. **Tokens:** reescrever `_ds-brand.scss` e o topo de `_ds-surfaces.scss` com as
   variáveis da seção 4; criar `btn-accent`; varrer os `rgba(74,29,6,…)` e
   `rgba(254,235,202,…)` restantes (hero, parallax, vitrine, abas, esqueleto).
4. **Peças:** fundo do Sobre, hero (véu, foco de luz e varredura em marinho/laranja),
   rodapé, login (tirar o `#171717`), painel e catálogo `/produtos`.
5. **Metadados:** favicon, ícones PWA, `og-auza.jpg`, `theme-color`, sitemap sem
   alteração.
6. **Página `/design-system`:** atualizar amostras e textos, que viram a referência
   viva da nova marca.
7. **Verificação:** `ng build` e `ng test` (há specs que conferem `src` de imagem e
   classes do login e da home), conferência visual de cada rota em desktop e celular, e
   checagem de contraste nos estados (hover, foco, erro, desabilitado).

## 7. Perguntas respondidas (2026-11-07)

1. Escopo: começar pelo **A**; o cliente revisa e direciona o resto.
2. Só Montserrat, como manda a ficha. A Geist Mono saiu.
3. Tons de apoio aprovados.
4. SVG e versão para fundo claro gerados aqui.
5. Desenho do Sobre recolorido para azul.
6. `/landing*` e `src/app/sections/*` removidos.

## 8. Próximos passos (retomar daqui)

Nada abaixo começa sem o cliente pedir. A ordem sugerida é a da lista.

### 8.1 Pendências do plano A (pequenas)

- [x] **Commit do plano A** (`f8efef0`, 2026-11-10). `.claude/settings.local.json`
  fica fora de todos os commits: aparece modificado, mas não é deste trabalho.
- [x] **Painel conferido** (2026-11-10) com sessão simulada no navegador de teste
  (tokens falsos no `localStorage` + respostas falsas para `/auth/*`; produtos da
  rota pública real). Resumo, lista e formulário corretos na marca.
  Sugestão em aberto: o "Sair" ficou laranja, com o mesmo peso do "Cadastrar
  produto" — rebaixar para botão de contorno?
- [x] **Bug achado e corrigido** (`40b4fec`): a peça de Comunicação Visual do hero
  vazava o fundo marrom do estúdio (máscara esticada em `100% 100%` contra imagem
  em `object-fit: contain`).
- [ ] **Revisão do cliente** nas telas: home, login, `/produtos`, celular, painel.
- [ ] Teste `app.spec.ts` ("should render title") já falhava antes do rebrand (e há
  8 erros de rota soltos no `produto-form.spec`). Não é do rebrand; corrigir à parte
  se ele quiser.
- [ ] Opcional: SVGs do logo têm ~14 KB cada (traço do potrace). Dá para enxugar
  com SVGO, se pesar.
- [ ] Opcional: pedir ao designer os SVGs originais. Os nossos são vetorização do
  PNG e estão fiéis, mas o original é sempre melhor.

### 8.2 Plano B — linguagem gráfica da marca

**Feito em 2026-11-10** (`5f558cd`), tudo em `src/styles/_ds-marca.scss` (um bloco
por motivo; apagar o bloco desliga o motivo). O ângulo que se repete é o das pernas
do símbolo, ~57° da horizontal.

- [x] **Rótulos** (`.eyebrow`): caixa alta espaçada (0.24em) com uma lâmina laranja
  inclinada antes do texto. Aplicado nos rótulos de seção da home, do catálogo e do
  painel; os cinzas `text-neutral-400` (2,8:1) viraram `text-subtle` (4,9:1).
- [x] **Corte diagonal** (`.corte-base`, `.corte-topo`): base do hero e do cabeçalho
  do catálogo, topo do rodapé, paralelos. A seção cortada sobrepõe a vizinha e o
  triângulo mostra a vizinha de verdade (o parallax do Sobre continua intacto).
  Exige que a vizinha tenha ≥ 5rem de padding do lado do corte — por isso o topo do
  catálogo foi para `pt-24 sm:pt-28`.
- [x] **Fio laranja** acompanhando o corte (`.corte-base--fio`) no hero e no
  catálogo. O rodapé ficou sem fio, de propósito; dá para pôr se ele quiser.
- [x] **Botão chanfrado**: só o `btn-primary` (o de contorno perderia a borda no
  canto). O foco virou anel interno marinho, porque o `clip-path` cortaria o externo.
- [x] **Marca d'água** do símbolo (`simbolo-marca-dagua.svg`, branco a 4,5%) no
  hero, login e catálogo (via `.hero-textura`) e no rodapé (`.com-marca-dagua`).
- [x] **Marcadores** de lista das soluções em laranja (`.text-accent`). O ✓ ficou;
  trocar por um chevron inclinado ainda é opção.
- [ ] Documentar os motivos na página `/design-system`.
- [ ] Revisão do cliente; ajustar o que ele pedir.

### 8.3 Plano C — redesenho de layout

**Protótipo em 2026-11-10, rota `/home-v2`** (a `/home` segue intacta). Decisões do
cliente: referência **Monolith Architecture + AEX**; escopo **Soluções, Sobre e
Vitrine** (hero, contato e rodapé ficam como estão); validação por protótipo numa
rota nova. Código em `src/app/pages/home-v2/`, estilos em `src/styles/_ds-v2.scss`
(prefixo `v2-`), rota bloqueada no `robots.txt`.

- [x] **Sobre** (Monolith): marinho, desenho técnico em planta
  (`auza-fundo-noturno.jpg`, mesmo parallax), título com palavra em laranja,
  citação com a lâmina como aspas, e cartões das três disciplinas (mecânica,
  elétrica, automação). **Texto dos cartões é provisório** — validar.
- [x] **Soluções** (AEX "sectors"): cinco painéis lado a lado a partir de 1280px, o
  ativo abre (hover, clique ou teclado) e os fechados mostram o nome na vertical;
  abaixo disso, acordeão empilhado. Imagem = peça do hero sobre marinho. Régua de
  números embaixo (5 segmentos · 15+ equipamentos · 100% · 3 disciplinas).
  Com reduced-motion a largura troca sem animar (só o texto entra por opacidade).
- [x] **Vitrine** (AEX "inventory"): título em dois tons, filtros e setas
  quadrados, cartões com selo de categoria e régua laranja no nome. Comportamento
  herdado da vitrine atual (`VitrineV2 extends VitrineSection`).
- [ ] Revisão do cliente no protótipo.
- [ ] Aprovado: trocar as seções em `/home`, mover os estilos `v2-` para os
  arquivos definitivos, apagar `/home-v2` e a regra do robots.

Antes de codar mudanças novas:
- consultar o banco de referências local (ver memória `banco-de-referencias`);
- definir com o cliente quais seções mudam de composição (hero, sobre, destaques,
  vitrine, contato, rodapé, painel);
- efeitos de rolagem seguem as regras da memória
  `efeitos-de-scroll-verificar-numerico` (diferença de velocidade contínua, simular
  em Node) e a máquina dele tem reduced-motion ligado.

### 8.4 Dívida técnica que vale fazer junto do B ou C

- **Variáveis CSS para a paleta** (seção 4, item 1): hoje os hex estão repetidos em
  ~90 regras de `_ds-brand.scss` / `_ds-surfaces.scss`.
- **Cores no `tailwind.config.js`** (`colors.brand.*`) para parar de depender do
  remap da escala neutra com `!important`.
- **Renomear `font-geist-mono`** para algo como `font-label` (está em ~100 templates;
  fazer com busca e troca e rodar os testes).
- `.login-campo` em `_ds-surfaces.scss` está sem uso desde que o login virou card
  claro; pode ser removido.

### 8.5 Como os assets foram gerados (para refazer se a marca mudar)

Scripts rodaram no scratchpad da sessão (não versionados), com `jimp@0.22`,
`potrace@2.1.8` e `puppeteer-core@23` + Edge
(`C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe`):
- **SVG:** potrace no `Logo Principal- Marca D_água 2 (preto).png` (achatado sobre
  branco), símbolo e texto vetorizados separados (corte em y=1130). Horizontal montado
  com as caixas medidas na `Submarca.png` (símbolo 271×176 em x=179; texto 414×187 em
  x=472). Degradê `#fc6b1e`→`#fa8c3c`, horizontal sobre a largura do símbolo.
- **Ícones/OG:** SVG renderizado no Edge headless e capturado. Favicon .ico montado
  à mão com PNGs de 16/32/48 dentro.
- **Fundo do Sobre:** cada pixel do sépia mapeado na reta `#0b2f52`→`#f3f6f9` com a
  mesma luminância.
- **Conferência visual:** puppeteer-core abrindo `ng serve --port 4300` e
  capturando cada seção (`#inicio`, `#sobre`, `#solucoes`, `#produtos`, `#contato`).
