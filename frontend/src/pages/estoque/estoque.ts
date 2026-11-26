import { finalize } from 'rxjs';
import { ModalService } from '../../app/shared/modal';
import { mensagemErro } from '../../app/shared/erros';
import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

import { baixarCsv } from '../../app/shared/csv';
import { Produto, ProdutoService } from '../../app/services/produto.service';
import { AuthService } from '../../app/services/auth.service';

@Component({
  selector: 'app-estoque',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './estoque.html',
  styleUrls: ['./estoque.css']
})
export class Estoque implements OnInit {

  private cdr = inject(ChangeDetectorRef);
  modal = inject(ModalService);
  get gerente() { return {nome: this.authService.usuario()?.nome || '', cargo: 'Administração'}; }

  produtosVariacoes: Produto[] = [];

  busca = '';
  filtrosAbertos = false;
  filtroSelecionado = 'Todos';
  erro = '';
  private consultas = 0;
  get carregando(): boolean { return this.consultas > 0; }

  constructor(
    private produtoService: ProdutoService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {

    this.carregarProdutos();

  }

  // CARREGAR PRODUTOS

  carregarProdutos(): void {

    this.consultas++;
    this.cdr.markForCheck();
    this.produtoService.listar().pipe(finalize(()=>{ this.consultas--; this.cdr.markForCheck(); })).subscribe({

      next: dados => {
        this.cdr.markForCheck();
        this.produtosVariacoes = dados;
      },

      error: e => {
        this.cdr.markForCheck();
        this.erro = mensagemErro(e, 'carregar os produtos');
      }
    });
  }

  // INDICADORES

  get pecasDisponiveis(): number {

    return this.produtosVariacoes
      .filter(p => p.disponivel)
      .reduce((total, p) => total + p.quantidadeEstoque, 0);
  }

  get valorEstoque(): number {

    return this.produtosVariacoes.reduce(
      (total, p) => total + p.preco * p.quantidadeEstoque,
      0
    );
  }

  get estoqueBaixo(): number {

    return this.produtosVariacoes.filter(
      p => p.quantidadeEstoque > 0
        && p.quantidadeEstoque <= 5
    ).length;
  }

  get semEstoque(): number {

    return this.produtosVariacoes.filter(
      p => p.quantidadeEstoque === 0
    ).length;
  }

  // BUSCA E FILTROS

  get produtosFiltrados(): Produto[] {

    const termo = this.busca.trim().toLocaleLowerCase('pt-BR');

    return this.produtosVariacoes.filter(produto => {

      const buscaOk = !termo || Object.values(produto).some(
        valor => String(valor)
          .toLocaleLowerCase('pt-BR')
          .includes(termo)
      );

      const filtroOk =
        this.filtroSelecionado === 'Todos' ||
        produto.categoria.trim().toLowerCase() ===
        this.filtroSelecionado.toLowerCase();

      return buscaOk && filtroOk;
    });
  }

  get total(): number {
    return this.produtosFiltrados.length;
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

  // CADASTRAR E EDITAR PRODUTO
  novoProduto(): void { this.formularioProduto(); }
  editarProduto(produto: Produto): void { this.formularioProduto(produto); }
  private formularioProduto(produto?: Produto): void {
    this.modal.abrir({titulo:produto?'Editar produto':'Cadastrar produto',botao:'Salvar produto',
      campos:[{chave:'nome',rotulo:'Nome do produto',obrigatorio:true},{chave:'categoria',rotulo:'Categoria',tipo:'select',obrigatorio:true,opcoes:[{valor:'Fitness',texto:'Fitness'},{valor:'Praia',texto:'Praia'}]},
      {chave:'tamanho',rotulo:'Tamanho',obrigatorio:true},{chave:'cor',rotulo:'Cor',obrigatorio:true},{chave:'preco',rotulo:'Preço (R$)',tipo:'number',min:0.01,obrigatorio:true},{chave:'quantidadeEstoque',rotulo:'Estoque inicial / atual',tipo:'number',step:1,min:0,obrigatorio:true}],
      valores:{nome:produto?.nome??'',categoria:produto?.categoria??'Fitness',tamanho:produto?.tamanho??'',cor:produto?.cor??'',preco:produto?.preco??null,quantidadeEstoque:produto?.quantidadeEstoque??0},
      salvar:v=>{ const dados:Produto={nome:String(v['nome']).trim(),categoria:String(v['categoria']),tamanho:String(v['tamanho']).trim(),cor:String(v['cor']).trim(),preco:Number(v['preco']),quantidadeEstoque:Number(v['quantidadeEstoque']),disponivel:produto?.disponivel??true};
        return produto?.id!==undefined?this.produtoService.atualizar(produto.id,dados):this.produtoService.cadastrar(dados); },sucesso:'Produto salvo com sucesso.',depois:()=>this.carregarProdutos()});
  }
  excluirProduto(produto: Produto): void {
    if(produto.id===undefined)return; const id=produto.id;
    this.modal.abrir({titulo:'Excluir produto',descricao:`Deseja excluir ${produto.nome}?`,botao:'Excluir produto',salvar:()=>this.produtoService.excluir(id),conflito:'Este produto não pode ser excluído porque possui pedidos ou vendas vinculados.',sucesso:'Produto excluído.',depois:()=>this.carregarProdutos()});
  }
  alterarDisponibilidade(produto: Produto): void {
    if(produto.id===undefined)return; const id=produto.id;
    this.modal.abrir({titulo:produto.disponivel?'Desativar produto':'Ativar produto',descricao:`Alterar a disponibilidade de ${produto.nome}?`,botao:'Confirmar',salvar:()=>this.produtoService.atualizar(id,{...produto,disponivel:!produto.disponivel}),sucesso:'Disponibilidade atualizada.',depois:()=>this.carregarProdutos()});
  }

  // EXPORTAR CSV

  exportar(): void {

    const colunas = [
      'ID',
      'Produto',
      'Categoria',
      'Cor',
      'Tamanho',
      'Preço',
      'Estoque',
      'Disponível'
    ];

    const linhas = this.produtosFiltrados.map(produto => [

      produto.id,
      produto.nome,
      produto.categoria,
      produto.cor,
      produto.tamanho,
      produto.preco,
      produto.quantidadeEstoque,
      produto.disponivel ? 'Sim' : 'Não'

    ]);

    baixarCsv('estoque', colunas, linhas);
  }

}