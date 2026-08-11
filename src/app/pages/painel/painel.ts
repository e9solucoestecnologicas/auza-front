import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Logo } from '../../ui/logo/logo';
import { AuthService } from '../../core/auth/auth.service';

/**
 * Área autenticada. Por ora só prova o circuito: mostra o usuário que o backend
 * devolveu em `/auth/me` e permite encerrar a sessão, aqui e em todos os
 * dispositivos. O conteúdo real entra depois.
 */
@Component({
  selector: 'app-painel',
  imports: [Logo, DatePipe],
  templateUrl: './painel.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Painel {
  private readonly auth = inject(AuthService);

  protected readonly usuario = this.auth.usuario;
  protected readonly saindo = signal(false);

  protected async sair(): Promise<void> {
    this.saindo.set(true);
    await this.auth.sair();
  }

  protected async sairDeTodos(): Promise<void> {
    this.saindo.set(true);
    await this.auth.sairDeTodosOsDispositivos();
  }
}
