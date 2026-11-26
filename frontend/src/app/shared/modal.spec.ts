import { HttpErrorResponse } from '@angular/common/http';
import { of, Subject, throwError } from 'rxjs';
import { ModalService } from './modal';
describe('ModalService',()=>{
  it('não envia campos obrigatórios vazios',()=>{
    const m=new ModalService();let enviado=false;
    m.abrir({titulo:'Cliente',botao:'Salvar',campos:[{chave:'nome',rotulo:'Nome',obrigatorio:true}],salvar:()=>{enviado=true;return of(null);}});
    m.salvar();expect(enviado).toBe(false);expect(m.erro()).toContain('Nome');
  });
  it('mantém formulário aberto e valores em caso de conflito',()=>{
    const m=new ModalService();m.abrir({titulo:'Excluir cliente',botao:'Excluir',valores:{nome:'Ana'},conflito:'Ana possui vendas ou pedidos vinculados.',salvar:()=>throwError(()=>new HttpErrorResponse({status:409}))});
    m.salvar();expect(m.config()).not.toBeNull();expect(m.valores()['nome']).toBe('Ana');expect(m.erro()).toContain('vinculados');
  });
  it('não permite dois envios simultâneos',()=>{
    const m=new ModalService(), resposta=new Subject<void>();let chamadas=0;
    m.abrir({titulo:'Venda',botao:'Salvar',salvar:()=>{chamadas++;return resposta;}});m.salvar();m.salvar();expect(chamadas).toBe(1);resposta.next();resposta.complete();expect(m.config()).toBeNull();expect(m.salvando()).toBe(false);
  });
  it('soma quantidades repetidas e bloqueia estoque insuficiente',()=>{
    const m=new ModalService();let enviado=false;m.abrir({titulo:'Venda',botao:'Salvar',produtos:[{id:1,nome:'Top',preco:50,estoque:3,disponivel:true}],itens:[{produtoId:1,quantidade:2},{produtoId:1,quantidade:2}],validarEstoque:true,salvar:()=>{enviado=true;return of(null);}});m.salvar();expect(enviado).toBe(false);expect(m.erro()).toContain('Estoque insuficiente');
  });
  it('recusa vencimento anterior à data mínima', () => {
    const modal = new ModalService(); let enviado = false;
    modal.abrir({titulo:'Venda',botao:'Salvar',campos:[{chave:'vencimento',rotulo:'Vencimento',tipo:'date',dataMin:'2026-11-26',obrigatorio:true}],valores:{vencimento:'1956-02-10'},salvar:()=>{enviado=true;return of(null);}});
    modal.salvar(); expect(enviado).toBe(false); expect(modal.erro()).toContain('data inválida');
  });
  it('recusa pagamento posterior à data máxima', () => {
    const modal = new ModalService(); let enviado = false;
    modal.abrir({titulo:'Financeiro',botao:'Salvar',campos:[{chave:'pagamento',rotulo:'Pagamento',tipo:'date',dataMax:'2026-11-26',obrigatorio:true}],valores:{pagamento:'2026-11-30'},salvar:()=>{enviado=true;return of(null);}});
    modal.salvar(); expect(enviado).toBe(false); expect(modal.erro()).toContain('data inválida');
  });
  it('mostra o campo rejeitado pelo servidor, em português', () => {
    const modal = new ModalService();
    modal.abrir({titulo:'Pedido',botao:'Salvar',salvar:()=>throwError(()=>new HttpErrorResponse({status:400,error:{message:"Validation failed for object='pedido'",errors:[{field:'tipoEntrega'}]}}))});
    modal.salvar(); expect(modal.config()).not.toBeNull(); expect(modal.erro()).toContain('Tipo de entrega'); expect(modal.erro()).not.toContain('Validation failed');
  });
});
