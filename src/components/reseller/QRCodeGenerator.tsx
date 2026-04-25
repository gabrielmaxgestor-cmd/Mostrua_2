import React from 'react';
import { Download, Printer, QrCode } from 'lucide-react';

interface QRCodeGeneratorProps {
  storeUrl: string;
  primaryColor?: string;
  storeName: string;
}

export const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ storeUrl, primaryColor = '#16a34a', storeName }) => {
  const colorHex = primaryColor.replace('#', '');
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(storeUrl)}&size=300x300&color=${colorHex}`;

  const handleDownload = async () => {
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qrcode-${storeName.toLowerCase().replace(/\s+/g, '-')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading QR Code:', error);
      alert('Não foi possível baixar o QR Code. Tente novamente.');
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>QR Code - ${storeName}</title>
            <style>
              body {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                font-family: sans-serif;
              }
              img {
                width: 300px;
                height: 300px;
                margin-bottom: 20px;
              }
              h1 {
                font-size: 24px;
                color: #333;
                margin: 0 0 10px 0;
              }
              p {
                font-size: 16px;
                color: #666;
                margin: 0;
              }
            </style>
          </head>
          <body>
            <h1>${storeName}</h1>
            <img src="${qrCodeUrl}" alt="QR Code" />
            <p>Escaneie para ver nossa loja</p>
            <script>
              window.onload = () => {
                window.print();
                setTimeout(() => window.close(), 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-200 flex flex-col items-center text-center">
      <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-4">
        <QrCode className="w-6 h-6 text-gray-600" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-1">QR Code da Loja</h3>
      <p className="text-sm text-gray-500 mb-6">Compartilhe ou imprima para seus clientes acessarem rapidamente.</p>
      
      <div className="bg-gray-50 p-4 rounded-2xl mb-6 inline-block">
        <img src={qrCodeUrl} alt={`QR Code para ${storeName}`} className="w-48 h-48 mx-auto" crossOrigin="anonymous" />
        <p className="text-sm font-medium text-gray-600 mt-4">Escaneie para ver nossa loja</p>
      </div>

      <div className="flex gap-3 w-full max-w-xs">
        <button 
          onClick={handleDownload}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
        >
          <Download className="w-4 h-4" /> Baixar
        </button>
        <button 
          onClick={handlePrint}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
        >
          <Printer className="w-4 h-4" /> Imprimir
        </button>
      </div>
    </div>
  );
};
