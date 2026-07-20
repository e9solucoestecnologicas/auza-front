import { Component } from '@angular/core';

@Component({
  selector: 'app-sobre',
  templateUrl: './sobre.html',
  styleUrl: './sobre.scss',
})
export class Sobre {
  /** Apenas para gerar os 3 blocos (Missão / Visão / Valores) no wireframe. */
  readonly pilares = [0, 1, 2];
}
