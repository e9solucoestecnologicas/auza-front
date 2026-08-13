import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../../ui/icon/icon';
import { AuthService } from '../../core/auth/auth.service';

/**
 * Resumo da sessão: quem está logado, segundo `/auth/me`.
 *
 * Marca, navegação e os botões de sair vivem no `PainelLayout`, a moldura das
 * telas do painel — esta é só o conteúdo da primeira aba.
 */
@Component({
  selector: 'app-painel',
  imports: [DatePipe, RouterLink, Icon],
  templateUrl: './painel.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Painel {
  protected readonly usuario = inject(AuthService).usuario;
}
