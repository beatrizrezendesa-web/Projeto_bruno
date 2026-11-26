import { finalize } from 'rxjs';
import { ModalService, dataHoje } from '../../app/shared/modal';
import { mensagemErro } from '../../app/shared/erros';
import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

import { baixarCsv } from '../../app/shared/csv';

import {
  Venda,
  ItemVenda,
  VendaService
} from '../../app/services/venda.service';

import {
  Cliente,
  ClienteService
} from '../../app/services/cliente.service';

import {
  Produto,
  ProdutoService
} from '../../app/services/produto.service';

import { FinanceiroService, LancamentoFinanceiro } from '../../app/services/financeiro.service';
import { AuthService } from '../../app/services/auth.service';

@Component({
  selector: 'app-vendas',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './vendas.html',
  styleUrls: ['./vendas.css']
})
export class Vendas implements OnInit {

  private cdr = inject(ChangeDetectorRef);
  modal = inject(ModalService);
  get gerente() { return {nome: this.authService.usuario()?.nome || '', cargo: 'Administração'}; }

  historicoVendas: Venda[] = [];
  private financeiroService = inject(FinanceiroService);
  pagamentos: LancamentoFinanceiro[] = [];
  pagamento(venda: Venda): string {
    const f = this.pagamentos.find(m => m.venda?.id === venda.id);
    return venda.status === "CANCELADA" ? "Cancelada" : f?.status === "PAGO" ? (!f.dataPagamento || f.dataPagamento > dataHoje() ? "Data inválida" : "Recebida") : f?.status === "PENDENTE" ? "A receber" : "Não informado";
  }
  carregarPagamentos(): void {
    this.consultas++;
    this.cdr.markForCheck();
    this.financeiroService.listar().pipe(finalize(()=>{this.consultas--;this.cdr.markForCheck();})).subscribe({next: dados => {this.pagamentos=dados;this.cdr.markForCheck();},error: e=>{this.erro=mensagemErro(e,"consultar os pagamentos");this.cdr.markForCheck();}});
  }
  clientes: Cliente[] = [];
  produtos: Produto[] = [];

  busca = '';
  filtrosAbertos = false;
  filtroSelecionado = 'Todos';
  erro = '';
  private consultas = 0;
  get carregando(): boolean { return this.consultas > 0; }


  constructor(
    private vendaService: VendaService,
    private clienteService: ClienteService,
    private produtoService: ProdutoService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {

    this.carregarVendas(); this.carregarPagamentos();
    this.carregarClientes();
    this.carregarProdutos();

  }

  // CARREGAR DADOS

  carregarVendas(): void {

    this.consultas++;
    this.cdr.markForCheck();
    this.vendaService.listar().pipe(finalize(()=>{ this.consultas--; this.cdr.markForCheck(); })).subscribe({

      next: dados => {
        this.cdr.markForCheck();
        this.historicoVendas = dados;
      },

      error: e => {
        this.cdr.markForCheck();
        this.erro = mensagemErro(e, 'carregar as vendas');
      }
    });
  }

  carregarClientes(): void {

    this.consultas++;
    this.cdr.markForCheck();
    this.clienteService.listar().pipe(finalize(()=>{ this.consultas--; this.cdr.markForCheck(); })).subscribe({

      next: dados => {
        this.cdr.markForCheck();
        this.clientes = dados;
      },

      error: e => {
        this.cdr.markForCheck();
        this.erro = mensagemErro(e, 'carregar os clientes');
      }
    });
  }

  carregarProdutos(): void {

    this.consultas++;
    this.cdr.markForCheck();
    this.produtoService.listar().pipe(finalize(()=>{ this.consultas--; this.cdr.markForCheck(); })).subscribe({

      next: dados => {
        this.cdr.markForCheck();
        this.produtos = dados;
      },

      error: e => {
        this.cdr.markForCheck();
        this.erro = mensagemErro(e, 'carregar os produtos');
      }
    });
  }

  // INDICADORES

  get vendasDoMes(): Venda[] {

    const hoje = new Date();

    return this.historicoVendas.filter(venda => {

      if (!venda.data) return false;

      const data = new Date(venda.data);

      return venda.status === 'CONCLUIDA'
        && data.getMonth() === hoje.getMonth()
        && data.getFullYear() === hoje.getFullYear();
    });
  }

  get faturamento(): number {

    return this.vendasDoMes.reduce(
      (total, venda) => total + (venda.total ?? 0),
      0
    );
  }

  get ticketMedio(): number {

    if (this.vendasDoMes.length === 0) {
      return 0;
    }

    return this.faturamento / this.vendasDoMes.length;
  }

  get quantidadeVendasHoje(): number {

    const hoje = new Date().toDateString();

    return this.historicoVendas.filter(venda =>
      venda.status === 'CONCLUIDA'
      && venda.data
      && new Date(venda.data).toDateString() === hoje
    ).length;
  }

  get vendasHoje(): number {

    const hoje = new Date().toDateString();

    return this.historicoVendas.filter(venda =>
      venda.status === 'CONCLUIDA'
      && venda.data
      && new Date(venda.data).toDateString() === hoje
    ).reduce(
      (total, venda) => total + (venda.total ?? 0),
      0
    );
  }

  get canceladas(): number {

    return this.historicoVendas.filter(
      venda => venda.status === 'CANCELADA'
    ).length;
  }

  // INFORMAÇÕES DA VENDA

  nomeCliente(venda: Venda): string {

    if ('nome' in venda.cliente) {
      return venda.cliente.nome;
    }

    return this.clientes.find(
      cliente => cliente.id === venda.cliente.id
    )?.nome || '—';
  }

  nomeProduto(item: ItemVenda): string {

    if ('nome' in item.produto) {
      return item.produto.nome;
    }

    return this.produtos.find(
      produto => produto.id === item.produto.id
    )?.nome || '—';
  }

  // BUSCA E FILTROS

  get vendasFiltradas(): Venda[] {

    const termo = this.busca.trim()
      .toLocaleLowerCase('pt-BR');

    return this.historicoVendas.filter(venda => {

      const buscaOk =
        String(venda.id).includes(termo) ||
        this.nomeCliente(venda)
          .toLowerCase().includes(termo) ||
        venda.canal
          .toLowerCase().includes(termo) ||
        venda.formaPagamento
          .toLowerCase().includes(termo) ||
        this.pagamento(venda).toLowerCase().includes(termo) ||
        venda.itens.some(item =>
          this.nomeProduto(item)
            .toLowerCase().includes(termo)
        );

      const filtroOk =
        this.filtroSelecionado === 'Todos' ||
        venda.status === this.filtroSelecionado ||
        this.pagamento(venda) === this.filtroSelecionado;

      return buscaOk && filtroOk;
    });
  }

  get total(): number {
    return this.vendasFiltradas.length;
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

  // NOVA VENDA
  novaVenda():void {
    if (!this.clientes.length) { this.erro='Cadastre um cliente antes de continuar.'; return; }
    if (!this.produtos.some(p=>p.disponivel && p.quantidadeEstoque>0)) { this.erro='Cadastre ou disponibilize um produto antes de continuar.'; return; }
    this.modal.abrir({titulo:'Nova venda',botao:'Finalizar venda',campos:[{chave:'cliente',rotulo:'Cliente',tipo:'select',obrigatorio:true,opcoes:[{valor:null,texto:'Selecione um cliente'},...this.clientes.filter(c=>c.id!==undefined).map(c=>({valor:c.id!,texto:c.nome}))]},{chave:'forma',rotulo:'Forma de pagamento',tipo:'select',obrigatorio:true,opcoes:[{valor:'PIX',texto:'Pix'},{valor:'DEBITO',texto:'Débito'},{valor:'CREDITO',texto:'Crédito'}]},
      {chave:'canal',rotulo:'Canal de venda',tipo:'select',obrigatorio:true,opcoes:[{valor:'LOJA',texto:'Loja'},{valor:'WHATSAPP',texto:'WhatsApp'},{valor:'INSTAGRAM',texto:'Instagram'}]},
      {chave:'status',rotulo:'Status do pagamento',tipo:'select',obrigatorio:true,opcoes:[{valor:'PAGO',texto:'Pago'},{valor:'PENDENTE',texto:'Pendente'}]},
      {chave:'vencimento',rotulo:'Data de vencimento',tipo:'date',obrigatorio:true,dataMin:dataHoje(),visivel:v=>v['status']==='PENDENTE'}],
      valores:{cliente:null,forma:'PIX',canal:'LOJA',status:'PENDENTE',vencimento:''},produtos:this.produtos.filter(p=>p.id!==undefined).map(p=>({id:p.id!,nome:`${p.nome} — ${p.cor}/${p.tamanho}`,preco:p.preco,estoque:p.quantidadeEstoque,disponivel:p.disponivel})),validarEstoque:true,
      salvar:(v,itens)=>{const venda:Venda={cliente:{id:Number(v['cliente'])},formaPagamento:String(v['forma']),canal:String(v['canal']),itens:itens.map(i=>({produto:{id:i.produtoId!},quantidade:i.quantidade}))};
        return this.vendaService.cadastrar(venda,String(v['status']),v['status']==='PENDENTE'?String(v['vencimento']):undefined);},conflito:'Não foi possível registrar a venda. Verifique a disponibilidade e o estoque dos produtos e atualize a lista antes de tentar novamente.',sucesso:'Venda registrada com sucesso.',depois:()=>{this.carregarVendas(); this.carregarPagamentos();this.carregarProdutos();}});
  }
  cancelarVenda(venda:Venda):void {if(venda.id===undefined||venda.status!=='CONCLUIDA')return;const id=venda.id;
    this.modal.abrir({titulo:'Cancelar venda',descricao:`Cancelar a venda #${id}? O estoque será devolvido e o lançamento financeiro cancelado.`,botao:'Cancelar venda',salvar:()=>this.vendaService.cancelar(id),conflito:'Esta venda não pode mais ser cancelada.',sucesso:'Venda cancelada.',depois:()=>{this.carregarVendas(); this.carregarPagamentos();this.carregarProdutos();}});
  }

  // EXPORTAR CSV

  exportar(): void {

    const colunas = [
      'Venda',
      'Pedido',
      'Cliente',
      'Data',
      'Canal',
      'Forma de pagamento',
      'Valor',
      'Status comercial',
      'Situação do pagamento'
    ];

    const linhas = this.vendasFiltradas.map(venda => [

      venda.id,
      venda.pedido?.id ?? "Venda direta",
      this.nomeCliente(venda),
      venda.data,
      venda.canal,
      venda.formaPagamento,
      venda.total,
      venda.status,
      this.pagamento(venda)

    ]);

    baixarCsv('vendas', colunas, linhas);
  }

}