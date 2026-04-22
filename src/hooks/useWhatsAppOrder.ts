import { useState } from 'react';
import { generateWhatsAppOrder, WhatsAppOrderParams } from '../utils/whatsappUtils';
import { statsService } from '../services/statsService';

export const useWhatsAppOrder = () => {
  const [loading, setLoading] = useState(false);

  const placeOrder = async (params: WhatsAppOrderParams) => {
    setLoading(true);
    
    try {
      // 1. Analytics: Atualiza contagem de pedidos ("🔥 Trending") no Firestore em background.
      // Aguardamos com um timeout curto para não travar a UX caso o DB esteja lento, mas
      // como é um incremento atômico, costuma ser instantâneo (menos de 50ms).
      await Promise.race([
        statsService.incrementOrder(params.catalogId, params.product.id),
        new Promise(resolve => setTimeout(resolve, 800)) // Fallback de 800ms
      ]);

      // 2. Montar mensagem
      const url = generateWhatsAppOrder(params);
      
      // 3. Redirecionar para o App do WhatsApp
      window.open(url, '_blank', 'noopener,noreferrer');
      
      return true;
    } catch (error) {
      console.error("Erro ao processar pedido ou salvar analytics:", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { placeOrder, loading };
};
