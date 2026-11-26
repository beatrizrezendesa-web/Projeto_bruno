import { Routes } from '@angular/router';

import { Home } from '../pages/home/home';
import { Login } from '../pages/login/login';
import { Dashboard } from '../pages/dashboard/dashboard';
import { Vendas } from '../pages/vendas/vendas';
import { Pedidos } from '../pages/pedidos/pedidos';
import { Estoque } from '../pages/estoque/estoque';
import { Clientes } from '../pages/clientes/clientes';
import { Financeiro } from '../pages/financeiro/financeiro';
import { Relatorios } from '../pages/relatorios/relatorios';

import { Admin } from './shared/admin';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [

  {
    path: '',
    component: Home,
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: Login
  },
  { path: '', component: Admin, canActivate: [authGuard], children: [
  {
    path: 'dashboard',
    component: Dashboard
  },
  {
    path: 'vendas',
    component: Vendas
  },
  {
    path: 'pedidos',
    component: Pedidos
  },
  {
    path: 'estoque',
    component: Estoque
  },
  {
    path: 'clientes',
    component: Clientes
  },
  {
    path: 'financeiro',
    component: Financeiro
  },
  {
    path: 'relatorios',
    component: Relatorios
  },
  ] },
  {
    path: '**',
    redirectTo: ''
  }
];