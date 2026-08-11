import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Logo } from '../../ui/logo/logo';
import { Icon } from '../../ui/icon/icon';
import { AuthService } from '../../core/auth/auth.service';
import { detalhesValidacao, ehErroApi } from '../../core/auth/auth.models';

@Component({
  selector: 'app-login',
  imports: [FormsModule, Logo, Icon],
  templateUrl: './login.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly email = signal('');
  protected readonly senha = signal('');
  protected readonly enviando = signal(false);
  protected readonly erro = signal<string | null>(null);
  /** Mensagens por campo, quando o backend responde VALIDATION_ERROR. */
  protected readonly errosDeCampo = signal<Record<string, string>>({});

  protected readonly podeEnviar = computed(
    () => !this.enviando() && this.email().trim().length > 0 && this.senha().length > 0,
  );

  protected async entrar(): Promise<void> {
    if (!this.podeEnviar()) {
      return;
    }
    this.enviando.set(true);
    this.erro.set(null);
    this.errosDeCampo.set({});

    try {
      await this.auth.entrar({ email: this.email().trim(), password: this.senha() });
      await this.router.navigateByUrl(this.destino());
    } catch (falha: unknown) {
      this.mostrarFalha(falha);
    } finally {
      this.enviando.set(false);
    }
  }

  /**
   * Volta para onde o usuário tentou ir antes de ser barrado. O parâmetro é lido
   * da URL e só aceito se for caminho interno — `redirecionar=https://outro.site`
   * viraria redirecionamento aberto.
   */
  private destino(): string {
    const alvo = new URLSearchParams(window.location.search).get('redirecionar');
    return alvo?.startsWith('/') && !alvo.startsWith('//') ? alvo : '/painel';
  }

  /**
   * O backend responde em português e com formato único
   * (`{ error: { code, message, details } }`), então a mensagem dele é melhor que
   * qualquer texto genérico daqui. Só traduzimos o que ele não tem como saber:
   * falha de rede.
   */
  private mostrarFalha(falha: unknown): void {
    if (falha instanceof HttpErrorResponse && falha.status === 0) {
      this.erro.set('Não foi possível falar com o servidor. Verifique sua conexão.');
      return;
    }

    const corpo = falha instanceof HttpErrorResponse ? falha.error : falha;
    if (!ehErroApi(corpo)) {
      this.erro.set('Não foi possível entrar. Tente novamente.');
      return;
    }

    const porCampo = detalhesValidacao(corpo);
    if (porCampo.length > 0) {
      this.errosDeCampo.set(Object.fromEntries(porCampo.map((d) => [d.field, d.message])));
    }
    this.erro.set(corpo.error.message);
  }
}
