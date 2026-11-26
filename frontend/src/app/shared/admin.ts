import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ModalService } from './modal';
@Component({selector:'app-admin', imports:[RouterLink,RouterLinkActive,RouterOutlet], templateUrl:'./admin.html'})
export class Admin {
  auth=inject(AuthService); private router=inject(Router); private modal=inject(ModalService);
  sair(): void { this.modal.abrir({titulo:'Encerrar sessão',descricao:'Deseja sair do painel da JB MODA?',botao:'Sair',salvar:()=>this.auth.logout(),depois:()=>{this.modal.aviso.set(''); this.router.navigate(['/login']);}}); }
}
