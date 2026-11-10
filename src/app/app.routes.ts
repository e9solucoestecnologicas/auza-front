import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  /**
   * `title` por rota: o Angular escreve em document.title a cada navegação. A
   * marca vem PRIMEIRO em todos, porque é por ela que se busca — e é o começo do
   * título que aparece na aba estreita e no resultado do Google.
   *
   * O título do index.html vale para a primeira carga (o que o robô lê antes de
   * rodar JS); estes valem da navegação em diante.
   */
  {
    path: 'login',
    title: 'AUZA — Área restrita',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  /**
   * Área autenticada. O `authGuard` fica na rota PAI: filho nenhum é alcançável
   * sem passar por ele, inclusive por URL digitada.
   *
   * `produtos/novo` vem antes de `produtos/:id` porque a ordem decide — como
   * parâmetro, `:id` casaria com "novo" e abriria a edição de um produto
   * inexistente.
   */
  {
    path: 'painel',
    title: 'AUZA — Painel',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/painel/painel-layout').then((m) => m.PainelLayout),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/painel/painel').then((m) => m.Painel),
      },
      {
        path: 'produtos',
        loadComponent: () =>
          import('./pages/painel/produtos/produtos-lista').then((m) => m.ProdutosLista),
      },
      {
        path: 'produtos/novo',
        loadComponent: () =>
          import('./pages/painel/produtos/produto-form').then((m) => m.ProdutoForm),
      },
      {
        path: 'produtos/:id',
        loadComponent: () =>
          import('./pages/painel/produtos/produto-form').then((m) => m.ProdutoForm),
      },
    ],
  },
  {
    path: 'home',
    title: 'AUZA Engenharia e Automação — Máquinas industriais',
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
  },
  /** Protótipo do plano C do rebrand (ver src/app/pages/home-v2). Fora do sitemap. */
  {
    path: 'home-v2',
    title: 'AUZA — Protótipo da nova home',
    loadComponent: () => import('./pages/home-v2/home-v2').then((m) => m.HomeV2),
  },
  {
    path: 'produtos',
    title: 'AUZA — Catálogo de máquinas e equipamentos',
    loadComponent: () => import('./pages/produtos/produtos').then((m) => m.Produtos),
  },
  {
    path: 'design-system',
    loadComponent: () => import('./pages/design-system/design-system').then((m) => m.DesignSystem),
  },
  { path: '**', redirectTo: 'home' },
];
