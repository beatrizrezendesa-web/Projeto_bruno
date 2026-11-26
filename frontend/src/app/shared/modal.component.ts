import { Component, inject, effect, ElementRef, afterNextRender, Injector } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalService } from './modal';
@Component({selector:'app-modal', imports:[CommonModule, FormsModule], templateUrl:'./modal.html'})
export class ModalComponent {
  modal=inject(ModalService);
  private host=inject<ElementRef<HTMLElement>>(ElementRef);
  private injector=inject(Injector);
  private anterior:HTMLElement|null=null;
  constructor(){
    effect(()=>{
      const aberto=!!this.modal.config();
      afterNextRender(()=>{
        if(aberto){this.anterior=document.activeElement as HTMLElement;this.host.nativeElement.querySelector<HTMLElement>('.jb-modal')?.focus({preventScroll:true});}
        else {this.anterior?.focus();this.anterior=null;}
      },{injector:this.injector});
    });
  }
  teclado(event:KeyboardEvent):void {
    if(event.key==='Escape'){event.preventDefault();this.modal.fechar();return;}
    if(event.key!=='Tab')return;
    const controles=Array.from(this.host.nativeElement.querySelectorAll<HTMLElement>('.jb-modal input:not(:disabled),.jb-modal select:not(:disabled),.jb-modal textarea:not(:disabled),.jb-modal button:not(:disabled)'));
    if(!controles.length){event.preventDefault();return;}
    if(document.activeElement===this.host.nativeElement.querySelector('.jb-modal')){event.preventDefault();controles[event.shiftKey?controles.length-1:0].focus();return;}
    if(event.shiftKey&&document.activeElement===controles[0]){event.preventDefault();controles[controles.length-1].focus();}
    else if(!event.shiftKey&&document.activeElement===controles[controles.length-1]){event.preventDefault();controles[0].focus();}
  }
}
