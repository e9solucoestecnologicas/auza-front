import { Component } from '@angular/core';

@Component({
  selector: 'app-vitrine',
  templateUrl: './vitrine.html',
  styleUrl: './vitrine.scss',
})
export class Vitrine {
  /** Apenas para gerar os cards da grade no wireframe. */
  readonly produtos = [0, 1, 2, 3, 4, 5];
}
