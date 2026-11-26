import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, catchError, of } from 'rxjs';
import { ModalService } from '../shared/modal';
import { mensagemErro } from '../shared/erros';

export const authGuard: CanActivateFn = () => {

  const authService = inject(AuthService);
  const router = inject(Router);

  const modal = inject(ModalService);
  return authService.sessao().pipe(

    map(() => true),

    catchError(erro => {
      if (erro.status !== 401) modal.aviso.set(mensagemErro(erro, 'verificar a sessão'));
      return of(router.createUrlTree(['/login']));
    })

  );
};