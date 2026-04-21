import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Store, Copy, CheckCircle2, ArrowRight, Package, Settings, Share2 } from "lucide-react";
import { motion } from "motion/react";

export default function ResellerWelcome() {
  const location = useLocation();
  const slug = location.state?.slug || "";
  const storeUrl = `${window.location.origin}/${slug}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(storeUrl);
    alert("Link copiado para a área de transferência!");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 md:p-12 text-center border border-gray-100"
      >
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
          Parabéns! Sua loja está pronta.
        </h1>
        
        <p className="text-lg text-gray-600 mb-8">
          Sua loja está no ar e pronta para receber pedidos.
        </p>

        <div className="bg-gray-50 rounded-2xl p-6 mb-10 border border-gray-200">
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">O link da sua loja</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 text-left overflow-hidden">
              <span className="text-gray-900 font-medium truncate block">{storeUrl}</span>
            </div>
            <button 
              onClick={handleCopy}
              className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
              title="Copiar link"
            >
              <Copy className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="text-left mb-10">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Próximos passos:</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-1">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900">Ative seus catálogos</h4>
                <p className="text-gray-600 text-sm mt-1">Escolha quais catálogos e produtos você quer vender e defina sua margem de lucro.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0 mt-1">
                <Settings className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900">Personalize sua loja</h4>
                <p className="text-gray-600 text-sm mt-1">Adicione sua logo, banner e escolha as cores da sua marca.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0 mt-1">
                <Share2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900">Comece a vender</h4>
                <p className="text-gray-600 text-sm mt-1">Compartilhe seu link no WhatsApp, Instagram e comece a receber pedidos.</p>
              </div>
            </div>
          </div>
        </div>

        <Link 
          to="/dashboard"
          className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
        >
          Ir para o Painel <ArrowRight className="w-5 h-5 ml-2" />
        </Link>
      </motion.div>
    </div>
  );
}
