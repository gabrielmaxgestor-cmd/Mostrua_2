import React, { useState } from 'react';
import { 
  X, 
  Info, 
  ShieldCheck, 
  Ruler, 
  Droplets,
  MessageCircle,
  TrendingUp,
  Sparkles
} from 'lucide-react';

export type JerseyType = 'torcedor' | 'jogador' | 'retro' | 'treino';
export type JerseySize = 'PP' | 'P' | 'M' | 'G' | 'GG' | 'XGG';

export interface JerseyProduct {
  id: string;
  name: string;
  team: string;
  league: string;
  season: string;
  type: JerseyType;
  fabric: string;
  technology: string[];
  sizes: { size: JerseySize; inStock: boolean }[];
  price: number;
  originalPrice?: number;
  images: string[];
  badgeUrl?: string;
  isNew?: boolean;
  isBestSeller?: boolean;
}

interface ProductDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  product: JerseyProduct;
  whatsappNumber?: string;
}

export const ProductDetailSheet: React.FC<ProductDetailSheetProps> = ({ 
  isOpen, 
  onClose, 
  product,
  whatsappNumber = "5511999999999"
}) => {
  const [activeTab, setActiveTab] = useState<'detalhes' | 'medidas' | 'composicao'>('detalhes');
  const [selectedSize, setSelectedSize] = useState<JerseySize | null>(null);

  if (!isOpen) return null;

  const formatPrice = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const getDiscountPercent = () => {
    if (!product.originalPrice) return 0;
    return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
  };

  const handleWhatsAppClick = () => {
    if (!selectedSize) {
      alert("Por favor, selecione um tamanho antes de fazer o pedido!");
      return;
    }
    const message = `Olá! Tenho interesse na camisa: *${product.name}*\nTamanho: *${selectedSize}*\nVersão: *${product.type.toUpperCase()}*`;
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <>
      {/* Overlay Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Sheet Container */}
      <div className="fixed inset-x-0 bottom-0 z-[101] md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-full md:max-w-2xl bg-white rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col max-h-[95vh] md:max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-full md:slide-in-from-bottom-0 md:zoom-in-95 duration-300">
        
        {/* Header Slider Line (Mobile) */}
        <div className="w-full flex justify-center pt-3 pb-1 md:hidden bg-white" onClick={onClose}>
          <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
        </div>

        {/* Cown / Close Icon */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 bg-white/80 backdrop-blur rounded-full text-gray-500 hover:text-gray-900 border border-gray-100 shadow-sm"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto hide-scrollbar pb-24 md:pb-0">
          
          {/* Gallery with Swipe (snap) */}
          <div className="relative w-full aspect-square md:aspect-[4/3] bg-gray-50 flex overflow-x-auto snap-x snap-mandatory hide-scrollbar">
            {product.images.map((img, idx) => (
              <img 
                key={idx}
                src={img} 
                alt={`${product.name} - ${idx + 1}`} 
                className="w-full h-full object-cover snap-center shrink-0"
              />
            ))}
            
            {/* Overlay Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
              {product.isNew && (
                <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5" /> Lançamento
                </span>
              )}
              {product.isBestSeller && (
                <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                  <TrendingUp className="w-3.5 h-3.5" /> Mais Vendida
                </span>
              )}
            </div>

            {/* Team Badge */}
            {product.badgeUrl && (
              <img 
                src={product.badgeUrl} 
                alt={product.team}
                className="absolute bottom-4 right-4 w-14 h-14 drop-shadow-xl object-contain drop-shadow-md z-10 opacity-90"
              />
            )}
          </div>

          <div className="p-5 md:p-8">
            {/* Product Header Info */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold tracking-wider text-gray-400 uppercase">
                  {product.league} • {product.season}
                </span>
                
                {/* Tooltip Badge Version */}
                <div className="relative group inline-flex items-center">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded border flex items-center gap-1 cursor-help
                    ${product.type === 'jogador' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                      product.type === 'torcedor' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                      'bg-gray-50 text-gray-700 border-gray-200'}`}>
                    Versão {product.type.charAt(0).toUpperCase() + product.type.slice(1)}
                    <Info className="w-3 h-3" />
                  </span>
                  
                  {/* Tooltip content */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-gray-900 text-white text-xs rounded-xl p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 shadow-xl">
                    {product.type === 'jogador' && "Caimento just (slim fit), tecido mais leve e respirável focando em performance. Escudos e patrocínios silkados (emborrachados) para reduzir peso."}
                    {product.type === 'torcedor' && "Caimento reto e mais solto, tecido resistente ideal para o dia a dia. Escudos e logos bordados para maior durabilidade."}
                    {product.type === 'retro' && "Reviva o passado! Peças clássicas com caimento tradicional, homenageando detalhes históricos."}
                    {product.type === 'treino' && "Feita para o campo. Leve, macia e preparada para suportar o rigor das atividades esportivas do dia a dia."}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </div>

              <h1 className="text-2xl font-black text-gray-900 leading-tight mb-3">
                {product.name}
              </h1>

              <div className="flex items-end gap-3">
                <span className="text-3xl font-black text-gray-900">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice && (
                  <span className="text-lg text-gray-400 line-through font-medium mb-1">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
                {product.originalPrice && (
                  <span className="text-sm font-bold text-green-600 bg-green-50 px-2 py-1 rounded mb-1.5">
                    -{getDiscountPercent()}% OFF
                  </span>
                )}
              </div>
            </div>

            {/* Separator */}
            <div className="w-full h-px bg-gray-100 my-6" />

            {/* Size Selector */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-gray-900">Tamanho</h3>
                <button 
                  onClick={() => setActiveTab('medidas')}
                  className="text-sm text-blue-600 font-medium flex items-center gap-1 hover:underline"
                >
                  <Ruler className="w-4 h-4" /> Guia de Medidas
                </button>
              </div>
              
              <div className="grid grid-cols-6 gap-2">
                {product.sizes.map((s) => {
                  const isSelected = selectedSize === s.size;
                  return (
                    <button
                      key={s.size}
                      disabled={!s.inStock}
                      onClick={() => setSelectedSize(s.size)}
                      className={`
                        w-full aspect-square rounded-xl flex items-center justify-center text-sm font-bold transition-all border-2
                        ${!s.inStock 
                          ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed' 
                          : isSelected
                            ? 'border-gray-900 bg-gray-900 text-white shadow-md transform scale-105'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-900'
                        }
                      `}
                    >
                      {s.size}
                      {/* Crossed out overlay if not in stock */}
                      {!s.inStock && (
                        <div className="absolute w-[120%] h-0.5 bg-gray-200 -rotate-45" />
                      )}
                    </button>
                  );
                })}
              </div>
              {!selectedSize && (
                <p className="text-xs text-red-500 mt-2 font-medium">Selecione um tamanho disponível.</p>
              )}
            </div>

            {/* Tabs Navigation */}
            <div className="flex w-full border-b border-gray-200 mb-5 relative">
              {(['detalhes', 'medidas', 'composicao'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 pb-3 text-sm font-bold uppercase tracking-wider transition-colors relative
                    ${activeTab === tab ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {tab}
                  {activeTab === tab && (
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-900 rounded-t-full" />
                  )}
                </button>
              ))}
            </div>

            {/* Tabs Content */}
            <div className="min-h-[160px] text-sm text-gray-600">
              {activeTab === 'detalhes' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <p>A nova armadura para a temporada {product.season} já está disponível. Construída para os verdadeiros apaixonados, une tradição e modernidade.</p>
                  <ul className="space-y-2 mt-4">
                    <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-gray-400"/> <strong>Clube:</strong> {product.team}</li>
                    <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-gray-400"/> <strong>Liga/Torneio:</strong> {product.league}</li>
                    <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-gray-400"/> <strong>Versão:</strong> {product.type.charAt(0).toUpperCase() + product.type.slice(1)}</li>
                  </ul>
                </div>
              )}

              {activeTab === 'medidas' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                  <table className="w-full text-left text-sm mt-2 border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="py-2 px-3 font-bold text-gray-900">Tam.</th>
                        <th className="py-2 px-3 font-bold text-gray-900">Largura</th>
                        <th className="py-2 px-3 font-bold text-gray-900">Altura</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr><td className="py-2 px-3 font-bold">PP</td><td className="py-2 px-3">48 cm</td><td className="py-2 px-3">68 cm</td></tr>
                      <tr><td className="py-2 px-3 font-bold">P</td><td className="py-2 px-3">50 cm</td><td className="py-2 px-3">70 cm</td></tr>
                      <tr><td className="py-2 px-3 font-bold">M</td><td className="py-2 px-3">52 cm</td><td className="py-2 px-3">72 cm</td></tr>
                      <tr><td className="py-2 px-3 font-bold">G</td><td className="py-2 px-3">54 cm</td><td className="py-2 px-3">74 cm</td></tr>
                      <tr><td className="py-2 px-3 font-bold">GG</td><td className="py-2 px-3">56 cm</td><td className="py-2 px-3">76 cm</td></tr>
                      <tr><td className="py-2 px-3 font-bold">XGG</td><td className="py-2 px-3">59 cm</td><td className="py-2 px-3">78 cm</td></tr>
                    </tbody>
                  </table>
                  <p className="text-xs text-gray-400 mt-2 italic">* As medidas podem variar sutilmente de 1 a 2 centímetros.</p>
                </div>
              )}

              {activeTab === 'composicao' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0"><Droplets className="w-5 h-5"/></div>
                    <div>
                      <strong className="block text-gray-900 mb-1">Tecido</strong>
                      {product.fabric}
                    </div>
                  </div>
                  <div className="flex items-start gap-3 mt-4">
                    <div className="p-2 bg-orange-50 text-orange-600 rounded-lg shrink-0"><Sparkles className="w-5 h-5"/></div>
                    <div>
                      <strong className="block text-gray-900 mb-1">Tecnologias Envolvidas</strong>
                      <ul className="list-disc ml-4 space-y-1">
                        {product.technology.map((tech, i) => (
                          <li key={i}>{tech}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Spacer for mobile fixed button */}
            <div className="h-10 md:hidden" />
          </div>
        </div>

        {/* Bottom CTA Action Bar */}
        <div className="absolute md:relative bottom-0 left-0 w-full bg-white border-t border-gray-100 p-4 md:p-6 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
          <button 
            onClick={handleWhatsAppClick}
            disabled={!selectedSize}
            className={`
              w-full py-4 rounded-2xl font-bold text-white shadow-xl flex justify-center items-center gap-2 transition-all active:scale-[0.98]
              ${selectedSize ? 'bg-green-600 hover:bg-green-700 hover:shadow-green-500/25' : 'bg-gray-300 cursor-not-allowed opacity-80'}
            `}
          >
            <MessageCircle className="w-5 h-5" />
            Pedir via WhatsApp
          </button>
        </div>
      </div>
    </>
  );
};
