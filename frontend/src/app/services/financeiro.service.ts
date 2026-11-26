import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Cliente } from './cliente.service';
import { Venda } from './venda.service';

export interface LancamentoFinanceiro {

  id?: number;
  venda?: Venda | null;
  cliente?: Cliente | { id: number } | null;
  descricao: string;
  categoria: string;
  tipo: string;
  valor: number;
  dataVencimento?: string | null;
  dataPagamento?: string | null;
  status: string;

}

@Injectable({
  providedIn: 'root'
})
export class FinanceiroService {

  private baseUrl = 'http://localhost:8080/financeiro';

  constructor(private http: HttpClient) {}

  listar() {

    return this.http.get<LancamentoFinanceiro[]>(
      this.baseUrl
    );
  }

  buscar(id: number) {

    return this.http.get<LancamentoFinanceiro>(
      `${this.baseUrl}/${id}`
    );
  }

  cadastrar(financeiro: LancamentoFinanceiro) {

    return this.http.post<LancamentoFinanceiro>(
      this.baseUrl, financeiro
    );
  }

  atualizar(id: number, financeiro: LancamentoFinanceiro) {

    return this.http.put<LancamentoFinanceiro>(
      `${this.baseUrl}/${id}`, financeiro
    );
  }

  registrarPagamento(id: number) {

    return this.http.put<LancamentoFinanceiro>(
      `${this.baseUrl}/${id}/pagar`, {}
    );
  }

  excluir(id: number) {

    return this.http.delete<void>(
      `${this.baseUrl}/${id}`
    );
  }
}