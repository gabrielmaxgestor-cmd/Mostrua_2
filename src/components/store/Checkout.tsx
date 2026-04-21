import React, { useState } from 'react';
import { X, MessageCircle, AlertCircle, Loader2, ChevronDown } from 'lucide-react';
import { CartItem } from '../../hooks/useCart';
import { orderService, Customer } from '../../services/orderService';

interface CheckoutProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  reseller: any;
  onSuccess: (orderId: string, customer: Customer) => void;
  total: number;
  itemCount: number;
}

export function Checkout({ isOpen, onClose, cart, reseller, onSuccess, total, itemCount }: CheckoutProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showItems, setShowItems] = useState(false);

  if (!isOpen) return null;

  const primaryColor = reseller?.settings?.primaryColor || "#16a34a";

  const formatPhone = (val: string) => {
    let numbers = val.replace(/\D/g, '');
    if (numbers.length > 11) numbers = numbers.slice(0, 11);
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim();
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const isFormValid = name.trim().length > 0 && phone.replace(/\D/g, '').length >= 10;

  const buildWhatsAppMessage = (cust: Customer): string => {
    let message = `Olá, gostaria de fazer o pedido:\n\n`;
    cart.forEach(item => {
      message += `Produto: ${item.name}`;
      if (item.variation) message += ` | Variação: ${item.variation}`;
      message += ` | Qtd: ${item.quantity}\n`;
    });
    const formattedTotal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total);
    message += `\nTotal: ${formattedTotal}\n\n`;
    message += `Nome: ${cust.name}\n`;
    message += `Telefone: ${cust.phone}\n`;
    if (cust.city) message += `Cidade: ${cust.city}\n`;
    if (cust.notes) message += `Obs: ${cust.notes}\n`;
    return message;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    // Check for products with variations that have no variation selected
    const invalidItems = cart.filter(item => item.hasVariations && !item.variation);
    if (invalidItems.length > 0) {
      setError(`Selecione o tamanho/variação de: ${invalidItems.map(i => i.name).join(', ')}`);
      return;
    }

    const resellerPhone = reseller?.settings?.whatsapp?.replace(/\D/g, '');
    if (!resellerPhone) {
      setError('Esta loja ainda não configurou o WhatsApp. Por favor, entre em contato diretamente.');
      return;
    }

    const customer: Customer = {
      name: name.trim(),
      phone: phone.replace(/\D/g, ''),
      email: email.trim() || undefined,
      city: city.trim() || undefined,
      notes: notes.trim() || undefined
    };

    // Abre o WhatsApp ANTES do await — necessário para iOS Safari
    const message = buildWhatsAppMessage(customer);
    const whatsappUrl = `https://wa.me/55${resellerPhone}?text=${encodeURIComponent(message)}`;
    const link = document.createElement('a');
    link.href = whatsappUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Salva o pedido depois
    setLoading(true);
    setError('');
    try {
      const orderId = await orderService.createOrder({
        resellerId: reseller.id,
        customer,
        items: cart,
        total
      });
      onSuccess(orderId, customer);
    } catch (err: any) {
      console.error(err);
      setError('Ocorreu um erro ao salvar seu pedido. O WhatsApp já foi aberto — você pode confirmar o pedido diretamente com o vendedor.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={loading ? undefined : onClose} 
      />
      
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
          <h2 className="font-bold text-xl text-gray-900">Finalizar Pedido</h2>
          <button 
            onClick={loading ? undefined : onClose} 
            disabled={loading}
            className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 text-gray-500 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-5">
          <div className="mb-6">
            <button
              type="button"
              onClick={() => setShowItems(!showItems)}
              className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-600">
                  {itemCount} {itemCount === 1 ? 'item' : 'itens'}
                </span>
                <span className="text-base font-black" style={{ color: primaryColor }}>
                  R$ {total.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <span className="text-xs">{showItems ? 'Ocultar' : 'Ver resumo'}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showItems ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {showItems && (
              <div className="mt-2 p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                {cart.map(item => (
                  <div key={`${item.productId}-${item.variation}`} className="flex justify-between text-sm">
                    <span className="text-gray-600 truncate pr-4">
                      {item.quantity}x {item.name} {item.variation ? `(${item.variation})` : ''}
                    </span>
                    <span className="font-medium text-gray-900 shrink-0">
                      R$ {(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <form id="checkout-form" onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Nome Completo *</label>
              <input 
                type="text"
                required
                autoComplete="name"
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="Ex: João da Silva"
                className="w-full border-2 border-gray-100 bg-gray-50 rounded-xl px-4 py-3 focus:outline-none focus:border-transparent focus:ring-2 focus:bg-white transition-all"
                style={{ '--tw-ring-color': primaryColor } as any}
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">WhatsApp *</label>
              <input 
                type="tel"
                required
                autoComplete="tel"
                inputMode="numeric"
                value={phone} 
                onChange={handlePhoneChange} 
                placeholder="(00) 00000-0000" 
                maxLength={15}
                className="w-full border-2 border-gray-100 bg-gray-50 rounded-xl px-4 py-3 focus:outline-none focus:border-transparent focus:ring-2 focus:bg-white transition-all"
                style={{ '--tw-ring-color': primaryColor } as any}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Email (opcional)</label>
              <input 
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="Ex: joao@email.com"
                className="w-full border-2 border-gray-100 bg-gray-50 rounded-xl px-4 py-3 focus:outline-none focus:border-transparent focus:ring-2 focus:bg-white transition-all"
                style={{ '--tw-ring-color': primaryColor } as any}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Cidade (opcional)</label>
              <input 
                type="text"
                autoComplete="address-level2"
                value={city} 
                onChange={e => setCity(e.target.value)} 
                placeholder="Ex: São Paulo"
                className="w-full border-2 border-gray-100 bg-gray-50 rounded-xl px-4 py-3 focus:outline-none focus:border-transparent focus:ring-2 focus:bg-white transition-all"
                style={{ '--tw-ring-color': primaryColor } as any}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Observações (opcional)</label>
              <textarea 
                autoComplete="off"
                value={notes} 
                onChange={e => setNotes(e.target.value)} 
                placeholder="Alguma instrução especial?"
                rows={3}
                className="w-full border-2 border-gray-100 bg-gray-50 rounded-xl px-4 py-3 focus:outline-none focus:border-transparent focus:ring-2 focus:bg-white transition-all resize-none"
                style={{ '--tw-ring-color': primaryColor } as any}
              />
            </div>
          </form>
        </div>
        
        <div className="p-5 bg-white border-t border-gray-100 shrink-0">
          <button 
            type="submit"
            form="checkout-form"
            disabled={!isFormValid || loading}
            className="w-full py-4 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: isFormValid ? '#25D366' : '#9ca3af' }}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Finalizar pelo WhatsApp
              </>
            )}
          </button>
          <p className="text-xs text-gray-400 text-center mt-2">
            O WhatsApp será aberto com seu pedido já formatado para envio.
          </p>
        </div>
      </div>
    </div>
  );
}
