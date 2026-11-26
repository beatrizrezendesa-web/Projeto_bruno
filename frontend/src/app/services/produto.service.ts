import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface Produto {
  id?: number;
  nome: string;
  categoria: string;
  tamanho: string;
  cor: string;
  preco: number;
  quantidadeEstoque: number;
  disponivel: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProdutoService {

  private baseUrl = 'http://localhost:8080/produtos';

  constructor(private http: HttpClient) {}

  listar() {
    return this.http.get<Produto[]>(this.baseUrl);
  }

  buscar(id: number) {
    return this.http.get<Produto>(`${this.baseUrl}/${id}`);
  }

  cadastrar(produto: Produto) {
    return this.http.post<Produto>(this.baseUrl, produto);
  }

  atualizar(id: number, produto: Produto) {
    return this.http.put<Produto>(
      `${this.baseUrl}/${id}`, produto
    );
  }

  excluir(id: number) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}