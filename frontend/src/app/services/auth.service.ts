import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of, tap } from 'rxjs';
import { Usuario } from '../shared/usuario';
@Injectable({providedIn:'root'})
export class AuthService {
  private baseUrl='/api/usuarios';
  usuario=signal<Usuario|null>(null);
  constructor(private http:HttpClient) {}
  login(email:string,senha:string) { return this.http.post<Usuario>(`${this.baseUrl}/login`,{email,senha}).pipe(tap(u=>this.usuario.set(u))); }
  sessao() { const u=this.usuario(); return u ? of(u) : this.http.get<Usuario>(`${this.baseUrl}/sessao`).pipe(tap(u=>this.usuario.set(u))); }
  logout() { return this.http.post<void>(`${this.baseUrl}/logout`,{}).pipe(tap(()=>this.usuario.set(null))); }
}
