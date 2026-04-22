import React, { useState } from 'react';
import { 
  X, 
  Ruler, 
  Weight, // Doesn't exist in standard lucide sometimes, let's use Scale instead
  Scale,
  Shirt,
  Info,
  CheckCircle2,
  ChevronRight,
  ArrowRight
} from 'lucide-react';

export type FitPreference = 'justo' | 'regular' | 'folgado';

export interface SizeChartItem {
  size: string;
  chest: number;
  waist: number;
  length: number;
}

interface SizeRecommenderProps {
  sizeChart: SizeChartItem[];
  productName?: string;
  buttonClassName?: string;
}

const FIT_OPTIONS: { id: FitPreference; label: string; desc: string }[] = [
  { id: 'justo', label: 'Justo', desc: 'Fica colado ao corpo, ideal para jogar.' },
  { id: 'regular', label: 'Regular', desc: 'Caimento padrão de torcedor. Confortável.' },
  { id: 'folgado', label: 'Folgado', desc: 'Estilo bem solto, ideal para o dia a dia.' }
];

const SIZES = ['PP', 'P', 'M', 'G', 'GG', 'XGG'];

export const SizeRecommender: React.FC<SizeRecommenderProps> = ({ 
  sizeChart, 
  productName = "esta camisa",
  buttonClassName = "" 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1); // 1: Form, 2: Result
  
  // Form State
  const [height, setHeight] = useState<number>(175);
  const [weight, setWeight] = useState<number>(75);
  const [fit, setFit] = useState<FitPreference>('regular');
  
  // Result State
  const [recommendation, setRecommendation] = useState<{ rec: string; alt: string; confidence: number } | null>(null);

  // The Magic Algorithm! (IMC based + heuristics)
  const calculateSize = (w: number, h: number, f: FitPreference) => {
    const bmi = w / Math.pow(h / 100, 2);
    let baseIndex = 2; // Default to M

    if (h <= 165) {
      if (bmi < 22) baseIndex = 0; // PP
      else if (bmi < 26) baseIndex = 1; // P
      else if (bmi < 29) baseIndex = 2; // M
      else baseIndex = 3; // G
    } else if (h <= 175) {
      if (bmi < 21) baseIndex = 1; // P
      else if (bmi < 25) baseIndex = 2; // M
      else if (bmi < 28) baseIndex = 3; // G
      else if (bmi < 31) baseIndex = 4; // GG
      else baseIndex = 5; // XGG
    } else if (h <= 185) {
      if (bmi < 21) baseIndex = 2; // M
      else if (bmi < 25) baseIndex = 3; // G
      else if (bmi < 28) baseIndex = 4; // GG
      else baseIndex = 5; // XGG
    } else {
      if (bmi < 23) baseIndex = 3; // G
      else if (bmi < 27) baseIndex = 4; // GG
      else baseIndex = 5; // XGG
    }

    // Adjust by fit
    let recIndex = baseIndex;
    if (f === 'justo') recIndex = Math.max(0, baseIndex - 1);
    if (f === 'folgado') recIndex = Math.min(SIZES.length - 1, baseIndex + 1);

    // Calculate an alternative size and confidence
    let altIndex = baseIndex;
    let confidence = 0;

    // Simulated Confidence % based on BMI decimal leftover
    const decimal = bmi - Math.floor(bmi);
    
    if (f === 'justo') {
      altIndex = Math.min(SIZES.length - 1, recIndex + 1);
      confidence = 85 + Math.floor((1 - decimal) * 10);
    } else if (f === 'folgado') {
      altIndex = Math.max(0, recIndex - 1);
      confidence = 88 + Math.floor(decimal * 10);
    } else {
      // Regular
      altIndex = decimal > 0.5 ? Math.min(SIZES.length - 1, recIndex + 1) : Math.max(0, recIndex - 1);
      confidence = 82 + Math.floor((decimal > 0.5 ? 1 - decimal : decimal) * 20); // peak confidence at exact whole numbers
    }

    // Ensure they are not the same (edge cases)
    if (recIndex === altIndex) {
      altIndex = recIndex > 0 ? recIndex - 1 : recIndex + 1;
    }

    const recSize = sizeChart.find(s => s.size === SIZES[recIndex])?.size || SIZES[recIndex];
    const altSize = sizeChart.find(s => s.size === SIZES[altIndex])?.size || SIZES[altIndex];

    setRecommendation({ rec: recSize, alt: altSize, confidence });
    setStep(2);
  };

  const handleGenerate = () => {
    calculateSize(weight, height, fit);
  };

  const reset = () => {
    setStep(1);
    setRecommendation(null);
  };

  return (
    <>
      {/* Trigger Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className={`flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 font-bold rounded-xl hover:bg-blue-100 transition-colors ${buttonClassName}`}
      >
        <Ruler className="w-5 h-5" />
        Me ajude a escolher o tamanho
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsOpen(false)} />
          
          {/* Modal Content */}
          <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col justify-between max-h-[90vh] animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <Ruler className="w-5 h-5 text-blue-600" /> 
                Descubra seu Tamanho
              </h2>
              <button onClick={() => setIsOpen(false)} className="p-2 bg-white rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 md:p-6 hide-scrollbar">
              
              {/* STEP 1: INPUT FORM */}
              {step === 1 && (
                <div className="space-y-6 animate-in slide-in-from-left-4 fade-in">
                  <p className="text-gray-600 text-sm">
                    Informe suas medidas e como prefere usar {productName}. Nós calculamos o ajuste ideal para você.
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Altura */}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                        <Ruler className="w-4 h-4 text-gray-400" /> Altura (cm)
                      </label>
                      <div className="relative">
                        <input 
                          type="number" 
                          value={height}
                          onChange={(e) => setHeight(Number(e.target.value))}
                          className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-lg font-bold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                        />
                        <div className="absolute inset-x-0 bottom-0 px-3 pb-1">
                           <input type="range" min="140" max="210" value={height} onChange={(e) => setHeight(Number(e.target.value))} className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                        </div>
                      </div>
                    </div>

                    {/* Peso */}
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                        <Scale className="w-4 h-4 text-gray-400" /> Peso (kg)
                      </label>
                      <div className="relative">
                        <input 
                          type="number" 
                          value={weight}
                          onChange={(e) => setWeight(Number(e.target.value))}
                          className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-lg font-bold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                        />
                        <div className="absolute inset-x-0 bottom-0 px-3 pb-1">
                           <input type="range" min="40" max="140" value={weight} onChange={(e) => setWeight(Number(e.target.value))} className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                      <Shirt className="w-4 h-4 text-gray-400" /> Preferência de Caimento
                    </label>
                    <div className="flex flex-col gap-2">
                      {FIT_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => setFit(opt.id)}
                          className={`flex items-center p-3 rounded-xl border-2 transition-all text-left ${
                            fit === opt.id 
                              ? 'border-blue-600 bg-blue-50' 
                              : 'border-gray-100 bg-white hover:border-gray-200'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center shrink-0 ${
                            fit === opt.id ? 'border-blue-600' : 'border-gray-300'
                          }`}>
                            {fit === opt.id && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />}
                          </div>
                          <div>
                            <p className={`font-bold ${fit === opt.id ? 'text-blue-900' : 'text-gray-700'}`}>{opt.label}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleGenerate}
                    className="w-full py-4 mt-2 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-colors flex items-center justify-center gap-2 active:scale-95"
                  >
                    Ver meu tamanho <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* STEP 2: RESULT */}
              {step === 2 && recommendation && (
                <div className="space-y-6 animate-in slide-in-from-right-4 fade-in">
                  
                  {/* Highlight Box */}
                  <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white text-center relative overflow-hidden shadow-lg shadow-blue-900/20">
                     <div className="relative z-10">
                        <p className="text-blue-100 font-medium text-sm mb-1 uppercase tracking-wider">Tamanho Ideal</p>
                        <h3 className="text-5xl font-black mb-3">{recommendation.rec}</h3>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-white text-sm font-medium">
                          <CheckCircle2 className="w-4 h-4 text-green-300" />
                          {recommendation.confidence}% de Match
                        </div>
                     </div>
                     
                     {/* Background Shirt Silhouette Overlay */}
                     <Shirt className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 blur-[1px] rotate-12" />
                  </div>

                  {/* Insight Visual do Fit */}
                  <div className="flex gap-4 p-4 bg-gray-50 rounded-2xl items-center">
                     <div className="shrink-0 relative w-16 h-16 flex items-center justify-center bg-white rounded-xl shadow-sm border border-gray-100">
                        <Shirt 
                          className={`text-gray-900 transition-all duration-500 ${
                            fit === 'justo' ? 'w-6 h-6 scale-90' : 
                            fit === 'folgado' ? 'w-10 h-10 scale-110' : 'w-8 h-8'
                          }`} 
                        />
                     </div>
                     <div>
                       <h4 className="font-bold text-gray-900 text-sm">Ajuste {FIT_OPTIONS.find(f => f.id === fit)?.label}</h4>
                       <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                         Para esse caimento, recomendamos o tamanho <strong>{recommendation.rec}</strong>. 
                         Se preferir algo levemente diferente, o tamanho <strong>{recommendation.alt}</strong> também servirá.
                       </p>
                     </div>
                  </div>

                  {/* Tabela de Medidas */}
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5 mb-3">
                      <Ruler className="w-4 h-4 text-gray-400" /> Medidas do Produto (cm)
                    </h4>
                    <div className="rounded-xl border border-gray-200 overflow-hidden">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-700">
                          <tr>
                            <th className="px-4 py-2 font-bold w-1/4">Tamanho</th>
                            <th className="px-4 py-2 font-medium">Busto</th>
                            <th className="px-4 py-2 font-medium">Cintura</th>
                            <th className="px-4 py-2 font-medium">Comprimento</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-600">
                          {sizeChart.map((row) => (
                            <tr 
                              key={row.size} 
                              className={row.size === recommendation.rec ? 'bg-blue-50/50 font-bold text-blue-900 border-l-4 border-l-blue-600' : ''}
                            >
                              <td className="px-4 py-2">{row.size}</td>
                              <td className="px-4 py-2">{row.chest}</td>
                              <td className="px-4 py-2">{row.waist}</td>
                              <td className="px-4 py-2">{row.length}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <button 
                    onClick={reset}
                    className="w-full py-3 mt-2 text-gray-500 font-bold rounded-xl hover:bg-gray-50 transition-colors text-sm"
                  >
                    Calcular Novamente
                  </button>

                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
