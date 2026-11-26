import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Clientes } from './clientes';

describe('Clientes', () => {
  let component: Clientes;
  let fixture: ComponentFixture<Clientes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Clientes],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Clientes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('busca por nome e calcula recorrência com vendas concluídas', () => {
    component.baseClientes=[{id:1,nome:'Ana',telefone:'11999999999'},{id:2,nome:'Bia',telefone:'11888888888'}];
    component.vendas=[{cliente:{id:1},status:'CONCLUIDA',total:100,formaPagamento:'PIX',canal:'LOJA',itens:[]},{cliente:{id:1},status:'CONCLUIDA',total:200,formaPagamento:'PIX',canal:'LOJA',itens:[]}];
    component.vendasCarregadas=true;
    component.aoBuscar('ana'); expect(component.total).toBe(1);
    component.limparFiltros(); component.escolherFiltro('Recorrente'); expect(component.total).toBe(1);
    expect(component.perfil(component.baseClientes[0])).toBe('Recorrente'); expect(component.ticketMedio).toBe(150);
  });
});
