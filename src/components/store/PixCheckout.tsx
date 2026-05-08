import React, { useState, useEffect } from 'react';
import { Copy, CheckCircle2, MessageCircle, Clock } from 'lucide-react';
import { generatePixCode } from '../../utils/pixGenerator';

// FEATURE FLAG: PIX nao esta disponivel no MVP
const PIX_ENABLED = false;

interface PixCheckoutProps {
  pixKey: string;
  merchantName: string;
  merchantCity: string;
  amount: number;
  orderId: string;
  whatsapp: string;
  primaryColor?: string;
  onClose: () => void;
}

export const PixCheckout: React.FC<PixCheckoutProps> = (props) => {
  if (!PIX_ENABLED) return null;
  const {
    pixKey, merchantName, merchantCity, amount, orderId, whatsapp, primaryColor = '#16a34a', onClose
  } = props;
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes

  const pixCode = generatePixCode({ pixKey, merchantName, merchantCity, amount, txid: orderId });
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(pixCode)}&size=250x250`;

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const message = `Olá! Acabei de realizar o pagamento do pedido *#${orderId.slice(-6).toUpperCase()}* no valor de *R$ ${amount.toFixed(2)}*.\n\nSegue o comprovante do Pix:`;
    const url = `https://wa.me/55${whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="flex flex-col items-center text-center space-y-6 p-5">
      <div className="bg-green-500/10 text-green-400 px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2">
        <Clock className="w-4 h-4" />
        Aguardando pagamento: {formatTime(timeLeft)}
      </div>

      <div>
        <h3 className="text-xl font-bold text-white">Valor a pagar:</h3>
        <p className="text-3xl font-black" style={{ color: primaryColor }}>
          R$ {amount.toFixed(2).replace('.', ',')}
        </p>
      </div>

      <div className="bg-[#13131C] p-4 rounded-2xl border-2 border-white/5 shadow-sm">
        <img src={qrCodeUrl} alt="QR Code Pix" className="w-48 h-48 mx-auto" crossOrigin="anonymous" />
      </div>

      <div className="w-full space-y-2 text-left">
        <p className="text-sm font-medium text-white/70">Ou copie o código Pix (Pix Copia e Cola):</p>
        <div className="flex items-center gap-2">
          <input 
            type="text" 
            readOnly 
            value={pixCode} 
            className="flex-1 bg-[#0A0A0F] border border-white/10 rounded-xl px-4 py-3 text-sm text-white/50 outline-none"
          />
          <button 
            onClick={handleCopy}
            className="p-3 bg-[#13131C] hover:bg-[#1A1A2E] text-white/70 rounded-xl transition-colors shrink-0"
            title="Copiar código"
          >
            {copied ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="w-full pt-4 border-t border-white/5 space-y-4">
        <p className="text-sm text-white/60">
          Após realizar o pagamento, envie o comprovante para o nosso WhatsApp para liberarmos seu pedido.
        </p>
        <button 
          onClick={handleWhatsApp}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          Já paguei — Enviar Comprovante
        </button>
        <button 
          onClick={onClose}
          className="w-full px-4 py-3 text-white/50 hover:text-white/70 font-medium"
        >
          Voltar para a loja
        </button>
      </div>
    </div>
  );
};
