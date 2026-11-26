import { Injectable, signal } from '@angular/core';
import { Observable, finalize } from 'rxjs';
import { mensagemErro } from './erros';
export function dataHoje(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
export type Valor = string | number | boolean | null;
export type Valores = Record<string, Valor>;
export interface Campo {
  chave: string; rotulo: string; tipo?: 'text' | 'tel' | 'number' | 'date' | 'select' | 'textarea';
  obrigatorio?: boolean; min?: number; dataMin?: string; dataMax?: string; step?: number; opcoes?: {valor: Valor; texto: string}[];
  visivel?: (v: Valores) => boolean;
}
export interface ProdutoOpcao { id: number; nome: string; preco: number; estoque: number; disponivel: boolean; }
export interface LinhaItem { produtoId: number | null; quantidade: number; }
export interface ConfigModal {
  titulo: string; descricao?: string; botao: string; campos?: Campo[]; valores?: Valores;
  produtos?: ProdutoOpcao[]; itens?: LinhaItem[]; validarEstoque?: boolean;
  salvar: (valores: Valores, itens: LinhaItem[]) => Observable<unknown>;
  sucesso?: string | ((resposta: unknown) => string); depois?: () => void; conflito?: string;
}
@Injectable({providedIn: 'root'})
export class ModalService {
  config = signal<ConfigModal | null>(null);
  valores = signal<Valores>({});
  itens = signal<LinhaItem[]>([]);
  erro = signal('');
  salvando = signal(false);
  aviso = signal('');
  abrir(config: ConfigModal): void {
    if (this.salvando()) return;
    this.erro.set(''); this.aviso.set('');
    this.valores.set({...config.valores});
    this.itens.set(config.itens?.map(i => ({...i})) ?? (config.produtos ? [{produtoId:null, quantidade:1}] : []));
    this.config.set(config);
  }
  fechar(): void { if (!this.salvando()) { this.config.set(null); this.erro.set(''); } }
  mudar(chave: string, valor: Valor): void { this.valores.update(v => ({...v,[chave]:valor})); }
  adicionar(): void { this.itens.update(i => [...i,{produtoId:null, quantidade:1}]); }
  remover(index: number): void { this.itens.update(i => i.filter((_,n) => n!==index)); }
  mudarItem(index: number, chave: 'produtoId' | 'quantidade', valor: number | null): void {
    this.itens.update(i => i.map((item,n) => n===index ? {...item,[chave]:valor} : item));
  }
  get total(): number { return this.itens().reduce((t,i) => t+(this.config()?.produtos?.find(p=>p.id===i.produtoId)?.preco??0)*(i.quantidade||0),0); }
  salvar(): void {
    const c=this.config(); if (!c || this.salvando()) return;
    const v=this.valores(), itens=this.itens();
    this.erro.set('');
    for (const f of c.campos??[]) {
      if (f.visivel && !f.visivel(v)) continue;
      const valor=v[f.chave];
      if (f.tipo==='select' && valor!==null && valor!==undefined && !f.opcoes?.some(o=>o.valor===valor)) { this.erro.set(`Selecione uma opção válida para ${f.rotulo}.`); return; }
      if (f.obrigatorio && (valor===null || valor===undefined || String(valor).trim()==='')) { this.erro.set(`Preencha o campo ${f.rotulo}.`); return; }
      if (f.tipo==='number' && valor!==null && valor!==undefined && valor!=='') {
        const n=Number(valor); if (!Number.isFinite(n) || n<(f.min??0) || (f.step===1 && (!Number.isInteger(n)||n>2147483647))) { this.erro.set(`Informe um valor válido para ${f.rotulo}.`); return; }
      }
      if (f.tipo==='date' && valor) {
        const d=String(valor), dt=new Date(d+'T00:00:00Z');
        if (!/^\d{4}-\d{2}-\d{2}$/.test(d)||!Number.isFinite(dt.getTime())||dt.toISOString().slice(0,10)!==d) {
          this.erro.set(`${f.rotulo}: data inválida.`); return;
        }
        if (f.dataMin && d<f.dataMin) {
          this.erro.set(`${f.rotulo}: data inválida. Não pode ser anterior a ${f.dataMin.split('-').reverse().join('/')}.`); return;
        }
        if (f.dataMax && d>f.dataMax) {
          this.erro.set(`${f.rotulo}: data inválida. Não pode ser posterior a ${f.dataMax.split('-').reverse().join('/')}.`); return;
        }
      }
    }
    if (c.produtos) {
      if (!itens.length) { this.erro.set('Adicione pelo menos um produto.'); return; }
      const quantidades = new Map<number,number>();
      for (const i of itens) {
        const produto=c.produtos.find(p=>p.id===i.produtoId);
        if (!produto || !produto.disponivel) { this.erro.set('Selecione um produto disponível em cada linha.'); return; }
        if (!Number.isSafeInteger(i.quantidade)||i.quantidade<1||i.quantidade>2147483647) { this.erro.set('Informe uma quantidade inteira maior que zero.'); return; }
        const q=(quantidades.get(produto.id)??0)+i.quantidade; quantidades.set(produto.id,q);
        if (q>2147483647 || (c.validarEstoque && q>produto.estoque)) { this.erro.set(`Estoque insuficiente: ${produto.nome}. Disponível: ${produto.estoque}.`); return; }
      }
    }
    try {
      const requisicao=c.salvar(v,itens); this.salvando.set(true);
      requisicao.pipe(finalize(()=>this.salvando.set(false))).subscribe({
        next:resposta=>{ this.config.set(null); this.aviso.set(typeof c.sucesso === 'function' ? c.sucesso(resposta) : c.sucesso??'Operação concluída com sucesso.'); c.depois?.(); },
        error: e=>this.erro.set(mensagemErro(e,'concluir a operação',c.conflito))
      });
    } catch(e) { this.salvando.set(false); this.erro.set(mensagemErro(e)); }
  }
}
