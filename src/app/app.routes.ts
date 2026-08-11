import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: 'painel',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/painel/painel').then((m) => m.Painel),
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
