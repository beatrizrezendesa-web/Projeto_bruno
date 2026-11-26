import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ModalService } from '../shared/modal';
export const authInterceptor:HttpInterceptorFn=(req,next)=>{
  if(!req.url.startsWith('/api/')) return next(req);
  const router=inject(Router), auth=inject(AuthService), modal=inject(ModalService);
  return next(req.clone({withCredentials:true})).pipe(catchError(e=>{
    if(e.status===401 && !req.url.endsWith('/usuarios/login')) {
      auth.usuario.set(null); modal.config.set(null); modal.aviso.set('Sua sessão expirou. Entre novamente.');
      router.navigate(['/login']);
    }
    return throwError(()=>e);
  }));
};
