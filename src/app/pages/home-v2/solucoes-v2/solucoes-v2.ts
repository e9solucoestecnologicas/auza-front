import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CATEGORIAS, type Categoria } from '../../home/home.data';
import { Icon } from '../../../ui/icon/icon';
import { VitrineStore } from '../../../core/produtos/vitrine.store';
import type { CategoriaProduto, ProdutoPublico } from '../../../core/produtos/produto.models';

interface Midia {
  readonly src: string;
  /** Máscara de recorte (o mesmo par .jpg/.png do hero). `null` = foto de cena. */
  readonly mascara: string | null;
}

/**
 * Soluções — versão do plano C (referência: os painéis "SECTOR 01…04" do AEX).
 *
 * Os cinco segmentos lado a lado, como lâminas verticais; o ativo se abre e os
 * outros ficam estreitos, com o nome na vertical. Abaixo de `xl` os painéis
 * empilham e viram um acordeão — mesmo estado, mesmo markup (ver _ds-v2.scss).
 *
 * A imagem de cada painel é a mesma peça do hero (recorte + máscara), sobre o
 * marinho com foco de luz: não há fotos de ambiente dos produtos, e o recorte
 * mantém a linguagem da abertura. A Impressão 3D é uma cena e entra inteira.
 *
 * Os nomes de produto vêm do catálogo (API) quando ele existe, como na versão
 * atual; sem catálogo, da lista estática de home.data.ts.
 */
@Component({
  selector: 'app-solucoes-v2',
  imports: [Icon],
  templateUrl: './solucoes-v2.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SolucoesV2 {
  protected readonly categorias = CATEGORIAS;
  private readonly store = inject(VitrineStore);

  protected readonly ativo = signal(0);

  protected readonly indicadores = [
    { valor: '5', sufixo: '', rotulo: 'Segmentos atendidos' },
    { valor: '15', sufixo: '+', rotulo: 'Equipamentos em linha' },
    { valor: '100', sufixo: '%', rotulo: 'Fabricação própria' },
    { valor: '3', sufixo: '', rotulo: 'Disciplinas integradas' },
  ];

  constructor() {
    this.store.carregar();
  }

  protected ativar(indice: number): void {
    this.ativo.set(indice);
  }

  protected produtos(codigo: CategoriaProduto): readonly ProdutoPublico[] {
    return this.store.daCategoria(codigo);
  }

  protected readonly carregando = this.store.carregando;

  protected midia(cat: Categoria): Midia | null {
    const src = cat.imagem;
    if (!src) {
      return null;
    }
    if (cat.fotoEmoldurada) {
      return { src, mascara: null };
    }
    // Agro é PNG com alpha (imagem e máscara no mesmo arquivo); as outras vêm em
    // par .jpg (cor) + .png (alpha), como no hero.
    return { src, mascara: src.endsWith('.png') ? src : src.replace(/\.jpg$/, '.png') };
  }

  protected estiloMascara(m: Midia): string | null {
    return m.mascara ? `mask-image: url(${m.mascara}); -webkit-mask-image: url(${m.mascara})` : null;
  }
}
