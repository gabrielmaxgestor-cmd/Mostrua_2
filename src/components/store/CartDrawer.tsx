import React from 'react';
import { ShoppingCart, X, Minus, Plus, Trash2, ChevronRight, Store } from 'lucide-react';
import { CartItem } from '../../hooks/useCart';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  updateQuantity: (productId: string, variation: string | undefined, qt: number, stock?: number, useStockControl?: boolean) => void;
  removeItem: (productId: string, variation?: string) => void;
  total: number;
  itemCount: number;
  onCheckout: () => void;
  primaryColor?: string;
  stock?: number;
  useStockControl?: boolean;
}

export function CartDrawer({
  isOpen,
  onClose,
  cart,
  updateQuantity,
  removeItem,
  total,
  itemCount,
  onCheckout,
  primaryColor = '#16a34a',
  useStockControl = true
}: CartDrawerProps) {
  if (!isOpen) return null;

  const tax = 0; // MVP: zero tax
  const finalTotal = total + tax;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />
      
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
          <h2 className="font-bold text-xl flex items-center gap-2 text-gray-900">
            <ShoppingCart className="w-6 h-6" style={{ color: primaryColor }} /> 
            Meu Carrinho
          </h2>
          <button 
            onClick={onClose} 
            className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
              <ShoppingCart className="w-20 h-20 opacity-20" />
              <p className="text-lg font-medium text-gray-500">Seu carrinho está vazio</p>
              <button 
                onClick={onClose} 
                className="px-8 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900 transition-all rounded-full font-bold mt-4"
              >
                Continuar comprando
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map(item => (
                <div 
                  key={`${item.productId}-${item.variation}`} 
                  className="flex gap-4 bg-white border border-gray-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative"
                >
                  {/* Remove Button */}
                  <button 
                    onClick={() => removeItem(item.productId, item.variation)}
                    className="absolute -top-2 -right-2 p-1.5 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-full transition-colors shadow-sm"
                    title="Remover item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="w-24 h-24 bg-gray-50 rounded-xl overflow-hidden shrink-0 border border-gray-50">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <Store className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 line-clamp-2 leading-snug pr-4">{item.name}</h4>
                      {item.variation && (
                        <p className="text-xs font-medium text-gray-500 mt-1 bg-gray-50 inline-block px-2 py-0.5 rounded-md">
                          {item.variation}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-end justify-between mt-3">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase text-gray-400 font-bold tracking-wider mb-0.5">Preço un.</span>
                        <span className="font-black text-gray-900">
                          R$ {item.price.toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-1 border border-gray-200">
                        <button 
                          onClick={() => updateQuantity(item.productId, item.variation, item.quantity - 1, item.stock, useStockControl)} 
                          className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center text-gray-600 hover:text-red-500 transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-4 text-center font-bold text-sm text-gray-900">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.productId, item.variation, item.quantity + 1, item.stock, useStockControl)} 
                          className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center text-gray-600 hover:text-green-500 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer actions */}
        {cart.length > 0 && (
          <div className="p-6 bg-white border-t border-gray-100 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] shrink-0">
            <div className="space-y-3 mb-5">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'itens'})</span>
                <span className="font-bold text-gray-700">R$ {total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">Taxas</span>
                <span className="font-bold text-gray-700">R$ {tax.toFixed(2)}</span>
              </div>
              <div className="pt-3 border-t border-gray-100 flex justify-between items-end">
                <span className="text-gray-900 font-bold text-lg">Total</span>
                <span className="font-black text-3xl" style={{ color: primaryColor }}>
                  R$ {finalTotal.toFixed(2)}
                </span>
              </div>
            </div>

            <button 
              onClick={onCheckout}
              className="w-full py-4 text-white font-bold text-lg rounded-2xl flex items-center justify-center gap-2 shadow-xl hover:shadow-2xl transition-all hover:opacity-90 transform active:scale-[0.98]"
              style={{ backgroundColor: primaryColor }}
            >
              Finalizar Pedido <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
