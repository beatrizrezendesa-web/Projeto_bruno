import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ModalComponent } from './shared/modal.component';
@Component({imports:[RouterOutlet,ModalComponent],selector:'app-root',styleUrl:'./app.css',templateUrl:'./app.html'})
export class App {}
