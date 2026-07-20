import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Hero } from '../../sections/hero/hero';
import { Sobre } from '../../sections/sobre/sobre';
import { Impressoras3d } from '../../sections/impressoras3d/impressoras3d';
import { Abatedouro } from '../../sections/abatedouro/abatedouro';
import { Vitrine } from '../../sections/vitrine/vitrine';
import { Contato } from '../../sections/contato/contato';

@Component({
  selector: 'app-landing',
  imports: [RouterLink, Hero, Sobre, Impressoras3d, Abatedouro, Vitrine, Contato],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
})
export class Landing {
  readonly nav = [
    { label: 'Sobre', anchor: 'sobre' },
    { label: 'Mini Abatedouro', anchor: 'abatedouro' },
    { label: 'Impressoras 3D', anchor: 'impressoras' },
    { label: 'Produtos', anchor: 'vitrine' },
    { label: 'Contato', anchor: 'contato' },
  ];

  scrollToSection(anchor: string, event: Event): void {
    event.preventDefault();
    document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
