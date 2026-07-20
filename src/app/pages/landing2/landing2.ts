import { Component, HostListener, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Hero } from '../../sections/hero/hero';
import { Sobre } from '../../sections/sobre/sobre';
import { Impressoras3d } from '../../sections/impressoras3d/impressoras3d';
import { Abatedouro } from '../../sections/abatedouro/abatedouro';
import { Vitrine } from '../../sections/vitrine/vitrine';
import { Contato } from '../../sections/contato/contato';

interface Slide {
  id: string;
  label: string;
}

@Component({
  selector: 'app-landing2',
  imports: [RouterLink, Hero, Sobre, Impressoras3d, Abatedouro, Vitrine, Contato],
  templateUrl: './landing2.html',
  styleUrl: './landing2.scss',
})
export class Landing2 {
  readonly slides: Slide[] = [
    { id: 'hero', label: 'Início' },
    { id: 'sobre', label: 'Sobre Nós' },
    { id: 'abatedouro', label: 'Mini Abatedouro' },
    { id: 'impressoras', label: 'Impressoras 3D' },
    { id: 'vitrine', label: 'Produtos' },
    { id: 'contato', label: 'Contato' },
  ];

  readonly current = signal(0);

  private locked = false;
  private touchStartY = 0;

  goTo(index: number): void {
    const clamped = Math.max(0, Math.min(this.slides.length - 1, index));
    this.current.set(clamped);
  }

  next(): void {
    this.goTo(this.current() + 1);
  }

  prev(): void {
    this.goTo(this.current() - 1);
  }

  get isFirst(): boolean {
    return this.current() === 0;
  }

  get isLast(): boolean {
    return this.current() === this.slides.length - 1;
  }

  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent): void {
    event.preventDefault();
    if (this.locked || Math.abs(event.deltaY) < 12) {
      return;
    }
    this.lockBriefly();
    if (event.deltaY > 0) {
      this.next();
    } else {
      this.prev();
    }
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (['ArrowDown', 'PageDown', ' '].includes(event.key)) {
      event.preventDefault();
      this.next();
    } else if (['ArrowUp', 'PageUp'].includes(event.key)) {
      event.preventDefault();
      this.prev();
    } else if (event.key === 'Home') {
      this.goTo(0);
    } else if (event.key === 'End') {
      this.goTo(this.slides.length - 1);
    }
  }

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    this.touchStartY = event.changedTouches[0].clientY;
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent): void {
    const deltaY = this.touchStartY - event.changedTouches[0].clientY;
    if (Math.abs(deltaY) < 50) {
      return;
    }
    if (deltaY > 0) {
      this.next();
    } else {
      this.prev();
    }
  }

  private lockBriefly(): void {
    this.locked = true;
    setTimeout(() => (this.locked = false), 800);
  }
}
