import React, { useState, useRef } from 'react';
import { FileText, Loader2, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

interface CatalogExporterProps {
  resellerId: string;
  storeName: string;
  slug: string;
  logo?: string;
  banner?: string;
  whatsapp?: string;
  primaryColor?: string;
}

export const CatalogExporter: React.FC<CatalogExporterProps> = ({ 
  resellerId, storeName, slug, logo, banner, whatsapp, primaryColor = '#16a34a' 
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState('');
  const renderContainerRef = useRef<HTMLDivElement>(null);

  const exportPDF = async () => {
    if (!resellerId || isExporting) return;
    setIsExporting(true);
    setProgress('Buscando produtos...');

    try {
      // 1. Fetch active reseller products
      const rpQuery = query(
        collection(db, 'reseller_products'), 
        where('resellerId', '==', resellerId),
        where('active', '==', true)
      );
      const rpSnap = await getDocs(rpQuery);
      
      if (rpSnap.empty) {
        alert('Nenhum produto ativo encontrado para exportar.');
        setIsExporting(false);
        return;
      }

      const products = [];
      for (const rpDoc of rpSnap.docs) {
        const rpData = rpDoc.data();
        let name = rpData.customName;
        let description = rpData.customDescription;
        let image = '';
        const price = rpData.promotionalPrice || rpData.customPrice || 0;

        try {
          const bpRef = doc(db, 'products', rpData.baseProductId);
          const bpSnap = await getDoc(bpRef);
          if (bpSnap.exists()) {
            const bpData = bpSnap.data();
            if (!name) name = bpData.name;
            if (!description) description = bpData.description;
            image = bpData.images?.[0] || '';
          }
        } catch (e) {
          console.error("Error fetching base product", e);
        }

        products.push({ id: rpDoc.id, name, description, image, price });
      }

      // 2. Setup PDF
      // A4 size: 210 x 297 mm
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // We will render HTML at 794x1123 pixels (A4 at 96 DPI)
      const renderWidth = 794;
      const renderHeight = 1123;

      const container = renderContainerRef.current;
      if (!container) throw new Error("Render container not found");

      // Helper to capture and add page
      const captureAndAddPage = async (elementId: string, isFirstPage = false) => {
        const el = document.getElementById(elementId);
        if (!el) return;
        
        // Wait a bit for images to load
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const canvas = await html2canvas(el, {
          scale: 2, // Higher quality
          useCORS: true,
          logging: false,
          width: renderWidth,
          height: renderHeight
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        if (!isFirstPage) {
          pdf.addPage();
        }
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      };

      // 3. Render Cover Page
      setProgress('Gerando capa...');
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(`https://${window.location.host}/${slug}`)}&size=200x200&color=${primaryColor.replace('#', '')}`;
      
      container.innerHTML = `
        <div id="pdf-page-cover" style="width: ${renderWidth}px; height: ${renderHeight}px; background-color: white; position: relative; font-family: sans-serif; display: flex; flex-direction: column;">
          <div style="height: 400px; background-color: ${primaryColor}; background-image: url('${banner || ''}'); background-size: cover; background-position: center;"></div>
          <div style="flex: 1; display: flex; flex-direction: column; align-items: center; padding: 40px; text-align: center;">
            ${logo ? `<img src="${logo}" style="width: 150px; height: 150px; border-radius: 20px; object-fit: cover; margin-top: -100px; border: 8px solid white; background: white;" crossorigin="anonymous" />` : ''}
            <h1 style="font-size: 48px; color: #111827; margin: 20px 0 10px 0;">${storeName}</h1>
            <p style="font-size: 24px; color: #6b7280; margin: 0 0 40px 0;">Catálogo de Produtos</p>
            
            <div style="margin-top: auto; display: flex; flex-direction: column; align-items: center;">
              <img src="${qrCodeUrl}" style="width: 200px; height: 200px; margin-bottom: 20px;" crossorigin="anonymous" />
              <p style="font-size: 18px; color: #374151; font-weight: bold;">Escaneie para comprar online</p>
              ${whatsapp ? `<p style="font-size: 18px; color: #16a34a; margin-top: 10px;">WhatsApp: ${whatsapp}</p>` : ''}
            </div>
          </div>
        </div>
      `;
      await captureAndAddPage('pdf-page-cover', true);

      // 4. Render Product Pages (Grid 2x3 = 6 products per page)
      const itemsPerPage = 6;
      const totalPages = Math.ceil(products.length / itemsPerPage);

      for (let i = 0; i < totalPages; i++) {
        setProgress(`Gerando página ${i + 1} de ${totalPages}...`);
        const pageProducts = products.slice(i * itemsPerPage, (i + 1) * itemsPerPage);
        
        let productsHtml = '';
        pageProducts.forEach(p => {
          productsHtml += `
            <div style="border: 1px solid #e5e7eb; border-radius: 16px; padding: 20px; display: flex; flex-direction: column;">
              <div style="height: 200px; background-color: #f3f4f6; border-radius: 8px; margin-bottom: 16px; overflow: hidden; display: flex; align-items: center; justify-content: center;">
                ${p.image ? `<img src="${p.image}" style="max-width: 100%; max-height: 100%; object-fit: contain;" crossorigin="anonymous" />` : '<span style="color: #9ca3af;">Sem imagem</span>'}
              </div>
              <h3 style="font-size: 18px; color: #111827; margin: 0 0 8px 0; font-weight: bold; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${p.name}</h3>
              <p style="font-size: 14px; color: #6b7280; margin: 0 0 16px 0; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; flex: 1;">${p.description || ''}</p>
              <div style="font-size: 24px; font-weight: bold; color: ${primaryColor};">R$ ${p.price.toFixed(2).replace('.', ',')}</div>
            </div>
          `;
        });

        container.innerHTML = `
          <div id="pdf-page-${i}" style="width: ${renderWidth}px; height: ${renderHeight}px; background-color: white; padding: 40px; box-sizing: border-box; font-family: sans-serif; display: flex; flex-direction: column;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid ${primaryColor}; padding-bottom: 10px; margin-bottom: 30px;">
              <h2 style="font-size: 24px; color: #111827; margin: 0;">${storeName}</h2>
              <span style="color: #6b7280; font-size: 14px;">Página ${i + 1}</span>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; flex: 1; align-content: start;">
              ${productsHtml}
            </div>
          </div>
        `;
        await captureAndAddPage(`pdf-page-${i}`);
      }

      // 5. Save PDF
      setProgress('Salvando PDF...');
      pdf.save(`${slug}-catalogo.pdf`);
      
      // Cleanup
      container.innerHTML = '';
      setProgress('');
    } catch (error) {
      console.error("Error exporting catalog:", error);
      alert('Ocorreu um erro ao exportar o catálogo.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <div className="bg-white p-6 rounded-3xl border border-gray-200 flex flex-col items-center text-center h-full">
        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-4">
          <FileText className="w-6 h-6 text-blue-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Catálogo em PDF</h3>
        <p className="text-sm text-gray-500 mb-6 flex-1">Gere um PDF com todos os seus produtos para enviar no WhatsApp ou imprimir.</p>
        
        <button 
          onClick={exportPDF}
          disabled={isExporting}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {progress}
            </>
          ) : (
            <>
              <Download className="w-5 h-5" /> Exportar PDF
            </>
          )}
        </button>
      </div>

      {/* Hidden container for rendering PDF pages */}
      <div 
        ref={renderContainerRef} 
        style={{ position: 'fixed', top: '-9999px', left: '-9999px', zIndex: -1000 }}
        aria-hidden="true"
      />
    </>
  );
};
