import React, { useState } from 'react';
import { useWhatsAppOrder } from '../../hooks/useWhatsAppOrder';
import { MessageCircle, Minus, Plus, Loader2 } from 'lucide-react';
import { OrderProduct } from '../../utils/whatsappUtils';

interface SizeStock {
  size: string;
  inStock: boolean;
}

interface OrderButtonProps {
  product: OrderProduct;
  sizes: SizeStock[];
  catalogId: string;
  resellerWhatsApp: string;
  resellerName: string;
}

export const OrderButton: React.FC<OrderButtonProps> = ({ 
  product, 
  sizes, 
  catalogId, 
  resellerWhatsApp, 
  resellerName 
}) => {
  const { placeOrder, loading } = useWhatsAppOrder();
  
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);

  const handleMinus = () => setQuantity(prev => Math.max(1, prev - 1));
  const handlePlus = () => setQuantity(prev => Math.min(10, prev + 1)); // Limita a 10 peças no pedido

  const handleCheckout = () => {
    if (!selectedSize) return;

    placeOrder({
      phone: resellerWhatsApp,
      resellerName,
      catalogUrl: window.location.href, // URL da página que o cli está acessando
      product: product,
      selectedSize,
      quantity,
      catalogId
    });
  };

  // Soma parcial formatada pro botãozinho ficar legal
  const formatPartial = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="w-full bg-white rounded-3xl p-5 border border-gray-100 shadow-xl shadow-gray-200/50">
      
      {/* Seletor de Tamanhos Compacto */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <label className="text-sm font-bold text-gray-900">Selecione o Tamanho:</label>
          <span className="text-xs font-medium text-gray-500">
            {selectedSize ? `Tamanho ${selectedSize} selecionado` : 'Obrigatório'}
          </span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {sizes.map((s) => (
            <button
              key={s.size}
              disabled={!s.inStock}
              onClick={() => setSelectedSize(s.size)}
              className={`
                relative h-12 flex-1 min-w-[48px] rounded-xl font-bold transition-all border-2 flex items-center justify-center
                ${!s.inStock 
                  ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed' 
                  : selectedSize === s.size
                     ? 'border-green-600 bg-green-50 text-green-700 shadow-sm transform scale-105 z-10'
                     : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              {s.size}
              {!s.inStock && <div className="absolute w-[120%] h-0.5 bg-gray-200 -rotate-45" />}
            </button>
          ))}
        </div>
      </div>

      {/* Quantidade e Checkout */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        
        {/* Controle numérico de qtd */}
        <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-2xl p-1 shrink-0 w-full sm:w-auto h-14">
          <button 
            onClick={handleMinus} 
            disabled={quantity <= 1}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white text-gray-700 shadow-sm border border-gray-100 hover:bg-gray-100 disabled:opacity-50 disabled:shadow-none"
          >
            <Minus className="w-4 h-4" />
          </button>
          
          <span className="font-black text-gray-900 w-12 text-center text-lg hidden sm:block">
            {quantity}
          </span>
          <span className="font-black text-gray-900 text-center text-lg sm:hidden flex-1">
            {quantity} peça{quantity > 1 ? 's' : ''}
          </span>

          <button 
            onClick={handlePlus} 
            disabled={quantity >= 10}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white text-gray-700 shadow-sm border border-gray-100 hover:bg-gray-100 disabled:opacity-50 disabled:shadow-none"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Botão de Envio (CTA Principal) */}
        <button
          onClick={handleCheckout}
          disabled={!selectedSize || loading}
          className={`
            relative flex-1 w-full h-14 rounded-2xl font-bold text-white shadow-xl flex justify-center items-center gap-2 transition-all overflow-hidden
            ${selectedSize 
               ? 'bg-green-600 hover:bg-green-700 hover:shadow-green-500/30 hover:-translate-y-0.5 active:translate-y-0' 
               : 'bg-gray-300 cursor-not-allowed'}
          `}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <MessageCircle className="w-5 h-5" />
              <span>Pedir • {selectedSize ? formatPartial(product.price * quantity) : 'Via WhatsApp'}</span>
            </>
          )}

          {/* Brilho animado passando pelo botão verde (Shine) */}
          {selectedSize && (
             <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />
          )}
        </button>

      </div>
      
      {!selectedSize && (
        <p className="text-center text-xs text-red-500 font-medium mt-3 animate-pulse">
           Obrigatório selecionar o tamanho para habilitar o pedido.
        </p>
      )}

    </div>
  );
};
