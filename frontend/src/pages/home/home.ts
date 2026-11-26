import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class Home {
  whatsappNumero = '(89) 99456-9750';
  whatsappLink = 'https://wa.me/5589994569750';
  instagramUsuario = '@jbmodafitepraia__';
  instagramLink = 'https://www.instagram.com/jbmodafitepraia__/';
  grupoVipLink = 'https://chat.whatsapp.com/GV7qDwLte2BK5TR6WrWHZg';
  mapsLink =
    'https://www.google.com/maps/search/?api=1&query=Av.+Nossa+Senhora+de+F%C3%A1tima,+453,+Picos,+PI';

  menu = [
    { rotulo: 'Início', alvo: '#inicio' },
    { rotulo: 'Favoritos', alvo: '#favoritos' },
    { rotulo: 'Coleção', alvo: '#colecao' },
    { rotulo: 'Sobre a loja', alvo: '#sobre' },
    { rotulo: 'Contato', alvo: '#contato' }
  ];

  tags = ['Loja física e online', 'Envios para todo o Brasil', 'Débito · Crédito · Pix'];

  grupos = [
    {
      titulo: 'Moda fitness',
      subtitulo: 'Para acompanhar seu movimento.',
      itens: [
        { nome: 'Conjunto verde', descricao: 'Regata e short em verde.', imagem: 'img/fav-conjunto-verde.jpg' },
        { nome: 'Conjuntos em tons neutros', descricao: 'Regata e shorts em bege e verde.', imagem: 'img/fav-conjunto-neutro.jpg' },
        { nome: 'Conjunto preto', descricao: 'Top de um ombro e legging preta.', imagem: 'img/fav-conjunto-preto.jpg' }
      ]
    },
    {
      titulo: 'Moda praia',
      subtitulo: 'Peças para os dias de sol.',
      itens: [
        { nome: 'Biquíni vinho', descricao: 'Modelo cortininha com acabamento branco.', imagem: 'img/fav-biquini-vinho.jpg' },
        { nome: 'Biquíni preto e branco', descricao: 'Contraste clássico com detalhe de estrela.', imagem: 'img/fav-biquini-preto-branco.jpg' },
        { nome: 'Biquínis turquesa e preto', descricao: 'Modelos com laterais franzidas.', imagem: 'img/fav-biquini-turquesa.jpg' }
      ]
    }
  ];

    novidades = [
    { titulo: 'Conjunto vinho e branco', imagem: 'img/novidade-vinho-branco.jpg' },
    { titulo: 'Blusas com recortes', imagem: 'img/novidade-blusas.jpg' },
    { titulo: 'Conjunto amarelo', imagem: 'img/novidade-amarelo.jpg' },
    { titulo: 'Macaquinho vinho', imagem: 'img/novidade-short-vinho.jpg' },
    { titulo: 'Camisetas preta e lilás', imagem: 'img/novidade-camisetas.jpg' },
    { titulo: 'Biquíni amarelo e verde', imagem: 'img/novidade-biquini-amarelo.jpg' }
  ];

  diferenciais = [
    { titulo: 'Fitness e praia', texto: 'Opções para acompanhar seus treinos e momentos de lazer.' },
    { titulo: 'Atendimento próximo', texto: 'Ajuda para escolher tamanhos, cores e combinações.' },
    { titulo: 'Loja física e online', texto: 'Compre em Picos ou fale com a equipe de onde estiver.' },
    { titulo: 'Entrega facilitada', texto: 'Envios para todo o Brasil e entrega gratuita na região próxima.' }
  ];

  perguntas = [
    {
      pergunta: 'Como faço meu pedido?',
      resposta:
        'Escolha sua peça e fale com a gente pelo WhatsApp comercial ou pelo Instagram. Vamos confirmar tamanhos, cores, disponibilidade e combinar o pagamento e a entrega.'
    },
    {
      pergunta: 'Vocês fazem entregas?',
      resposta:
        'Sim. Enviamos para todo o Brasil e fazemos entrega gratuita na região próxima. Fale com a equipe pelo WhatsApp para combinar prazo e frete.'
    },
    {
      pergunta: 'Como funciona a política de troca?',
      resposta:
        'Para compras online, entre em contato em até 7 dias corridos. A peça deve estar sem uso, com a etiqueta fixada e sem danos por mau uso. Compras escolhidas na loja física não têm troca por preferência. Em caso de defeito, fale com a equipe para avaliação e atendimento.'
    },
    {
      pergunta: 'Quais são as formas de pagamento?',
      resposta: 'Você pode pagar no débito, no crédito ou via Pix. Consulte a equipe sobre as condições disponíveis para o seu pedido.'
    }
  ];

  faqAberta: number | null = null;

  @ViewChild('trilho') trilho!: ElementRef<HTMLElement>;

  alternarFaq(indice: number) {
    this.faqAberta = this.faqAberta === indice ? null : indice;
  }

  rolar(direcao: number) {
    const el = this.trilho.nativeElement;
    const slide = el.querySelector('.slide') as HTMLElement | null;
    const passo = (slide?.clientWidth ?? 240) + 16;
    el.scrollBy({ left: direcao * passo, behavior: 'smooth' });
  }
}
