import { Routes } from '@angular/router';
import { Home } from './pages/home/home';

export const routes: Routes = [
  {
    path: '',
    component: Home
  },
  {
    path: 'charter',
    loadComponent: () =>
      import('./pages/charter/charter')
        .then(m => m.Charter)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
