import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Relatorios } from './relatorios';

describe('Relatorios', () => {
  let component: Relatorios;
  let fixture: ComponentFixture<Relatorios>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Relatorios],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Relatorios);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('rejeita período invertido', () => {
    component.inicioSel='2026-11-25';component.fimSel='2026-11-01';component.aplicarFiltros();
    expect(component.erro).toContain('período válido');
  });
  it('não inventa vendas quando a lista está vazia', () => {
    expect(component.produtosVendidos).toBe(0);expect(component.faturamentoPorDia).toEqual([]);
  });
});
