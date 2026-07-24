import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'landing', pathMatch: 'full' },
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
  { path: '**', redirectTo: 'landing' },
];
