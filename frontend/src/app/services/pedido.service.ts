import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Cliente } from './cliente.service';
import { Produto } from './produto.service';

export interface ItemPedido {
  id?: number;
  produto: Produto | { id: number };
  quantidade: number;
  precoUnitario?: number;
}

export interface Pedido {
  id?: number;
  cliente: Cliente | { id: number };
  data?: string;
  status?: string;
  tipoEntrega: string;
  enderecoEntrega?: string;
  frete: number;
  observacoes?: string;
  itens: ItemPedido[];
}

@Injectable({
  providedIn: 'root'
})
export class PedidoService {

  private baseUrl = '/api/pedidos';

  constructor(private http: HttpClient) {}

  listar() {
    return this.http.get<Pedido[]>(this.baseUrl);
  }

  buscar(id: number) {
    return this.http.get<Pedido>(`${this.baseUrl}/${id}`);
  }

  cadastrar(pedido: Pedido) {
    return this.http.post<Pedido>(this.baseUrl, pedido);
  }

  atualizar(id: number, pedido: Pedido) {
    return this.http.put<Pedido>(
      `${this.baseUrl}/${id}`, pedido
    );
  }

  listarItens(id: number) {
    return this.http.get<ItemPedido[]>(
      `${this.baseUrl}/${id}/itens`
    );
  }

  calcularTotal(id: number) {
    return this.http.get<number>(
      `${this.baseUrl}/${id}/total`
    );
  }

  cancelar(id: number) {
    return this.http.put<Pedido>(
      `${this.baseUrl}/${id}/cancelar`, {}
    );
  }

  confirmar(
    id: number,
    formaPagamento: string,
    canal: string,
    statusPagamento: string,
    dataVencimento?: string
  ) {

    return this.http.put(
      `${this.baseUrl}/${id}/confirmar`,
      {
        formaPagamento,
        canal,
        statusPagamento,
        dataVencimento
      }
    );
  }
}