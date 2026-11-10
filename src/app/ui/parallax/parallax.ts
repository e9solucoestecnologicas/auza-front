import { Directive, ElementRef, OnDestroy, OnInit, inject, input } from '@angular/core';

/**
 * Parallax de fundo: a imagem rola numa fração da velocidade do conteúdo, e é
 * essa diferença — não o fundo parado — que cria a profundidade.
 *
 * O ponto de partida é o `.fundo-fixo__trilho`, que prende a imagem à janela
 * (velocidade 0). Daí a diretiva soma o movimento: para a imagem correr a 1/3
 * do texto, ela precisa subir 1/3 de cada pixel rolado.
 *
 * A diretiva NÃO limita o desvio: ela dimensiona a imagem para o curso,
 * publicando a folga necessária em `--fundo-folga` (o CSS usa esse valor na
 * altura e na margem). Limitar o desvio faz a imagem congelar nas pontas da
 * passagem — anda um pedaço, para, e o efeito morre.
 *
 * Usa `transform` numa <img> em vez de `background-attachment: fixed` porque o
 * Safari no iOS não implementa esse valor, e porque transform é composto na GPU.
 */
/** Sobra extra na folga: subpixel e a barra de endereço mudando a janela. */
const MARGEM = 16;

@Directive({ selector: '[appParallax]' })
export class Parallax implements OnInit, OnDestroy {
  /**
   * Quantas vezes mais devagar que o conteúdo. 3 = um terço da rolagem.
   * Quanto menor o divisor, mais curso — e mais recortada fica a imagem, que
   * precisa crescer para cobrir esse curso.
   */
  readonly divisor = input(3);

  private readonly el = inject(ElementRef) as ElementRef<HTMLElement>;
  private agendado = false;
  /** Última folga publicada: mexer na altura a cada frame causaria layout. */
  private folgaAtual = -1;
  private readonly aoRolar = (): void => this.agendar();

  ngOnInit(): void {
    // Quem pediu menos movimento fica com a imagem presa à janela, sem desvio.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    window.addEventListener('scroll', this.aoRolar, { passive: true });
    window.addEventListener('resize', this.aoRolar, { passive: true });
    this.aplicar();
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.aoRolar);
    window.removeEventListener('resize', this.aoRolar);
  }

  /** Um cálculo por frame, no máximo — scroll dispara muito mais que isso. */
  private agendar(): void {
    if (this.agendado) {
      return;
    }
    this.agendado = true;
    requestAnimationFrame(() => {
      this.agendado = false;
      this.aplicar();
    });
  }

  private aplicar(): void {
    const img = this.el.nativeElement;
    // A moldura tem uma janela de folga no topo; a passagem que interessa é a
    // da seção que a hospeda.
    const secao = img.closest('.fundo-fixo')?.parentElement;
    if (!secao) {
      return;
    }

    const rect = secao.getBoundingClientRect();
    const janela = window.innerHeight;
    if (rect.top >= janela || rect.bottom <= 0) {
      return; // fora da janela: nada a atualizar
    }

    // Rolagem da entrada (seção encostando na base) à saída (topo da janela).
    const passagem = janela + rect.height;
    const percorrido = janela - rect.top;

    // Sobra de imagem além da janela, para a borda nunca aparecer. O caso
    // apertado é quando a seção cobre a janela inteira: ali o desvio chega no
    // máximo a |altura - janela| / (2 * divisor). Antes e depois dessa faixa o
    // desvio é maior, mas só uma fatia da seção está visível e a imagem cobre
    // com sobra — dimensionar pela passagem inteira esticaria a imagem à toa.
    const folga = Math.ceil(Math.abs(rect.height - janela) / (2 * this.divisor())) + MARGEM;
    if (folga !== this.folgaAtual) {
      this.folgaAtual = folga;
      img.style.setProperty('--fundo-folga', `${folga}px`);
    }

    // Sobe 1/divisor de cada pixel rolado — sem limite, o curso já cabe.
    const desvio = (passagem / 2 - percorrido) / this.divisor();
    img.style.transform = `translate3d(0, ${desvio.toFixed(2)}px, 0)`;
  }
}
