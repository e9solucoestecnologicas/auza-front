import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { inject } from '@angular/core';
import { CATEGORIAS } from '../../home.data';
import { Icon } from '../../../../ui/icon/icon';

/**
 * Formulário de contato. Sem back-end ainda: o submit apenas valida e mostra a
 * confirmação — o envio (e-mail/CRM) entra quando definirmos o destino.
 */
@Component({
  selector: 'app-contato-section',
  imports: [ReactiveFormsModule, Icon],
  templateUrl: './contato-section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContatoSection {
  protected readonly categorias = CATEGORIAS;
  protected readonly enviado = signal(false);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    nome: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    telefone: [''],
    categoria: [''],
    mensagem: ['', [Validators.required, Validators.minLength(10)]],
    aceite: [false, Validators.requiredTrue],
  });

  protected enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviado.set(true);
    this.form.reset();
  }

  /** Erro só aparece depois que o campo foi tocado. */
  protected invalido(campo: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[campo];
    return control.invalid && control.touched;
  }
}
