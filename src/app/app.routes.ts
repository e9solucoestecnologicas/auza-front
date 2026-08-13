import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'login',
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
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
  },
  {
    path: 'produtos',
    loadComponent: () => import('./pages/produtos/produtos').then((m) => m.Produtos),
  },
  {
    path: 'landing',
    loadComponent: () => import('./pages/landing/landing').then((m) => m.Landing),
  },
  {
    path: 'landing2',
    loadComponent: () => import('./pages/landing2/landing2').then((m) => m.Landing2),
  },
  {
    path: 'landing3',
    loadComponent: () => import('./pages/landing3/landing3').then((m) => m.Landing3),
  },
  {
    path: 'design-system',
    loadComponent: () => import('./pages/design-system/design-system').then((m) => m.DesignSystem),
  },
  { path: '**', redirectTo: 'home' },
];
