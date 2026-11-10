import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
  type OnInit,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { ProdutosService } from '../../../core/produtos/produtos.service';
import { detalhesValidacao, ehErroApi } from '../../../core/auth/auth.models';
import { Icon } from '../../../ui/icon/icon';
import {
  validarImagem,
  type EdicaoProduto,
  type NovoProduto,
  type OpcoesProduto,
  type Produto,
} from '../../../core/produtos/produto.models';

/**
 * Cadastro e edição de produto — a mesma tela para os dois, porque os campos são
 * os mesmos. O que muda é o destino do submit e o que já vem preenchido.
 *
 * Três decisões que vêm do contrato:
 *
 *  - os selects saem de `GET /products/options`, não de lista fixa aqui. Entrando
 *    uma categoria nova no backend, o formulário acompanha sem deploy;
 *  - no cadastro, `status` vai SEMPRE explícito: omitir cria OCULTO, e essa
 *    escolha não pode ficar implícita num default de servidor;
 *  - a imagem é upload em rota própria (multipart), que só existe depois de o
 *    produto ter id. Então cadastro com foto é POST e, na sequência, upload — e é
 *    por isso que o botão diz "Salvando…" antes de "Enviando imagem…".
 *
 * `clickCount` aparece só como leitura: quem o altera é o clique do visitante na
 * landing, pela rota pública.
 */
@Component({
  selector: 'app-produto-form',
  imports: [ReactiveFormsModule, RouterLink, DatePipe, Icon],
  templateUrl: './produto-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProdutoForm implements OnInit {
  /** Vem do parâmetro de rota (`withComponentInputBinding`). Vazio = cadastro. */
  readonly id = input<string>('');

  private readonly api = inject(ProdutosService);
  private readonly router = inject(Router);

  protected readonly opcoes = signal<OpcoesProduto | null>(null);
  protected readonly produto = signal<Produto | null>(null);
  protected readonly carregando = signal(false);
  protected readonly salvando = signal(false);
  protected readonly enviandoImagem = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly errosDeCampo = signal<Record<string, string>>({});

  /** Arquivo escolhido, ainda não enviado. */
  protected readonly arquivo = signal<File | null>(null);
  protected readonly erroImagem = signal<string | null>(null);
  /** `data:` da pré-visualização local, para conferir a foto antes de salvar. */
  protected readonly previa = signal<string | null>(null);

  protected readonly editando = computed(() => this.id() !== '');
  protected readonly titulo = computed(() =>
    this.editando() ? 'Editar produto' : 'Cadastrar produto',
  );

  /** Imagem já salva no produto, quando não há arquivo novo escolhido. */
  protected readonly imagemAtual = computed(() =>
    this.api.urlDaImagem(this.produto()?.imageUrl ?? null),
  );

  protected readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(180)]],
    category: ['', Validators.required],
    status: ['OCULTO', Validators.required],
    description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(5000)]],
    // O link é o destino de venda: sem ele o clique na vitrine não leva a lugar
    // nenhum. A API exige http(s) e até 2048 caracteres.
    link: [
      '',
      [Validators.required, Validators.maxLength(2048), Validators.pattern(/^https?:\/\/.+/i)],
    ],
    featured: [false],
    /** Alternativa ao upload: imagem hospedada em CDN. Vazio grava null. */
    imageUrl: ['', Validators.maxLength(2048)],
  });

  constructor() {
    this.api.opcoes().subscribe({
      next: (opcoes) => this.opcoes.set(opcoes),
      error: () =>
        this.erro.set('Não foi possível carregar categorias e status. Recarregue a página.'),
    });
  }

  ngOnInit(): void {
    const id = this.id();
    if (!id) {
      return;
    }
    this.carregando.set(true);
    this.api.obter(id).subscribe({
      next: (produto) => {
        this.produto.set(produto);
        this.form.patchValue({
          name: produto.name,
          category: produto.category,
          status: produto.status,
          description: produto.description,
          link: produto.link,
          featured: produto.featured,
          // Só preenche quando é URL externa: caminho de upload no campo faria o
          // usuário reenviar `/uploads/…` como se fosse endereço de CDN.
          imageUrl: /^https?:\/\//i.test(produto.imageUrl ?? '') ? (produto.imageUrl ?? '') : '',
        });
        this.carregando.set(false);
      },
      error: (falha: unknown) => {
        this.erro.set(this.mensagem(falha, 'Produto não encontrado.'));
        this.carregando.set(false);
      },
    });
  }

  /**
   * Valida o arquivo na hora de escolher, com as regras do contrato (§6.1). A API
   * recusaria de todo jeito, mas depois de subir até 5 MB — feedback local é
   * imediato.
   */
  protected escolherArquivo(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const arquivo = input.files?.[0] ?? null;
    this.erroImagem.set(null);
    this.previa.set(null);
    this.arquivo.set(null);

    if (!arquivo) {
      return;
    }

    const problema = validarImagem(arquivo);
    if (problema) {
      this.erroImagem.set(problema);
      // Limpa o input: manter o nome de um arquivo recusado sugere que ele subiu.
      input.value = '';
      return;
    }

    this.arquivo.set(arquivo);
    const leitor = new FileReader();
    leitor.onload = () => this.previa.set(String(leitor.result));
    leitor.readAsDataURL(arquivo);
  }

  protected removerArquivo(): void {
    this.arquivo.set(null);
    this.previa.set(null);
    this.erroImagem.set(null);
  }

  protected salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.salvando.set(true);
    this.erro.set(null);
    this.errosDeCampo.set({});

    const id = this.id();
    const arquivo = this.arquivo();

    if (!id) {
      // Cadastro: cria e, se houver arquivo, sobe a imagem no produto novo.
      this.api
        .criar(this.dados())
        .pipe(
          switchMap((criado) => {
            if (!arquivo) {
              return [criado];
            }
            this.enviandoImagem.set(true);
            return this.api.enviarImagem(criado.id, arquivo);
          }),
        )
        .subscribe({
          next: () => this.concluir(),
          error: (falha: unknown) => this.falhar(falha, 'Não foi possível cadastrar o produto.'),
        });
      return;
    }

    const mudancas = this.mudancas();

    // Corpo vazio responde 400. Se só a imagem mudou, vai direto para o upload —
    // e se nada mudou, o submit não chama a API.
    if (Object.keys(mudancas).length === 0) {
      if (!arquivo) {
        this.salvando.set(false);
        this.concluir();
        return;
      }
      this.enviandoImagem.set(true);
      this.api.enviarImagem(id, arquivo).subscribe({
        next: () => this.concluir(),
        error: (falha: unknown) => this.falhar(falha, 'Não foi possível enviar a imagem.'),
      });
      return;
    }

    this.api
      .atualizar(id, mudancas)
      .pipe(
        switchMap((salvo) => {
          if (!arquivo) {
            return [salvo];
          }
          this.enviandoImagem.set(true);
          return this.api.enviarImagem(id, arquivo);
        }),
      )
      .subscribe({
        next: () => this.concluir(),
        error: (falha: unknown) => this.falhar(falha, 'Não foi possível salvar as alterações.'),
      });
  }

  protected invalido(campo: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[campo];
    return (control.invalid && control.touched) || Boolean(this.errosDeCampo()[campo]);
  }

  /** Mensagem do backend para o campo, quando houver; senão a nossa. */
  protected erroDoCampo(campo: keyof typeof this.form.controls): string | null {
    const doServidor = this.errosDeCampo()[campo];
    if (doServidor) {
      return doServidor;
    }
    const control = this.form.controls[campo];
    if (!control.invalid || !control.touched) {
      return null;
    }
    return MENSAGENS[campo] ?? 'Confira este campo.';
  }

  /** Corpo do cadastro. `imageUrl` vazio vira null: a API lê isso como "sem imagem". */
  private dados(): NovoProduto {
    const v = this.form.getRawValue();
    return {
      name: v.name.trim(),
      category: v.category as NovoProduto['category'],
      status: v.status as NovoProduto['status'],
      description: v.description.trim(),
      link: v.link.trim(),
      featured: v.featured,
      imageUrl: v.imageUrl.trim() || null,
    };
  }

  /**
   * Só os campos que mudaram, porque o PATCH é parcial. Mandar tudo funcionaria,
   * mas sobrescreveria com o valor da tela um campo que outra pessoa alterou
   * enquanto este formulário estava aberto.
   */
  private mudancas(): EdicaoProduto {
    const original = this.produto();
    const atual = this.dados();
    if (!original) {
      return atual;
    }

    const mudancas: Record<string, unknown> = {};
    for (const [chave, valor] of Object.entries(atual)) {
      const anterior = (original as unknown as Record<string, unknown>)[chave];
      // `imageUrl` só entra quando o campo de URL foi realmente mexido: um upload
      // anterior deixou `/uploads/…` no produto e null aqui, e mandar esse null
      // apagaria a imagem sem ninguém pedir.
      if (chave === 'imageUrl' && valor === null && !/^https?:\/\//i.test(String(anterior ?? ''))) {
        continue;
      }
      if (valor !== anterior) {
        mudancas[chave] = valor;
      }
    }
    return mudancas as EdicaoProduto;
  }

  private concluir(): void {
    this.salvando.set(false);
    this.enviandoImagem.set(false);
    void this.router.navigateByUrl('/painel/produtos');
  }

  private falhar(falha: unknown, padrao: string): void {
    this.salvando.set(false);
    this.enviandoImagem.set(false);

    const corpo = (falha as { error?: unknown })?.error ?? falha;
    const porCampo = detalhesValidacao(corpo);
    if (porCampo.length > 0) {
      this.errosDeCampo.set(Object.fromEntries(porCampo.map((d) => [d.field, d.message])));
    }
    this.erro.set(this.mensagem(falha, padrao));
  }

  private mensagem(falha: unknown, padrao: string): string {
    const corpo = (falha as { error?: unknown })?.error ?? falha;
    return ehErroApi(corpo) ? corpo.error.message : padrao;
  }
}

/** Texto de erro por campo, espelhando as regras do contrato (§5.1). */
const MENSAGENS: Partial<Record<string, string>> = {
  name: 'Informe o nome, de 2 a 180 caracteres.',
  category: 'Escolha a categoria.',
  status: 'Escolha o status.',
  description: 'Descreva o produto em pelo menos 10 caracteres.',
  link: 'Informe o link de venda começando com http:// ou https://.',
  imageUrl: 'URL muito longa.',
};
