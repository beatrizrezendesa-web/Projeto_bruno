import { mensagemErro } from '../../app/shared/erros';
import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../app/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {

  private cdr=inject(ChangeDetectorRef);
  entrando=false;
  email = '';
  senha = '';
  erro = '';
  aviso = '';

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  onLogin(): void {

    if(this.entrando)return;
    this.aviso = '';
    this.erro = '';

    if (!this.email.trim() || !/^\S+@\S+\.\S+$/.test(this.email.trim())) {
      this.erro = 'Digite um e-mail válido.';
      return;
    }

    if (!this.senha.trim()) {
      this.erro = 'Digite a sua senha.';
      return;
    }

    this.entrando=true;
    this.authService.login(this.email.trim(), this.senha)
      .subscribe({

        next: () => {
          this.entrando=false; this.cdr.markForCheck();
          this.router.navigate(['/dashboard']);
        },

        error: (erro) => {
          this.entrando=false; this.cdr.markForCheck();

          if (erro.status === 401) {
            this.erro = 'E-mail ou senha incorretos.';
          } else if (erro.status === 0) {
            this.erro = 'Não foi possível conectar ao servidor.';
          } else {
            this.erro = mensagemErro(erro, 'realizar o login');
          }
        }
      });
  }

  esqueciSenha(evento: Event): void {

    evento.preventDefault();

    this.erro = '';

    this.aviso = 'Recuperação de senha ainda não está disponível. Fale com a administração da loja.';
  }
}