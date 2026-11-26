import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Cliente } from './cliente.service';
import { Produto } from './produto.service';
import { Pedido } from './pedido.service';

export interface ItemVenda {
  id?: number;
  produto: Produto | { id: number };
  quantidade: number;
  precoUnitario?: number;
}

export interface Venda {
  id?: number;
  cliente: Cliente | { id: number };
  data?: string;
  status?: string;
  total?: number;
  formaPagamento: string;
  canal: string;
  pedido?: Pedido;
  itens: ItemVenda[];
}

@Injectable({
  providedIn: 'root'
})
export class VendaService {

  private baseUrl = '/api/vendas';

  constructor(private http: HttpClient) {}

  listar() {
    return this.http.get<Venda[]>(this.baseUrl);
  }

  buscar(id: number) {
    return this.http.get<Venda>(`${this.baseUrl}/${id}`);
  }

  cadastrar(
    venda: Venda,
    status: string,
    dataVencimento?: string
  ) {

    return this.http.post<Venda>(this.baseUrl, {
      venda,
      status,
      dataVencimento
    });
  }

  listarItens(id: number) {

    return this.http.get<ItemVenda[]>(
      `${this.baseUrl}/${id}/itens`
    );
  }

  cancelar(id: number) {

    return this.http.put<Venda>(
      `${this.baseUrl}/${id}/cancelar`, {}
    );
  }
}