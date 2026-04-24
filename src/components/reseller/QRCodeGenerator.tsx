import React, { useState } from 'react';
import { Download, QrCode } from 'lucide-react';

interface QRCodeGeneratorProps {
  storeName: string;
  storeUrl: string;
  whatsappNumber: string;
}

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  storeName,
  storeUrl,
  whatsappNumber,
}) => {
  const [loading, setLoading] = useState(false);

  // Gera a URL do QR Code usando API externa (somente para exibição)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    storeUrl
  )}`;

  // Função corrigida para download - SEM CORS ERROR
  const handleDownload = () => {
    try {
      setLoading(true);
      
      // Cria um link direto para download sem usar fetch
      const link = document.createElement('a');
      link.href = qrCodeUrl;
      link.download = `qrcode-${storeName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}.png`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      // Adiciona ao DOM, clica e remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setLoading(false);
    } catch (error) {
      console.error('Erro ao baixar QR Code:', error);
      setLoading(false);
      
      // Fallback: abre em nova aba se o download falhar
      window.open(qrCodeUrl, '_blank');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-4">
        <QrCode className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          QR Code da Loja
        </h3>
      </div>

      <div className="space-y-4">
        <div className="flex justify-center">
          <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
            <img
              src={qrCodeUrl}
              alt={`QR Code - ${storeName}`}
              className="w-48 h-48 object-contain"
              onError={(e) => {
                // Fallback se a imagem falhar
                (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="192" height="192"%3E%3Crect fill="%23fff" width="192" height="192"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="14" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3EQR Code%3C/text%3E%3C/svg%3E';
              }}
            />
          </div>
        </div>

        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600">
            Escaneie para acessar: <strong>{storeName}</strong>
          </p>
          <p className="text-xs text-gray-500 break-all">
            {storeUrl}
          </p>
        </div>

        <button
          onClick={handleDownload}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          {loading ? 'Baixando...' : 'Baixar QR Code'}
        </button>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-800">
            💡 <strong>Dica:</strong> Use este QR Code em materiais de marketing, 
            cartões de visita ou redes sociais para facilitar o acesso à sua loja.
          </p>
        </div>
      </div>
    </div>
  );
};
