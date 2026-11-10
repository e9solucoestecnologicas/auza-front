import { Injectable } from '@angular/core';

/**
 * Bibliotecas pesadas que só a página /design-system usa (three.js e Lucide),
 * carregadas sob demanda de /public/ds-assets.
 *
 * Tailwind e fontes não passam mais por aqui: o Tailwind é compilado no build
 * (tailwind.config.js) e as fontes são declaradas no index.html.
 */
@Injectable({ providedIn: 'root' })
export class DsAssets {
  loadThree(): Promise<void> {
    return this.injectScript('/ds-assets/three.lib.js', 'ds-three');
  }

  /** Carrega o Lucide e renderiza os ícones presentes no DOM. */
  loadLucide(): Promise<void> {
    return this.injectScript('/ds-assets/lucide.lib.js', 'ds-lucide').then(() => {
      const lucide = (window as unknown as { lucide?: { createIcons: () => void } }).lucide;
      lucide?.createIcons();
    });
  }

  private injectScript(src: string, id: string): Promise<void> {
    return new Promise((resolve) => {
      const existing = document.getElementById(id) as HTMLScriptElement | null;
      if (existing) {
        if (existing.dataset['loaded']) {
          resolve();
        } else {
          existing.addEventListener('load', () => resolve());
        }
        return;
      }
      const script = document.createElement('script');
      script.id = id;
      script.src = src;
      script.addEventListener('load', () => {
        script.dataset['loaded'] = '1';
        resolve();
      });
      script.addEventListener('error', () => resolve());
      document.body.appendChild(script);
    });
  }
}
