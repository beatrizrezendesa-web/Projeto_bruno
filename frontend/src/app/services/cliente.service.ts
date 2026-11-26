import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface Cliente {
  id?: number;
  nome: string;
  telefone: string;
  endereco?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ClienteService {

  private baseUrl = 'http://localhost:8080/clientes';

  constructor(private http: HttpClient) {}

  listar() {
    return this.http.get<Cliente[]>(this.baseUrl);
  }

  buscar(id: number) {
    return this.http.get<Cliente>(`${this.baseUrl}/${id}`);
  }

  cadastrar(cliente: Cliente) {
    return this.http.post<Cliente>(this.baseUrl, cliente);
  }

  atualizar(id: number, cliente: Cliente) {
    return this.http.put<Cliente>(
      `${this.baseUrl}/${id}`, cliente
    );
  }

  excluir(id: number) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}