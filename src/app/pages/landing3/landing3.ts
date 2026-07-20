import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Hero } from '../../sections/hero/hero';
import { Sobre } from '../../sections/sobre/sobre';
import { Impressoras3d } from '../../sections/impressoras3d/impressoras3d';
import { Abatedouro } from '../../sections/abatedouro/abatedouro';
import { Vitrine } from '../../sections/vitrine/vitrine';
import { Contato } from '../../sections/contato/contato';

interface NavItem {
  id: string;
  label: string;
}

@Component({
  selector: 'app-landing3',
  imports: [RouterLink, Hero, Sobre, Impressoras3d, Abatedouro, Vitrine, Contato],
  templateUrl: './landing3.html',
  styleUrl: './landing3.scss',
})
export class Landing3 implements AfterViewInit {
  private readonly host = inject(ElementRef) as ElementRef<HTMLElement>;
  private readonly destroyRef = inject(DestroyRef);
  private readonly content = viewChild.required<ElementRef<HTMLElement>>('content');

  readonly sections: NavItem[] = [
    { id: 'hero', label: 'Início' },
    { id: 'sobre', label: 'Sobre Nós' },
    { id: 'abatedouro', label: 'Mini Abatedouro' },
    { id: 'impressoras', label: 'Impressoras 3D' },
    { id: 'vitrine', label: 'Produtos' },
    { id: 'contato', label: 'Contato' },
  ];

  readonly current = signal(0);

  ngAfterViewInit(): void {
    const root = this.content().nativeElement;
    const elements = Array.from(
      root.querySelectorAll<HTMLElement>('[data-section]'),
    );

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            continue;
          }
          const id = (entry.target as HTMLElement).dataset['section'];
          const index = this.sections.findIndex((s) => s.id === id);
          if (index !== -1) {
            this.current.set(index);
          }
        }
      },
      { root, rootMargin: '-45% 0px -45% 0px', threshold: 0 },
    );

    elements.forEach((el) => observer.observe(el));
    this.destroyRef.onDestroy(() => observer.disconnect());
  }

  scrollTo(id: string, index: number): void {
    this.current.set(index);
    const target = this.host.nativeElement.querySelector<HTMLElement>(`[data-section="${id}"]`);
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
