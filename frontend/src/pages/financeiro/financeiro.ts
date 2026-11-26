import { finalize } from 'rxjs';
import { ModalService, dataHoje } from '../../app/shared/modal';
import { mensagemErro } from '../../app/shared/erros';
import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

import { baixarCsv } from '../../app/shared/csv';

import {
  LancamentoFinanceiro,
  FinanceiroService
} from '../../app/services/financeiro.service';

import {
  Cliente,
  ClienteService
} from '../../app/services/cliente.service';

import { AuthService } from '../../app/services/auth.service';

@Component({
  selector: 'app-financeiro',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './financeiro.html',
  styleUrls: ['./financeiro.css']
})
export class Financeiro implements OnInit {

  private cdr = inject(ChangeDetectorRef);
  modal = inject(ModalService);
  get gerente() { return {nome: this.authService.usuario()?.nome || '', cargo: 'Administração'}; }

  movimentacoes: LancamentoFinanceiro[] = [];
  clientes: Cliente[] = [];

  busca = '';
  filtrosAbertos = false;
  filtroSelecionado = 'Todos';
  erro = '';
  private consultas = 0;
  get carregando(): boolean { return this.consultas > 0; }

  constructor(
    private financeiroService: FinanceiroService,
    private clienteService: ClienteService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {

    this.carregarMovimentacoes();
    this.carregarClientes();

  }

  // CARREGAR DADOS

  carregarMovimentacoes(): void {

    this.consultas++;
    this.cdr.markForCheck();
    this.financeiroService.listar().pipe(finalize(()=>{ this.consultas--; this.cdr.markForCheck(); })).subscribe({

      next: dados => {
        this.cdr.markForCheck();
        this.movimentacoes = dados;
      },

      error: e => {
        this.cdr.markForCheck();
        this.erro = mensagemErro(e, 'carregar o financeiro');
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

  // INDICADORES FINANCEIROS

  private pertenceAoMes(data?: string | null): boolean {

    if (!data) return false;

    const hoje = new Date();

    const anoMes = hoje.getFullYear() + '-' +
      String(hoje.getMonth() + 1).padStart(2, '0');

    return data.startsWith(anoMes);
  }

  get entradas(): number {

    return this.movimentacoes.filter(
      m => m.tipo === 'ENTRADA'
        && m.status === 'PAGO'
        && !!m.dataPagamento && m.dataPagamento <= dataHoje()
        && this.pertenceAoMes(m.dataPagamento)
    ).reduce(
      (total, m) => total + m.valor, 0
    );
  }

  get despesas(): number {

    return this.movimentacoes.filter(
      m => m.tipo === 'SAIDA'
        && m.status === 'PAGO'
        && !!m.dataPagamento && m.dataPagamento <= dataHoje()
        && this.pertenceAoMes(m.dataPagamento)
    ).reduce(
      (total, m) => total + m.valor, 0
    );
  }

  get saldoPeriodo(): number {

    return this.entradas - this.despesas;
  }

  get aReceber(): number {

    return this.movimentacoes.filter(
      m => m.tipo === 'ENTRADA'
        && m.status === 'PENDENTE'
    ).reduce(
      (total, m) => total + m.valor, 0
    );
  }

  get aPagar(): number {

    return this.movimentacoes.filter(
      m => m.tipo === 'SAIDA'
        && m.status === 'PENDENTE'
    ).reduce(
      (total, m) => total + m.valor, 0
    );
  }

  get pendentesReceber(): number {

    return this.movimentacoes.filter(
      m => m.tipo === 'ENTRADA'
        && m.status === 'PENDENTE'
    ).length;
  }

  get periodo(): string {

    return new Date().toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric'
    });
  }

  // INFORMAÇÕES DO LANÇAMENTO

  nomeCliente(m: LancamentoFinanceiro): string {

    if (!m.cliente) return '—';

    if ('nome' in m.cliente) {
      return m.cliente.nome;
    }

    return this.clientes.find(
      c => c.id === m.cliente?.id
    )?.nome || '—';
  }

  vencido(m: LancamentoFinanceiro): boolean {
    return !!m.dataVencimento && m.dataVencimento < dataHoje();
  }

  pagamentoInvalido(m: LancamentoFinanceiro): boolean {
    return m.status === "PAGO" && (!m.dataPagamento || m.dataPagamento > dataHoje());
  }

  nomeStatus(m: LancamentoFinanceiro): string {
    if (this.pagamentoInvalido(m)) return "Data de pagamento inválida";

    if (m.status === 'CANCELADO') {
      return 'Cancelado';
    }

    if (m.status === 'PAGO') {

      return m.tipo === 'ENTRADA'
        ? 'Recebido'
        : 'Pago';
    }

    return m.tipo === 'ENTRADA'
      ? 'A receber'
      : 'A pagar';
  }

  // BUSCA E FILTROS

  get movimentacoesFiltradas(): LancamentoFinanceiro[] {

    const termo = this.busca.trim().toLowerCase();

    return this.movimentacoes.filter(m => {

      const buscaOk =
        m.descricao.toLowerCase().includes(termo) ||
        m.categoria.toLowerCase().includes(termo) ||
        this.nomeCliente(m).toLowerCase().includes(termo) ||
        this.nomeStatus(m).toLowerCase().includes(termo) ||
        String(m.valor).includes(termo);

      const filtroOk =
        this.filtroSelecionado === 'Todos' ||
        m.tipo === this.filtroSelecionado;

      return buscaOk && filtroOk;
    });
  }

  get total(): number {
    return this.movimentacoesFiltradas.length;
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

  // FORMULÁRIOS FINANCEIROS
  novoLancamento():void {this.formularioLancamento();}
  editarLancamento(m:LancamentoFinanceiro):void {if(!m.venda)this.formularioLancamento(m);}
  private formularioLancamento(m?:LancamentoFinanceiro):void {
    const hoje = dataHoje();
    this.modal.abrir({titulo:m?'Editar lançamento':'Novo lançamento',botao:'Salvar lançamento',campos:[
      {chave:'tipo',rotulo:'Tipo: entrada ou saída',tipo:'select',obrigatorio:true,opcoes:[{valor:'ENTRADA',texto:'Entrada'},{valor:'SAIDA',texto:'Saída'}]},{chave:'categoria',rotulo:'Categoria',obrigatorio:true},{chave:'valor',rotulo:'Valor (R$)',tipo:'number',min:0.01,obrigatorio:true},{chave:'descricao',rotulo:'Descrição',obrigatorio:true},
      {chave:'cliente',rotulo:'Cliente (opcional)',tipo:'select',opcoes:[{valor:null,texto:'Sem cliente'},...this.clientes.filter(c=>c.id!==undefined).map(c=>({valor:c.id!,texto:c.nome}))]},
      {chave:'status',rotulo:'Situação',tipo:'select',obrigatorio:true,opcoes:[{valor:'PENDENTE',texto:'Pendente'},{valor:'PAGO',texto:'Pago'},{valor:'CANCELADO',texto:'Cancelado'}]},
      {chave:'vencimento',rotulo:'Data de vencimento',tipo:'date',obrigatorio:true,dataMin:m?.dataVencimento && m.dataVencimento<hoje ? m.dataVencimento : hoje,visivel:v=>v['status']==='PENDENTE'},{chave:'pagamento',rotulo:'Data de pagamento',tipo:'date',obrigatorio:true,dataMax:hoje,visivel:v=>v['status']==='PAGO'}],
      valores:{tipo:m?.tipo??'ENTRADA',categoria:m?.categoria??'',valor:m?.valor??null,descricao:m?.descricao??'',cliente:m?.cliente?.id??null,status:m?.status??'PENDENTE',vencimento:m?.dataVencimento??'',pagamento:m?.dataPagamento??hoje},
      salvar:v=>{if (v['status']==='PENDENTE' && String(v['vencimento'])<hoje && v['vencimento']!==m?.dataVencimento) throw new Error('A nova data de vencimento não pode ser anterior a hoje.');
        const dados:LancamentoFinanceiro={tipo:String(v['tipo']),categoria:String(v['categoria']).trim(),valor:Number(v['valor']),descricao:String(v['descricao']).trim(),cliente:v['cliente']?{id:Number(v['cliente'])}:null,status:String(v['status']),dataVencimento:v['status']==='PENDENTE'?String(v['vencimento']):(m?.dataVencimento??null),dataPagamento:v['status']==='PAGO'?String(v['pagamento']):null};
        return m?.id!==undefined?this.financeiroService.atualizar(m.id,dados):this.financeiroService.cadastrar(dados);},conflito:'Este lançamento está vinculado a uma venda e não pode ser alterado manualmente.',sucesso:'Lançamento salvo.',depois:()=>this.carregarMovimentacoes()});
  }
  registrarPagamento(m:LancamentoFinanceiro):void {if(m.id===undefined||m.status!=='PENDENTE')return;const id=m.id;
    this.modal.abrir({titulo:m.tipo==='ENTRADA'?'Registrar recebimento':'Registrar pagamento',descricao:`Confirmar ${m.descricao} no valor de ${m.valor.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}?`,botao:'Confirmar',salvar:()=>this.financeiroService.registrarPagamento(id),conflito:'O lançamento não está mais pendente.',sucesso:'Pagamento registrado.',depois:()=>this.carregarMovimentacoes()});
  }
  excluirLancamento(m:LancamentoFinanceiro):void {if(m.id===undefined||m.venda)return;const id=m.id;
    this.modal.abrir({titulo:'Excluir lançamento',descricao:`Deseja excluir ${m.descricao}?`,botao:'Excluir lançamento',salvar:()=>this.financeiroService.excluir(id),conflito:'Lançamentos vinculados a vendas não podem ser excluídos manualmente.',sucesso:'Lançamento excluído.',depois:()=>this.carregarMovimentacoes()});
  }

  // EXPORTAR CSV

  exportar(): void {

    const colunas = [
      'Descrição',
      'Categoria',
      'Cliente',
      'Venda',
      'Vencimento',
      'Pagamento',
      'Tipo',
      'Valor',
      'Status'
    ];

    const linhas = this.movimentacoesFiltradas.map(m => [

      m.descricao,
      m.categoria,
      this.nomeCliente(m),
      m.venda?.id,
      m.dataVencimento,
      m.dataPagamento,
      m.tipo,
      m.valor,
      this.nomeStatus(m)

    ]);

    baixarCsv('financeiro', colunas, linhas);
  }

}