import { finalize } from 'rxjs';
import { ModalService, dataHoje } from '../../app/shared/modal';
import { mensagemErro } from '../../app/shared/erros';
import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

import { baixarCsv } from '../../app/shared/csv';

import {
  Pedido,
  ItemPedido,
  PedidoService
} from '../../app/services/pedido.service';

import {
  Cliente,
  ClienteService
} from '../../app/services/cliente.service';

import {
  Produto,
  ProdutoService
} from '../../app/services/produto.service';

import { AuthService } from '../../app/services/auth.service';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './pedidos.html',
  styleUrls: ['./pedidos.css']
})
export class Pedidos implements OnInit {

  private cdr = inject(ChangeDetectorRef);
  modal = inject(ModalService);
  get gerente() { return {nome: this.authService.usuario()?.nome || '', cargo: 'Administração'}; }

  todosOsPedidos: Pedido[] = [];
  clientes: Cliente[] = [];
  produtos: Produto[] = [];

  busca = '';
  filtrosAbertos = false;
  filtroSelecionado = 'Todos';
  erro = '';
  private consultas = 0;
  get carregando(): boolean { return this.consultas > 0; }

  constructor(
    private pedidoService: PedidoService,
    private clienteService: ClienteService,
    private produtoService: ProdutoService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {

    this.carregarPedidos();
    this.carregarClientes();
    this.carregarProdutos();

  }

  // CARREGAR DADOS

  carregarPedidos(): void {

    this.consultas++;
    this.cdr.markForCheck();
    this.pedidoService.listar().pipe(finalize(()=>{ this.consultas--; this.cdr.markForCheck(); })).subscribe({

      next: dados => {
        this.cdr.markForCheck();
        this.todosOsPedidos = dados;
      },

      error: e => {
        this.cdr.markForCheck();
        this.erro = mensagemErro(e, 'carregar os pedidos');
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

  get pedidosNoMes(): number {

    const hoje = new Date();

    return this.todosOsPedidos.filter(pedido => {

      if (!pedido.data) return false;

      const data = new Date(pedido.data);

      return data.getMonth() === hoje.getMonth()
        && data.getFullYear() === hoje.getFullYear();

    }).length;
  }

  get abertos(): number {

    return this.todosOsPedidos.filter(
      p => p.status === 'ABERTO'
    ).length;
  }

  get concluidos(): number {

    return this.todosOsPedidos.filter(
      p => p.status === 'CONCLUIDO'
    ).length;
  }

  get cancelados(): number {

    return this.todosOsPedidos.filter(
      p => p.status === 'CANCELADO'
    ).length;
  }

  // INFORMAÇÕES DOS PEDIDOS

  nomeCliente(pedido: Pedido): string {

    if ('nome' in pedido.cliente) {
      return pedido.cliente.nome;
    }

    return this.clientes.find(
      c => c.id === pedido.cliente.id
    )?.nome || '—';
  }

  nomeProduto(item: ItemPedido): string {

    if ('nome' in item.produto) {
      return item.produto.nome;
    }

    return this.produtos.find(
      p => p.id === item.produto.id
    )?.nome || '—';
  }

  valorPedido(pedido: Pedido): number {

    let total = pedido.frete || 0;

    for (const item of pedido.itens) {

      total += (item.precoUnitario || 0)
        * item.quantidade;
    }

    return total;
  }

  // BUSCA E FILTROS

  get pedidosFiltrados(): Pedido[] {

    const termo = this.busca.trim()
      .toLocaleLowerCase('pt-BR');

    return this.todosOsPedidos.filter(pedido => {

      const buscaOk =
        String(pedido.id).includes(termo) ||
        this.nomeCliente(pedido)
          .toLowerCase().includes(termo) ||
        pedido.tipoEntrega
          .toLowerCase().includes(termo) ||
        pedido.itens.some(item =>
          this.nomeProduto(item)
            .toLowerCase().includes(termo)
        );

      const filtroOk =
        this.filtroSelecionado === 'Todos' ||
        pedido.status === this.filtroSelecionado;

      return buscaOk && filtroOk;
    });
  }

  get total(): number {
    return this.pedidosFiltrados.length;
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

  // FORMULÁRIOS DE PEDIDO
  novoPedido(): void { this.formularioPedido(); }
  editarPedido(pedido: Pedido): void { this.formularioPedido(pedido); }
  private formularioPedido(pedido?: Pedido): void {
    if(pedido && pedido.status!=='ABERTO') return;
    if (!this.clientes.length) { this.erro='Cadastre um cliente antes de continuar.'; return; }
    if (!this.produtos.some(p=>p.disponivel && p.quantidadeEstoque>0)) { this.erro='Não há produtos com estoque disponível. Cadastre um produto ou reponha o estoque.'; return; }
    this.modal.abrir({titulo:pedido?'Editar pedido':'Novo pedido',botao:'Salvar pedido',
      campos:[{chave:'cliente',rotulo:'Cliente',tipo:'select',obrigatorio:true,opcoes:[{valor:null,texto:'Selecione um cliente'},...this.clientes.filter(c=>c.id!==undefined).map(c=>({valor:c.id!,texto:c.nome}))]},
      {chave:'entrega',rotulo:'Tipo de entrega',tipo:'select',obrigatorio:true,opcoes:[{valor:'RETIRADA',texto:'Retirada'},{valor:'ENTREGA',texto:'Entrega'}]},
      {chave:'endereco',rotulo:'Endereço de entrega',obrigatorio:true,visivel:v=>v['entrega']==='ENTREGA'},{chave:'frete',rotulo:'Frete (R$)',tipo:'number',min:0,obrigatorio:true,visivel:v=>v['entrega']==='ENTREGA'},{chave:'observacoes',rotulo:'Observações',tipo:'textarea'}],
      valores:{cliente:pedido?.cliente.id??null,entrega:pedido?.tipoEntrega??'RETIRADA',endereco:pedido?.enderecoEntrega??'',frete:pedido?.frete??0,observacoes:pedido?.observacoes??''},
      validarEstoque:true, produtos:this.produtos.filter(p=>p.id!==undefined).map(p=>({id:p.id!,nome:`${p.nome} — ${p.cor}/${p.tamanho}`,preco:p.preco,estoque:p.quantidadeEstoque,disponivel:p.disponivel})), itens:pedido?.itens.map(i=>({produtoId:i.produto.id??null,quantidade:i.quantidade})),
      salvar:(v,itens)=>{ const dados:Pedido={status:'ABERTO',cliente:{id:Number(v['cliente'])},tipoEntrega:String(v['entrega']),enderecoEntrega:v['entrega']==='ENTREGA'?String(v['endereco']).trim():'',frete:v['entrega']==='ENTREGA'?Number(v['frete']):0,observacoes:String(v['observacoes']??''),itens:itens.map(i=>({produto:{id:i.produtoId!},quantidade:i.quantidade}))};
        return pedido?.id!==undefined?this.pedidoService.atualizar(pedido.id,dados):this.pedidoService.cadastrar(dados); },sucesso:resposta=>{const id=(resposta as Pedido | null)?.id;return id!==undefined ? `Pedido #${id} salvo com sucesso.` : 'Pedido salvo com sucesso.';},depois:()=>this.carregarPedidos()});
  }
  confirmarPedido(pedido: Pedido): void {
    if(pedido.id===undefined||pedido.status!=='ABERTO')return; const id=pedido.id;
    this.modal.abrir({titulo:'Confirmar pedido #'+id,descricao:'A confirmação registra a venda, movimenta o estoque e gera o lançamento financeiro.',botao:'Confirmar pedido',campos:[{chave:'forma',rotulo:'Forma de pagamento',tipo:'select',obrigatorio:true,opcoes:[{valor:'PIX',texto:'Pix'},{valor:'DEBITO',texto:'Débito'},{valor:'CREDITO',texto:'Crédito'}]},
      {chave:'canal',rotulo:'Canal de venda',tipo:'select',obrigatorio:true,opcoes:[{valor:'LOJA',texto:'Loja'},{valor:'WHATSAPP',texto:'WhatsApp'},{valor:'INSTAGRAM',texto:'Instagram'}]},
      {chave:'status',rotulo:'Status do pagamento',tipo:'select',obrigatorio:true,opcoes:[{valor:'PAGO',texto:'Pago'},{valor:'PENDENTE',texto:'Pendente'}]},
      {chave:'vencimento',rotulo:'Data de vencimento',tipo:'date',obrigatorio:true,dataMin:dataHoje(),visivel:v=>v['status']==='PENDENTE'}],valores:{forma:'PIX',canal:'LOJA',status:'PENDENTE',vencimento:''},
      salvar:v=>this.pedidoService.confirmar(id,String(v['forma']),String(v['canal']),String(v['status']),v['status']==='PENDENTE'?String(v['vencimento']):undefined),
      conflito:'Não foi possível confirmar o pedido. Confira se ele ainda está aberto e se todos os produtos estão disponíveis e têm estoque suficiente.',sucesso:'Pedido convertido em venda. Consulte a situação do pagamento no Financeiro.',depois:()=>{this.carregarPedidos();this.carregarProdutos();}});
  }
  cancelarPedido(pedido:Pedido):void { if(pedido.id===undefined||pedido.status!=='ABERTO')return;const id=pedido.id;
    this.modal.abrir({titulo:'Cancelar pedido',descricao:`Deseja cancelar o pedido #${id}?`,botao:'Cancelar pedido',salvar:()=>this.pedidoService.cancelar(id),conflito:'O pedido não está mais aberto e não pode ser cancelado.',sucesso:'Pedido cancelado.',depois:()=>this.carregarPedidos()});
  }

  // EXPORTAR CSV

  exportar(): void {

    const colunas = [
      'Pedido',
      'Cliente',
      'Data',
      'Tipo de entrega',
      'Frete',
      'Valor',
      'Status'
    ];

    const linhas = this.pedidosFiltrados.map(pedido => [

      pedido.id,
      this.nomeCliente(pedido),
      pedido.data,
      pedido.tipoEntrega,
      pedido.frete,
      this.valorPedido(pedido),
      pedido.status

    ]);

    baixarCsv('pedidos', colunas, linhas);
  }

}