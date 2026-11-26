import { finalize } from 'rxjs';
import { ModalService } from '../../app/shared/modal';
import { mensagemErro } from '../../app/shared/erros';
import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

import { baixarCsv } from '../../app/shared/csv';
import { Cliente, ClienteService } from '../../app/services/cliente.service';
import { Venda, VendaService } from '../../app/services/venda.service';
import { AuthService } from '../../app/services/auth.service';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './clientes.html',
  styleUrls: ['./clientes.css']
})
export class Clientes implements OnInit {

  private cdr = inject(ChangeDetectorRef);
  modal = inject(ModalService);
  get gerente() { return {nome: this.authService.usuario()?.nome || '', cargo: 'Administração'}; }

  baseClientes: Cliente[] = [];
  vendas: Venda[] = [];

  vendasCarregadas = false;
  erro = '';
  private consultas = 0;
  get carregando(): boolean { return this.consultas > 0; }

  busca = '';
  filtrosAbertos = false;
  filtroSelecionado = 'Todos';

  constructor(
    private clienteService: ClienteService,
    private vendaService: VendaService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {

    this.carregarClientes();
    this.carregarVendas();

  }

  // CARREGAR DADOS

  carregarClientes(): void {

    this.consultas++;
    this.cdr.markForCheck();
    this.clienteService.listar().pipe(finalize(()=>{ this.consultas--; this.cdr.markForCheck(); })).subscribe({

      next: dados => {
        this.cdr.markForCheck();
        this.baseClientes = dados;
      },

      error: e => {
        this.cdr.markForCheck();
        this.erro = mensagemErro(e, 'carregar os clientes');
      }
    });
  }

  carregarVendas(): void {

    this.consultas++;
    this.cdr.markForCheck();
    this.vendaService.listar().pipe(finalize(()=>{ this.consultas--; this.cdr.markForCheck(); })).subscribe({

      next: dados => {
        this.cdr.markForCheck();

        this.vendas = dados.filter(
          venda => venda.status === 'CONCLUIDA'
        );

        this.vendasCarregadas = true;
      },

      error: e => {
        this.cdr.markForCheck();
        this.vendasCarregadas = false;
        this.erro = mensagemErro(e, 'carregar as compras');
      }
    });
  }

  // INDICADORES

  get clientesCadastrados(): number {

    return this.baseClientes.length;
  }

  get clientesAtivos(): number {

    const limite = new Date();
    limite.setDate(limite.getDate() - 90);

    return this.baseClientes.filter(cliente =>
      this.comprasCliente(cliente).some(venda =>
        !!venda.data && new Date(venda.data) >= limite
      )
    ).length;
  }

  get ticketMedio(): number {

    if (this.vendas.length === 0) {
      return 0;
    }

    const total = this.vendas.reduce(
      (soma, venda) => soma + (venda.total ?? 0),
      0
    );

    return total / this.vendas.length;
  }

  get fidelizacao(): number {

    if (this.baseClientes.length === 0) {
      return 0;
    }

    const recorrentes = this.baseClientes.filter(
      cliente => this.comprasCliente(cliente).length >= 2
    ).length;

    return recorrentes / this.baseClientes.length * 100;
  }

  // INFORMAÇÕES DAS COMPRAS

  comprasCliente(cliente: Cliente): Venda[] {

    return this.vendas.filter(
      venda => venda.cliente?.id === cliente.id
    );
  }

  ultimaCompra(cliente: Cliente): string {

    const datas = this.comprasCliente(cliente)
      .map(venda => venda.data ?? '')
      .filter(data => data !== '')
      .sort();

    if (datas.length === 0) {
      return '—';
    }

    return datas[datas.length - 1];
  }

  totalGasto(cliente: Cliente): number {

    return this.comprasCliente(cliente).reduce(
      (soma, venda) => soma + (venda.total ?? 0),
      0
    );
  }

  perfil(cliente: Cliente): string {

    if (!this.vendasCarregadas) {
      return '—';
    }

    const quantidade = this.comprasCliente(cliente).length;

    if (quantidade === 0) {
      return 'Sem compras';
    }

    if (quantidade === 1) {
      return 'Novo';
    }

    return 'Recorrente';
  }

  // BUSCA E FILTROS

  get clientesFiltrados(): Cliente[] {

    const termo = this.busca.trim().toLowerCase();

    return this.baseClientes.filter(cliente => {

      const buscaOk =
        cliente.nome.toLowerCase().includes(termo) ||
        cliente.telefone.includes(termo) ||
        (cliente.endereco || '').toLowerCase().includes(termo);

      const filtroOk =
        this.filtroSelecionado === 'Todos' ||
        this.perfil(cliente) === this.filtroSelecionado;

      return buscaOk && filtroOk;
    });
  }

  get total(): number {
    return this.clientesFiltrados.length;
  }

  get inicio(): number {
    return this.total === 0 ? 0 : 1;
  }

  get fim(): number {
    return this.total;
  }

  aoBuscar(valor: string): void {
    this.busca = valor;
  }

  escolherFiltro(valor: string): void {
    this.filtroSelecionado = valor;
  }

  limparFiltros(): void {

    this.filtroSelecionado = 'Todos';
    this.busca = '';
  }

  alternarFiltros(): void {

    this.filtrosAbertos = !this.filtrosAbertos;
  }

  // CADASTRAR E EDITAR CLIENTE
  novoCliente(): void { this.formularioCliente(); }
  editarCliente(cliente: Cliente): void { this.formularioCliente(cliente); }
  private formularioCliente(cliente?: Cliente): void {
    this.modal.abrir({
      titulo: cliente ? 'Editar cliente' : 'Cadastrar cliente', botao:'Salvar cliente',
      campos:[{chave:'nome',rotulo:'Nome completo',obrigatorio:true},{chave:'telefone',rotulo:'Telefone / WhatsApp',tipo:'tel',obrigatorio:true},{chave:'endereco',rotulo:'Endereço'}],
      valores:{nome:cliente?.nome??'',telefone:cliente?.telefone??'',endereco:cliente?.endereco??''},
      salvar:v=>{ const dados:Cliente={nome:String(v['nome']).trim(),telefone:String(v['telefone']).trim(),endereco:String(v['endereco']??'').trim()};
        if (!/\p{L}/u.test(dados.nome)) throw new Error('Informe um nome válido.');
        const digitos = dados.telefone.replace(/\D/g,'');
        if (!/^[+()\d\s.-]+$/.test(dados.telefone) || !([10,11].includes(digitos.length) || ([12,13].includes(digitos.length) && digitos.startsWith('55')))) throw new Error('Informe um telefone válido com DDD.');
        return cliente?.id!==undefined ? this.clienteService.atualizar(cliente.id,dados) : this.clienteService.cadastrar(dados); },
      sucesso:cliente?'Cliente atualizado com sucesso.':'Cliente cadastrado com sucesso.', depois:()=>this.carregarClientes()
    });
  }
  excluirCliente(cliente: Cliente): void {
    if(cliente.id===undefined) return; const id=cliente.id;
    this.modal.abrir({titulo:'Excluir cliente',descricao:`Deseja excluir ${cliente.nome}? Esta ação não pode ser desfeita.`,botao:'Excluir cliente',
      salvar:()=>this.clienteService.excluir(id), conflito:`${cliente.nome} não pode ser excluído porque possui vendas, pedidos ou lançamentos financeiros vinculados.`, sucesso:'Cliente excluído com sucesso.',depois:()=>this.carregarClientes()});
  }

  // EXPORTAR CSV

  exportar(): void {

    const colunas = [
      'Cliente',
      'Telefone',
      'Endereço',
      'Última compra',
      'Compras',
      'Total comprado',
      'Perfil'
    ];

    const linhas = this.clientesFiltrados.map(cliente => [

      cliente.nome,
      cliente.telefone,
      cliente.endereco || '',
      this.vendasCarregadas ? this.ultimaCompra(cliente) : '—',
      this.vendasCarregadas ? this.comprasCliente(cliente).length : '—',
      this.vendasCarregadas ? this.totalGasto(cliente) : '—',
      this.perfil(cliente)

    ]);

    baixarCsv('clientes', colunas, linhas);
  }

}