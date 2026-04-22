export interface OrderProduct {
  id: string;
  name: string;
  team: string;
  season: string;
  type: string;
  price: number;
}

export interface WhatsAppOrderParams {
  phone: string;
  resellerName: string;
  catalogUrl: string;
  product: OrderProduct;
  selectedSize: string;
  quantity: number;
  catalogId: string; // Útil para analytics posterior no hook
}

/**
 * Gera a URL completa para redirecionamento do WhatsApp com a mensagem formatada.
 */
export function generateWhatsAppOrder(params: WhatsAppOrderParams): string {
  const { phone, resellerName, catalogUrl, product, selectedSize, quantity } = params;
  
  // Formatando o preço: Ex: R$ 249,90
  const totalPrice = (product.price * quantity);
  const formattedPrice = new Intl.NumberFormat('pt-BR', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }).format(totalPrice);

  const text = `Olá, ${resellerName}! 👋

Quero fazer um pedido pelo catálogo:

🏆 *${product.team} - ${product.name}*
📅 Temporada: ${product.season}
📐 Tamanho: ${selectedSize}
🔢 Quantidade: ${quantity}
💰 Valor: R$ ${formattedPrice}

🔗 Vi em: ${catalogUrl}

Aguardo confirmação! 😊`;

  // Limpar formatação do telefone (deixar somente números)
  const cleanPhone = phone.replace(/\D/g, '');

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}
