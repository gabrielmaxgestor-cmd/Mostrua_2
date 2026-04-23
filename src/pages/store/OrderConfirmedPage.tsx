import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTenant } from '../../hooks/useTenant';
import { orderService, Order } from '../../services/orderService';
import { CheckCircle2, ShoppingBag, ArrowLeft, Loader2, Store, ChevronRight, Copy, MessageCircle } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { InstallBanner } from '../../components/store/InstallBanner';

export default function OrderConfirmedPage() {
  const { slug, orderId } = useParams<{ slug?: string; orderId: string }>();
  const navigate = useNavigate();
  const { reseller, loading: resellerLoading, error: resellerError } = useTenant();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderLoading, setOrderLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { clearCart } = useCart(reseller?.id || '');

  useEffect(() => {
    async function loadOrder() {
      if (!orderId || !reseller?.id) {
        if (!resellerLoading && !reseller) {
          setError("Loja não encontrada");
          setOrderLoading(false);
        }
        return;
      }

      try {
        const data = await orderService.getOrderById(orderId);
        
        if (!data) {
          setError("Pedido não encontrado");
          return;
        }

        if (data.resellerId !== reseller.id) {
          setError("Pedido não encontrado nesta loja");
          return;
        }

        setOrder(data);
        
        // Se encontramos o pedido e ele pertence a esta loja, podemos limpar o carrinho
        clearCart();
        
      } catch (err: any) {
        console.error("Erro ao buscar pedido:", err);
        setError("Erro ao carregar detalhes do pedido");
      } finally {
        setOrderLoading(false);
      }
    }

    loadOrder();
  }, [orderId, reseller?.id, resellerLoading]);

  useEffect(() => {
    // Impede o cliente de voltar para o checkout com o carrinho "cheio"
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.href);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const primaryColor = reseller?.settings?.primaryColor || '#16a34a';
  const storeUrl = slug ? `/store/${slug}` : '/';

  if (resellerLoading || orderLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-gray-400 mb-4" style={{ color: primaryColor }} />
        <p className="text-gray-500 font-medium">Carregando pedido...</p>
      </div>
    );
  }

  if (error || resellerError || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-sm text-center max-w-md w-full border border-gray-100">
          <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Ops! Algo deu errado</h1>
          <p className="text-gray-500 mb-6">{error || "Não foi possível carregar o pedido."}</p>
          <Link
            to={storeUrl}
            className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl flex justify-center items-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar para a Loja
          </Link>
        </div>
      </div>
    );
  }

  const handleWhatsAppTracking = () => {
    let message = `Olá! Gostaria de acompanhar meu pedido (*#${order.id.slice(-6).toUpperCase()}*)\n\n`;
    message += `Nome: ${order.customer.name}\n`;
    message += `Valor total: R$ ${order.total.toFixed(2)}`;

    const resellerPhone = reseller?.settings?.whatsapp?.replace(/\D/g, '');
    if (resellerPhone) {
      const whatsappUrl = `https://wa.me/55${resellerPhone}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl shadow-black/5 max-w-md w-full border border-gray-100 animate-in zoom-in-95 duration-500 relative overflow-hidden">
        
        {/* Background decoration */}
        <div 
          className="absolute -top-24 -right-24 w-48 h-48 rounded-full opacity-10"
          style={{ backgroundColor: primaryColor }}
        />
        
        <div className="relative flex flex-col items-center text-center mb-8">
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-sm"
            style={{ backgroundColor: `${primaryColor}15` }}
          >
            <CheckCircle2 className="w-10 h-10" style={{ color: primaryColor }} />
          </div>
          
          <h1 className="text-2xl font-black text-gray-900 mb-2">Pedido Recebido!</h1>
          <p className="text-gray-500">
            Seu pedido <span className="font-bold text-gray-700">#{order.id.slice(-6).toUpperCase()}</span> foi registrado com sucesso.
          </p>
        </div>

        <div className="bg-gray-50 rounded-2xl p-5 mb-6 border border-gray-100">
          <div className="flex items-center gap-2 text-gray-900 font-bold mb-3 pb-3 border-b border-gray-200">
            <ShoppingBag className="w-4 h-4 text-gray-400" />
            Resumo do Pedido
          </div>
          
          <div className="space-y-3 mb-4">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-gray-600 truncate pr-4">
                  {item.qty}x {item.name} {item.variation ? `(${item.variation})` : ''}
                </span>
                <span className="font-medium text-gray-900 shrink-0">
                  R$ {(item.price * item.qty).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          
          <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
            <span className="font-bold text-gray-900 text-sm">Total</span>
            <span className="font-black text-lg" style={{ color: primaryColor }}>
              R$ {order.total.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm mb-8">
          <p>
            Entraremos em contato pelo WhatsApp em breve para combinar o pagamento e a entrega do seu pedido.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleWhatsAppTracking}
            className="w-full py-4 text-white font-bold rounded-xl flex justify-center items-center gap-2 transition-all hover:opacity-90 shadow-md"
            style={{ backgroundColor: primaryColor }}
          >
            Acompanhar no WhatsApp
          </button>

          <Link
            to={storeUrl}
            className="w-full py-4 bg-white border-2 border-gray-100 hover:bg-gray-50 hover:border-gray-200 text-gray-700 font-bold rounded-xl flex justify-center items-center gap-2 transition-colors"
          >
            Continuar Comprando
          </Link>
        </div>

        {/* 1. Compartilhamento da loja */}
        <div className="mt-8 p-5 bg-gray-50 rounded-2xl border border-gray-100">
          <p className="text-sm font-bold text-gray-700 mb-3 text-center">
            Gostou? Indique para um amigo
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => navigator.clipboard.writeText(`${window.location.origin}/store/${slug}`).then(() => alert('Link copiado!'))}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 flex items-center justify-center gap-2 transition-colors"
            >
              <Copy className="w-4 h-4" /> Copiar link
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Comprei na ${reseller?.storeName} e adorei! Confira: ${window.location.origin}/store/${slug}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 bg-[#25D366] text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              <MessageCircle className="w-4 h-4" /> Compartilhar
            </a>
          </div>
        </div>

        {/* 2. Instalar como app (PWA) */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400 mb-3">
            Adicione esta loja à tela inicial para acessar mais rápido na próxima vez.
          </p>
          <InstallBanner storeName={reseller?.storeName} primaryColor={primaryColor} />
        </div>

      </div>
      
      {/* Footer minimalista */}
      <div className="mt-8 text-center text-gray-400 text-sm">
        <p>Desenvolvido por <span className="font-medium text-gray-500">Catálogo Flex</span></p>
      </div>
    </div>
  );
}
