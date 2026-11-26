import { ModalService, dataHoje } from '../../app/shared/modal';
import { mensagemErro } from '../../app/shared/erros';
import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin, tap } from 'rxjs';

import { baixarCsv } from '../../app/shared/csv';

import {
  RelatorioService,
  RelatorioVendas,
  RelatorioFinanceiro
} from '../../app/services/relatorio.service';

import {
  Venda,
  VendaService
} from '../../app/services/venda.service';

import {
  Produto
} from '../../app/services/produto.service';

import { FinanceiroService, LancamentoFinanceiro } from '../../app/services/financeiro.service';
import { AuthService } from '../../app/services/auth.service';

interface Indicador {

  titulo: string;
  valor: string;
  legenda: string;
  destaque?: boolean;

}

interface RelatorioDisponivel {

  nome: string;
  arquivo: string;
  colunas: string[];
  linhas: (string | number | null | undefined)[][];

}

@Component({
  selector: 'app-relatorios',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './relatorios.html',
  styleUrls: ['./relatorios.css']
})
export class Relatorios implements OnInit {

  private cdr = inject(ChangeDetectorRef);
  modal = inject(ModalService);
  get gerente() { return {nome: this.authService.usuario()?.nome || '', cargo: 'Administração'}; }

  resumoVendas: RelatorioVendas | null = null;
  resumoFinanceiro: RelatorioFinanceiro | null = null;
  private financeiroService = inject(FinanceiroService);
  movimentacoes: LancamentoFinanceiro[] = [];
  pendencias(tipo: string): number {
    return this.movimentacoes.filter(m=>m.status==='PENDENTE' && m.tipo===tipo).reduce((s,m)=>s+m.valor,0);
  }

  vendas: Venda[] = [];
  estoqueBaixo: Produto[] = [];

  busca = '';
  erro = '';
  carregando = false;

  filtrosAbertos = false;

  inicio = this.primeiroDiaMes();
  fim = this.ultimoDiaMes();

  inicioSel = this.inicio;
  fimSel = this.fim;

  limiteEstoque = 5;
  limiteSel = 5;

  readonly largura = 360;
  readonly altura = 150;

  constructor(
    private relatorioService: RelatorioService,
    private vendaService: VendaService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {

    this.carregarRelatorios();

  }

  // CARREGAR RELATÓRIOS

  carregarRelatorios(): void {

    this.erro = '';
    this.carregando = true;

    forkJoin({

      vendas: this.relatorioService.vendas(
        this.inicio, this.fim
      ),

      financeiro: this.relatorioService.financeiro(
        this.inicio, this.fim
      ),

      estoque: this.relatorioService.estoque(
        this.limiteEstoque
      ),

      listaVendas: this.vendaService.listar(),
      movimentacoes: this.financeiroService.listar()

    }).subscribe({

      next: dados => {
        this.cdr.markForCheck();

        this.resumoVendas = dados.vendas;
        this.resumoFinanceiro = dados.financeiro;
        this.movimentacoes = dados.movimentacoes;
        this.estoqueBaixo = dados.estoque;

        this.vendas = dados.listaVendas.filter(venda => {

          const data = venda.data?.substring(0, 10);

          return venda.status === 'CONCLUIDA'
            && !!data
            && data >= this.inicio
            && data <= this.fim;

        });

        this.carregando = false;
      },

      error: e => {
        this.cdr.markForCheck();

        this.erro = mensagemErro(e, 'carregar os relatórios');
        this.carregando = false;

        this.resumoVendas = null;
        this.resumoFinanceiro = null;
        this.movimentacoes = [];
        this.estoqueBaixo = [];
        this.vendas = [];
      }
    });
  }

  // INDICADORES

  get produtosVendidos(): number {

    return this.vendas.reduce((total, venda) => {

      return total + venda.itens.reduce(
        (soma, item) => soma + item.quantidade, 0
      );

    }, 0);
  }

  get indicadores(): Indicador[] {

    return [

      {
        titulo: 'Faturamento',
        valor: this.moeda(
          this.resumoVendas?.totalVendido ?? 0
        ),
        legenda: 'Vendas concluídas no período'
      },

      {
        titulo: 'Saldo financeiro',
        valor: this.moeda(
          this.resumoFinanceiro?.saldo ?? 0
        ),
        legenda: 'Entradas menos saídas'
      },

      {
        titulo: 'Produtos vendidos',
        valor: String(this.produtosVendidos),
        legenda: 'Peças vendidas no período'
      },

      {
        titulo: 'Estoque baixo',
        valor: String(this.estoqueBaixo.length),
        legenda: 'Produtos que precisam de reposição',
        destaque: true
      }

    ];
  }

  // PERÍODO E FILTROS

  get periodo(): string {

    return this.formatarData(this.inicio) +
      ' — ' + this.formatarData(this.fim);
  }

  get filtrosAtivos(): number {

    let quantidade = 0;

    if (this.inicio !== this.primeiroDiaMes()
        || this.fim !== this.ultimoDiaMes()) {

      quantidade++;
    }

    if (this.limiteEstoque !== 5) {

      quantidade++;
    }

    return quantidade;
  }

  alternarFiltros(): void {

    this.filtrosAbertos = !this.filtrosAbertos;

    this.inicioSel = this.inicio;
    this.fimSel = this.fim;
    this.limiteSel = this.limiteEstoque;
  }

  aplicarFiltros(): void {

    if (!this.inicioSel || !this.fimSel
        || this.inicioSel > this.fimSel) {

      this.erro = 'Informe um período válido.';
      return;
    }

    if (!Number.isInteger(this.limiteSel)
        || this.limiteSel < 0) {

      this.erro = 'Informe um limite de estoque válido.';
      return;
    }

    this.inicio = this.inicioSel;
    this.fim = this.fimSel;
    this.limiteEstoque = this.limiteSel;

    this.filtrosAbertos = false;

    this.carregarRelatorios();
  }

  limparFiltros(): void {

    this.inicio = this.primeiroDiaMes();
    this.fim = this.ultimoDiaMes();
    this.limiteEstoque = 5;

    this.inicioSel = this.inicio;
    this.fimSel = this.fim;
    this.limiteSel = 5;

    this.filtrosAbertos = false;

    this.carregarRelatorios();
  }

  // GRÁFICO DE FATURAMENTO POR DATA

  get faturamentoPorDia(): { data: string; valor: number }[] {

    const valores: Record<string, number> = {};

    for (const venda of this.vendas) {

      if (!venda.data) continue;

      const data = venda.data.substring(0, 10);

      valores[data] =
        (valores[data] ?? 0) + (venda.total ?? 0);
    }

    return Object.keys(valores).sort().map(data => ({

      data,
      valor: valores[data]

    }));
  }

  get pontos(): { x: number; y: number }[] {

    const faturamento = this.faturamentoPorDia;

    if (faturamento.length === 0) return [];

    const maximo = Math.max(
      1, ...faturamento.map(f => f.valor)
    );

    const passo = (this.largura - 40) /
      Math.max(1, faturamento.length - 1);

    return faturamento.map((f, i) => ({

      x: faturamento.length === 1
        ? this.largura / 2
        : 20 + i * passo,

      y: 120 - (f.valor / maximo) * 100

    }));
  }

  get linha(): string {

    return this.pontos.map(
      p => `${p.x},${p.y}`
    ).join(' ');
  }

  get area(): string {

    const pontos = this.pontos;

    if (pontos.length === 0) return '';

    return `${pontos[0].x},120 ` +
      `${this.linha} ` +
      `${pontos[pontos.length - 1].x},120`;
  }

  // GRÁFICO DE PARTICIPAÇÃO POR CATEGORIA

  get categorias(): {
    nome: string;
    pct: number;
    cor: string;
  }[] {

    const valores: Record<string, number> = {};

    const cores = [
      '#6b1d2f',
      '#774a58',
      '#b88775'
    ];

    for (const venda of this.vendas) {

      for (const item of venda.itens) {

        if (!('categoria' in item.produto)) {
          continue;
        }

        const categoria = item.produto.categoria;

        const valor =
          (item.precoUnitario ?? 0) * item.quantidade;

        valores[categoria] =
          (valores[categoria] ?? 0) + valor;
      }
    }

    const total = Object.values(valores).reduce(
      (soma, valor) => soma + valor, 0
    );

    return Object.entries(valores).map(
      ([nome, valor], i) => ({

        nome,

        pct: total > 0
          ? Math.round(valor / total * 100)
          : 0,

        cor: cores[i % cores.length]

      })
    );
  }

  // CLIENTES E RECORRÊNCIA

  get recorrencia(): RelatorioDisponivel {

    const clientes: Record<number, {
      nome: string;
      compras: number;
      total: number;
    }> = {};

    for (const venda of this.vendas) {

      const id = venda.cliente.id;

      if (id === undefined) continue;

      if (!clientes[id]) {

        clientes[id] = {

          nome: 'nome' in venda.cliente
            ? venda.cliente.nome
            : 'Cliente #' + id,

          compras: 0,
          total: 0

        };
      }

      clientes[id].compras++;

      clientes[id].total += venda.total ?? 0;
    }

    return {

      nome: 'Clientes e recorrência',

      arquivo: 'clientes-e-recorrencia',

      colunas: [
        'Cliente',
        'Compras no período',
        'Total comprado (R$)'
      ],

      linhas: Object.values(clientes).map(c => [

        c.nome,
        c.compras,
        c.total

      ])
    };
  }

  // RELATÓRIOS DISPONÍVEIS

  get relatorios(): RelatorioDisponivel[] {

    return [

      {
        nome: 'Vendas por período',
        arquivo: 'vendas-por-periodo',

        colunas: [
          'Início',
          'Fim',
          'Quantidade de vendas',
          'Total vendido (R$)'
        ],

        linhas: [[

          this.inicio,
          this.fim,
          this.resumoVendas?.quantidadeVendas ?? 0,
          this.resumoVendas?.totalVendido ?? 0

        ]]
      },

      {
        nome: 'Estoque baixo',
        arquivo: 'estoque-baixo',

        colunas: [
          'ID',
          'Produto',
          'Categoria',
          'Cor',
          'Tamanho',
          'Quantidade'
        ],

        linhas: this.estoqueBaixo.map(p => [

          p.id,
          p.nome,
          p.categoria,
          p.cor,
          p.tamanho,
          p.quantidadeEstoque

        ])
      },

      this.recorrencia,

      {
        nome: 'Fluxo de caixa',
        arquivo: 'fluxo-de-caixa',

        colunas: [
          'Indicador',
          'Valor (R$)'
        ],

        linhas: [

          ['Entradas', this.resumoFinanceiro?.entradas ?? 0],
          ['Saídas', this.resumoFinanceiro?.saidas ?? 0],
          ['Saldo', this.resumoFinanceiro?.saldo ?? 0],
          ['A receber (vencimento no período)', this.resumoFinanceiro?.aReceber ?? 0],
          ['A pagar (vencimento no período)', this.resumoFinanceiro?.aPagar ?? 0],
          ['A receber (todas as pendências)', this.pendencias('ENTRADA')],
          ['A pagar (todas as pendências)', this.pendencias('SAIDA')]

        ]
      }

    ];
  }

  // BUSCA

  get relatoriosFiltrados(): RelatorioDisponivel[] {

    const termo = this.busca.trim().toLowerCase();

    return this.relatorios.filter(
      r => r.nome.toLowerCase().includes(termo)
    );
  }

  onBusca(evento: Event): void {

    this.busca =
      (evento.target as HTMLInputElement).value;
  }

  // EXPORTAR CSV

  gerar(relatorio: RelatorioDisponivel): void {

    if (this.carregando || this.erro) return;

    baixarCsv(

      relatorio.arquivo,
      relatorio.colunas,
      relatorio.linhas

    );
  }

  exportar(): void {

    if (this.carregando || this.erro) return;

    baixarCsv(

      'resumo-relatorios',

      ['Indicador', 'Valor', 'Observação'],

      [

        ['Período', this.periodo, ''],

        ...this.indicadores.map(i => [

          i.titulo,
          i.valor,
          i.legenda

        ])

      ]
    );
  }

  abrirRelatorio():void {
    this.modal.abrir({titulo:'Gerar relatório',botao:'Gerar CSV',campos:[
      {chave:'tipo',rotulo:'Tipo de relatório',tipo:'select',obrigatorio:true,opcoes:this.relatorios.map((r,i)=>({valor:i,texto:r.nome}))},
      {chave:'inicio',rotulo:'Data inicial',tipo:'date',obrigatorio:true},{chave:'fim',rotulo:'Data final',tipo:'date',obrigatorio:true},
      {chave:'limite',rotulo:'Limite de estoque',tipo:'number',step:1,min:0,obrigatorio:true,visivel:v=>v['tipo']===1}],
      valores:{tipo:0,inicio:this.inicio,fim:this.fim,limite:this.limiteEstoque},salvar:v=>{
        const inicio=String(v['inicio']), fim=String(v['fim']), limite=Number(v['limite']);
        if(inicio>fim)throw new Error('A data inicial não pode ser posterior à final.');
        return forkJoin({vendas:this.relatorioService.vendas(inicio,fim),financeiro:this.relatorioService.financeiro(inicio,fim),estoque:this.relatorioService.estoque(limite),listaVendas:this.vendaService.listar(),movimentacoes:this.financeiroService.listar()}).pipe(tap(d=>{
          this.inicio=inicio;this.fim=fim;this.limiteEstoque=limite;this.resumoVendas=d.vendas;this.resumoFinanceiro=d.financeiro;this.movimentacoes=d.movimentacoes;this.estoqueBaixo=d.estoque;
          this.vendas=d.listaVendas.filter(x=>x.status==='CONCLUIDA'&&!!x.data&&x.data.slice(0,10)>=inicio&&x.data.slice(0,10)<=fim);
          this.erro='';this.cdr.markForCheck();this.gerar(this.relatorios[Number(v['tipo'])]);
        }));
      },sucesso:'Relatório gerado em CSV.'});
  }

  // DATAS E FORMATAÇÃO

  private dataHoje(): string { return dataHoje(); }

  private ultimoDiaMes(): string {
    const hoje = new Date();
    const dia = new Date(hoje.getFullYear(), hoje.getMonth()+1, 0).getDate();
    return this.dataHoje().slice(0,7) + "-" + String(dia).padStart(2,"0");
  }

  private primeiroDiaMes(): string {

    return this.dataHoje().substring(0, 7) + '-01';
  }

  formatarData(data: string): string {

    return data.split('-').reverse().join('/');
  }

  private moeda(valor: number): string {

    return valor.toLocaleString('pt-BR', {

      style: 'currency',
      currency: 'BRL'

    });
  }

}