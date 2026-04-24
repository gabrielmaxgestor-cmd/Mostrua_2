import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Store, Copy, CheckCircle2, ArrowRight, Package, Settings, Share2, MessageCircle, Link as LinkIcon, Check } from "lucide-react";
import { motion } from "motion/react";

export default function ResellerWelcome() {
  const location = useLocation();
  const slug = location.state?.slug || "";
  const storeUrl = `${window.location.origin}/${slug}`;
  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const colors = ['#f87171', '#60a5fa', '#4ade80', '#facc15', '#fb923c', '#a78bfa'];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {showConfetti && (
        <>
          <style>
            {`
              @keyframes fall {
                0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
                100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
              }
              .confetti-piece {
                position: fixed;
                top: -10px;
                width: 10px;
                height: 20px;
                border-radius: 4px;
                z-index: 50;
              }
            `}
          </style>
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="confetti-piece"
              style={{
                left: `${Math.random() * 100}vw`,
                backgroundColor: colors[Math.floor(Math.random() * colors.length)],
                animation: `fall ${1 + Math.random() * 3}s ease-in ${Math.random()}s forwards`,
                animationIterationCount: 1
              }}
            />
          ))}
        </>
      )}

      {copied && (
        <div className="fixed bottom-6 right-6 bg-green-500 text-white px-4 py-3 rounded-xl shadow-lg font-bold flex items-center gap-2 z-50 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-5 h-5" />
          Link copiado!
        </div>
      )}

      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="max-w-lg w-full bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 sm:p-12 text-center border border-gray-100 z-10"
      >
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2, duration: 0.5 }}
          className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </motion.div>
        
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2 leading-tight">
          Parabéns! 🙌
        </h1>
        
        <p className="text-lg text-gray-600 mb-8 font-medium">
          Sua loja está no ar e pronta para receber pedidos!
        </p>

        <div className="bg-gray-50 rounded-2xl p-5 mb-8 border border-gray-200">
          <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">O link da sua loja</p>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-left overflow-hidden shadow-sm">
              <span className="text-gray-900 font-medium truncate block select-all">{storeUrl}</span>
            </div>
            <button 
              onClick={handleCopy}
              className="bg-blue-600 text-white p-3.5 rounded-xl hover:bg-blue-700 transition-colors shadow-sm active:scale-95 flex items-center justify-center"
              title="Copiar link"
            >
              <Copy className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-3">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`✨ Olha minha loja online! Confere: ${storeUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full py-3.5 bg-[#25D366] text-white font-bold rounded-xl hover:bg-[#20b858] transition-colors shadow-md shadow-green-500/20 active:scale-95"
            >
              <MessageCircle className="w-5 h-5" />
              Compartilhar no WhatsApp
            </a>

            <button
              onClick={() => {
                navigator.clipboard.writeText(storeUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="flex items-center justify-center gap-3 w-full py-3.5 border-2 border-purple-200 text-purple-700 font-bold rounded-xl hover:bg-purple-50 transition-colors active:scale-95"
            >
              <LinkIcon className="w-5 h-5" />
              Copiar link para a bio do Instagram
            </button>
          </div>
        </div>

        <div className="text-left mb-10">
          <h3 className="text-xl font-bold text-gray-900 mb-5">Próximos passos:</h3>
          <div className="space-y-3">
            
            <div className="flex items-start sm:items-center flex-col sm:flex-row gap-4 p-4 lg:p-5 rounded-2xl border bg-orange-50 border-y-orange-100 border-r-orange-100 border-l-4 border-l-orange-500 shadow-sm">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-orange-100">
                <Package className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-gray-900 leading-tight">Ative seus catálogos</h4>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-500 text-white leading-tight">
                    FAÇA AGORA
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-0.5 leading-snug">Escolha quais catálogos e produtos você quer vender e defina sua margem de lucro.</p>
              </div>
              <Link to="/dashboard/catalogs" className="shrink-0 w-full sm:w-auto text-center text-xs font-bold px-4 py-2.5 rounded-lg bg-gray-900 text-white hover:bg-gray-700 transition-colors mt-2 sm:mt-0">
                Ir &rarr;
              </Link>
            </div>

            <div className="flex items-start sm:items-center flex-col sm:flex-row gap-4 p-4 lg:p-5 rounded-2xl border bg-gray-50 border-gray-100">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-white border border-gray-200">
                <MessageCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-gray-900 leading-tight">Configure seu WhatsApp</h4>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 leading-tight">
                    IMPORTANTE
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-0.5 leading-snug">Adicione seu número para receber os pedidos dos clientes.</p>
              </div>
              <Link to="/dashboard/settings" className="shrink-0 w-full sm:w-auto text-center text-xs font-bold px-4 py-2.5 rounded-lg bg-gray-900 text-white hover:bg-gray-700 transition-colors mt-2 sm:mt-0">
                Ir &rarr;
              </Link>
            </div>
            
            <div className="flex items-start sm:items-center flex-col sm:flex-row gap-4 p-4 lg:p-5 rounded-2xl border bg-gray-50 border-gray-100">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-white border border-gray-200">
                <Settings className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-bold text-gray-900 leading-tight">Personalize sua loja</h4>
                </div>
                <p className="text-sm text-gray-600 mt-0.5 leading-snug">Adicione sua logo, banner e escolha as cores da sua marca.</p>
              </div>
              <Link to="/dashboard/settings" className="shrink-0 w-full sm:w-auto text-center text-xs font-bold px-4 py-2.5 rounded-lg bg-gray-900 text-white hover:bg-gray-700 transition-colors mt-2 sm:mt-0">
                Ir &rarr;
              </Link>
            </div>

          </div>
        </div>

        <div className="flex flex-col items-center">
          <Link 
            to="/dashboard"
            className="inline-flex items-center justify-center w-full px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 active:scale-95"
          >
            Ir para o Painel <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
          <p className="text-xs text-gray-400 mt-4 font-medium">Você pode voltar para esta página a qualquer momento pelo painel</p>
          <Link to="/dashboard" className="text-sm text-gray-500 hover:text-gray-900 mt-6 font-bold flex items-center transition-colors">
            Pular por agora &larr;
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
