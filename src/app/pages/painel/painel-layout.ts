import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Logo } from '../../ui/logo/logo';
import { AuthService } from '../../core/auth/auth.service';

/**
 * Moldura da área autenticada: marca, navegação entre as telas do painel e o
 * encerramento de sessão. O conteúdo de cada tela entra pelo `router-outlet`.
 *
 * Existe porque o painel deixou de ser uma tela só. Sem ela, cabeçalho e os dois
 * botões de sair teriam de ser repetidos em cada tela nova — e a lógica de sessão
 * com eles.
 *
 * A proteção continua no `authGuard` da rota (app.routes.ts), não aqui: guarda em
 * componente só roda depois de o Angular já ter carregado a tela.
 */
@Component({
  selector: 'app-painel-layout',
  imports: [Logo, RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ds-root antialiased">
      <!--
        O branco do DS fica num filho do .ds-root, e não no mesmo elemento: o
        remap da paleta é ".ds-root .bg-white", seletor descendente, e no mesmo
        elemento ele não casaria — o fundo sairia branco puro. Mesma armadilha que
        deixou o login em quase-preto. (Sem acento grave aqui: em template inline
        ele fecha o template literal do TypeScript.)
      -->
      <div class="min-h-screen bg-white">
        <header class="border-b border-soft px-6 sm:px-8">
          <div class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 py-4">
            <a routerLink="/painel" aria-label="Painel AUZA">
              <app-logo variante="claro" class="w-[150px]" />
            </a>

            <div class="flex items-center gap-3">
              <!--
                Só "Sair". O "Sair de todos" saiu porque, na tela, fazia o mesmo:
                encerra a sessão e volta ao login. A diferença é no backend — ele
                chama /auth/logout-all e derruba as sessões de TODOS os
                dispositivos —, e isso não se distingue de quem usa um só.
                Se um dia fizer sentido ("sair de todos os aparelhos" numa tela de
                conta), o método já existe: AuthService.sairDeTodosOsDispositivos.
              -->
              <button
                type="button"
                class="btn-primary rounded-lg px-4 py-2 font-geist-mono text-xs uppercase tracking-widest transition-colors disabled:opacity-50"
                [disabled]="saindo()"
                (click)="sair()"
              >
                {{ saindo() ? 'Saindo…' : 'Sair' }}
              </button>
            </div>
          </div>

          <!-- routerLinkActive com "exact" no Resumo: sem isso ele ficaria ativo
               junto com Produtos, que é filho do mesmo prefixo. -->
          <nav class="mx-auto -mb-px flex max-w-6xl gap-6" aria-label="Seções do painel">
            <a
              class="painel-aba"
              routerLink="/painel"
              routerLinkActive="painel-aba--ativa"
              [routerLinkActiveOptions]="{ exact: true }"
              >Resumo</a
            >
            <a class="painel-aba" routerLink="/painel/produtos" routerLinkActive="painel-aba--ativa"
              >Produtos</a
            >
          </nav>
        </header>

        <main class="mx-auto max-w-6xl px-6 py-12 sm:px-8">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class PainelLayout {
  private readonly auth = inject(AuthService);

  protected readonly saindo = signal(false);

  protected async sair(): Promise<void> {
    this.saindo.set(true);
    await this.auth.sair();
  }
}
