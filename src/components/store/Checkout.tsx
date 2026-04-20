import React, { useState } from 'react';
import { X, MessageCircle, AlertCircle, Loader2 } from 'lucide-react';
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
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-6">
            <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wider">Resumo ({itemCount} itens)</h3>
            <div className="space-y-2 mb-3">
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
            <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
              <span className="font-bold text-gray-900">Total</span>
              <span className="font-black text-lg" style={{ color: primaryColor }}>R$ {total.toFixed(2)}</span>
            </div>
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
            style={{ backgroundColor: isFormValid ? primaryColor : '#9ca3af' }}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <MessageCircle className="w-5 h-5 border-white border-[1.5px] rounded-full p-[2px]" />
                Finalizar pelo WhatsApp
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
