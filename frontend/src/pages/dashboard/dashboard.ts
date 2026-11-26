import { ModalService } from '../../app/shared/modal';
import { mensagemErro } from '../../app/shared/erros';
import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

import {
  DadosDashboard,
  RelatorioService
} from '../../app/services/relatorio.service';

import { Pedido } from '../../app/services/pedido.service';
import { Produto } from '../../app/services/produto.service';
import { AuthService } from '../../app/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard implements OnInit {

  private cdr = inject(ChangeDetectorRef);
  modal = inject(ModalService);
  get gerente() { return {nome: this.authService.usuario()?.nome || '', cargo: 'Administração'}; }

  dados: DadosDashboard | null = null;

  busca = '';
  erro = '';

  constructor(
    private relatorioService: RelatorioService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {

    this.carregarDashboard();

  }

  // CARREGAR DASHBOARD

  carregarDashboard(): void {

    this.erro = '';

    this.relatorioService.dashboard().subscribe({

      next: dados => {
        this.cdr.markForCheck();
        this.dados = dados;
      },

      error: e => {
        this.cdr.markForCheck();
        this.erro = mensagemErro(e, 'carregar o Dashboard');
      }
    });
  }

  // INDICADORES

  get faturamentoMes(): number {

    return this.dados?.vendasDoMes.totalVendido ?? 0;
  }

  get vendasRealizadas(): number {

    return this.dados?.vendasDoMes.quantidadeVendas ?? 0;
  }

  get pecasEstoque(): number {

    return this.dados?.totalPecas ?? 0;
  }

  get estoqueBaixo(): number {

    return this.dados?.produtosComEstoqueBaixo ?? 0;
  }

  get pedidosRecentes(): Pedido[] {

    return this.dados?.pedidosRecentes ?? [];
  }

  get produtosEstoqueBaixo(): Produto[] {

    return this.dados?.listaEstoqueBaixo ?? [];
  }

  // INFORMAÇÕES DOS PEDIDOS

  nomeCliente(pedido: Pedido): string {

    if ('nome' in pedido.cliente) {
      return pedido.cliente.nome;
    }

    return 'Cliente #' + pedido.cliente.id;
  }

  valorPedido(pedido: Pedido): number {

    let total = pedido.frete || 0;

    for (const item of pedido.itens) {

      total += (item.precoUnitario || 0)
        * item.quantidade;
    }

    return total;
  }

  nomeStatus(pedido: Pedido): string {

    switch (pedido.status) {

      case 'ABERTO':
        return 'Aberto';

      case 'CONCLUIDO':
        return 'Convertido em venda';

      case 'CANCELADO':
        return 'Cancelado';

      default:
        return '—';
    }
  }

  // BUSCA

  get pedidosRecentesFiltrados(): Pedido[] {

    const termo = this.busca.trim()
      .toLocaleLowerCase('pt-BR');

    return this.pedidosRecentes.filter(pedido =>

      String(pedido.id).includes(termo) ||

      this.nomeCliente(pedido)
        .toLowerCase().includes(termo) ||

      this.nomeStatus(pedido)
        .toLowerCase().includes(termo) ||

      pedido.itens.some(item =>

        'nome' in item.produto &&
        item.produto.nome.toLowerCase().includes(termo)
      )
    );
  }

  get produtosEstoqueBaixoFiltrados(): Produto[] {

    const termo = this.busca.trim()
      .toLocaleLowerCase('pt-BR');

    return this.produtosEstoqueBaixo.filter(produto =>

      Object.values(produto).some(valor =>

        String(valor)
          .toLocaleLowerCase('pt-BR')
          .includes(termo)
      )
    );
  }

}