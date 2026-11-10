import { TestBed } from '@angular/core/testing';
import { ContatoSection } from './contato-section';
import { WhatsappFlutuante } from '../../../../ui/whatsapp-flutuante/whatsapp-flutuante';
import { CONTATO, linkWhatsapp } from '../../home.data';

/**
 * Contato é o dado que dá prejuízo quando está errado, e o que mais silenciosamente
 * diverge entre a tela, o `tel:` e o `wa.me`. Estes testes prendem os três ao
 * mesmo `CONTATO`.
 */
describe('ContatoSection', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ContatoSection] }).compileComponents();
  });

  it('mostra os dois telefones e o e-mail oficiais', async () => {
    const fixture = TestBed.createComponent(ContatoSection);
    await fixture.whenStable();
    const texto = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(texto).toContain('(11) 2532-3679');
    expect(texto).toContain('(11) 96124-4335');
    expect(texto).toContain('contato@auza.com.br');
    // Nada de placeholder sobrando nos canais de contato.
    expect(texto).not.toContain('(00) 0000-0000');
  });

  it('torna telefone, WhatsApp e e-mail acionáveis', async () => {
    const fixture = TestBed.createComponent(ContatoSection);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector(`a[href="tel:${CONTATO.atendimento.discagem}"]`)).toBeTruthy();
    expect(root.querySelector(`a[href="mailto:${CONTATO.email}"]`)).toBeTruthy();

    // O selo verde do WhatsApp fica no CELULAR, como no material de contato.
    const zap = root.querySelector<HTMLAnchorElement>('a[href*="wa.me"]')!;
    expect(zap.getAttribute('href')).toContain(CONTATO.celular.whatsapp);
    expect(zap.getAttribute('rel')).toContain('noopener');
    expect(root.querySelectorAll('a[href*="wa.me"]').length).toBe(1);
  });
});

describe('WhatsappFlutuante', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [WhatsappFlutuante] }).compileComponents();
  });

  it('aponta para o FIXO do atendimento, com mensagem pronta', async () => {
    const fixture = TestBed.createComponent(WhatsappFlutuante);
    await fixture.whenStable();
    const link = (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>('a')!;

    // O número pedido para o botão: o que começa em 11 2532 — não o celular.
    expect(link.getAttribute('href')).toBe(linkWhatsapp(CONTATO.atendimento));
    expect(link.getAttribute('href')).toContain('wa.me/551125323679');
    expect(link.getAttribute('href')).not.toContain(CONTATO.celular.whatsapp);
    expect(link.getAttribute('href')).toContain('text=');

    // Abre fora sem dar controle da aba à página de destino.
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toContain('noopener');

    // Só o ícone na tela: o número vive no rótulo acessível, e não como texto.
    expect(link.getAttribute('aria-label')).toContain(CONTATO.atendimento.exibicao);
    expect(link.textContent?.trim()).toBe('');
  });

  it('fica fixo acima da barra de navegação e abaixo dela em camada', async () => {
    const fixture = TestBed.createComponent(WhatsappFlutuante);
    await fixture.whenStable();
    const link = (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>('a')!;

    // A barra do menu ocupa o rodapé no mobile e é z-40: o botão sobe e fica atrás.
    expect(link.className).toContain('fixed');
    expect(link.className).toContain('bottom-[4.5rem]');
    expect(link.className).toContain('z-30');
  });

  it('é um círculo: lados iguais e nada além do ícone dentro', async () => {
    const fixture = TestBed.createComponent(WhatsappFlutuante);
    await fixture.whenStable();
    const link = (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>('a')!;

    // Largura e altura declaradas iguais, e sem `gap`: era o gap sobrando ao lado
    // do rótulo fechado que deixava a caixa 12px mais larga que alta.
    expect(link.className).toContain('h-14');
    expect(link.className).toContain('w-14');
    expect(link.className).toContain('rounded-full');
    expect(link.className).not.toMatch(/\bgap-/);
    expect(link.querySelectorAll(':scope > *').length).toBe(1);
  });

  it('desenha a marca do WhatsApp como glifo cheio, não como traço', async () => {
    const fixture = TestBed.createComponent(WhatsappFlutuante);
    await fixture.whenStable();
    const svg = (fixture.nativeElement as HTMLElement).querySelector('svg')!;

    // Contorno de 2px sobre a marca sai irreconhecível: aqui pinta e não traça.
    expect(svg.getAttribute('fill')).toBe('currentColor');
    expect(svg.getAttribute('stroke')).toBe('none');
    expect(svg.getAttribute('stroke-width')).toBeNull();
    expect(svg.querySelectorAll('path').length).toBe(1);
  });
});
