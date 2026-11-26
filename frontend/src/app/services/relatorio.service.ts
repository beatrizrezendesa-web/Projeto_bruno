import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Produto } from './produto.service';
import { Pedido } from './pedido.service';

export interface RelatorioVendas {

  inicio: string;
  fim: string;
  quantidadeVendas: number;
  totalVendido: number;

}

export interface RelatorioFinanceiro {

  inicio: string;
  fim: string;
  entradas: number;
  saidas: number;
  saldo: number;
  aReceber: number;
  aPagar: number;

}

export interface DadosDashboard {

  clientes: number;
  produtos: number;
  totalPecas: number;
  pedidosAbertos: number;

  vendasDoMes: RelatorioVendas;
  financeiroDoMes: RelatorioFinanceiro;

  totalAReceber: number;
  totalAPagar: number;
  produtosComEstoqueBaixo: number;

  listaEstoqueBaixo: Produto[];
  pedidosRecentes: Pedido[];

}

@Injectable({
  providedIn: 'root'
})
export class RelatorioService {

  private baseUrl = '/api/relatorios';

  constructor(private http: HttpClient) {}

  dashboard() {

    return this.http.get<DadosDashboard>(
      `${this.baseUrl}/dashboard`
    );
  }

  vendas(inicio: string, fim: string) {

    return this.http.get<RelatorioVendas>(
      `${this.baseUrl}/vendas`,
      {
        params: { inicio, fim }
      }
    );
  }

  estoque(limite: number = 5) {

    return this.http.get<Produto[]>(
      `${this.baseUrl}/estoque`,
      {
        params: { limite }
      }
    );
  }

  financeiro(inicio: string, fim: string) {

    return this.http.get<RelatorioFinanceiro>(
      `${this.baseUrl}/financeiro`,
      {
        params: { inicio, fim }
      }
    );
  }
}