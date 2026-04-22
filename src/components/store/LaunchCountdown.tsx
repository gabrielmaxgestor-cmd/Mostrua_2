'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Clock, Calendar, MessageCircle, Info, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LaunchCountdownProps {
  releaseDate: Date; // Usando Data padrão para o JS iterar. (Do firestore passe timestamp.toDate())
  productName: string;
  productImage: string;
  resellerWhatsApp?: string;
}

export const LaunchCountdown: React.FC<LaunchCountdownProps> = ({ 
  releaseDate, 
  productName, 
  productImage,
  resellerWhatsApp = "5511999999999"
}) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isLaunched, setIsLaunched] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Form States
  const [formData, setFormData] = useState({ name: '', size: 'G' });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = releaseDate.getTime() - new Date().getTime();
      
      if (difference <= 0) {
        if (!isLaunched) {
           setIsLaunched(true);
           triggerConfetti();
        }
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      };
    };

    // Verificação imediata
    const initialTime = calculateTimeLeft();
    setTimeLeft(initialTime);

    if (!isLaunched && new Date().getTime() < releaseDate.getTime()) {
      const timer = setInterval(() => {
        setTimeLeft(calculateTimeLeft());
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [releaseDate, isLaunched]);

  const triggerConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#22c55e', '#ffffff', '#eab308']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#22c55e', '#ffffff', '#eab308']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  const handleReservation = (e: React.FormEvent) => {
    e.preventDefault();
    const txt = `🔔 *RESERVA DE LANÇAMENTO* 🔔\n\nOlá, sou *${formData.name}*!\nQuero garantir a minha: *${productName}*\nTamanho: *${formData.size}*\n\nMe avise assim que for liberado!`;
    const url = `https://wa.me/${resellerWhatsApp}?text=${encodeURIComponent(txt)}`;
    window.open(url, '_blank');
    setShowModal(false);
  };

  // UI para cada bloco numérico
  const TimeBlock = ({ value, label }: { value: number, label: string }) => (
    <div className="flex flex-col items-center bg-white/10 backdrop-blur-md rounded-xl p-3 w-[72px] sm:w-20 border border-white/20 shadow-xl">
      <span className="text-2xl sm:text-3xl font-black text-white lining-nums font-mono drop-shadow-md">
        {value.toString().padStart(2, '0')}
      </span>
      <span className="text-[10px] sm:text-xs font-bold text-white/80 uppercase tracking-wider mt-1">{label}</span>
    </div>
  );

  return (
    <>
      <div className="w-full relative rounded-3xl overflow-hidden bg-gray-900 shadow-2xl flex flex-col md:flex-row group">
        
        {/* Background Image Area (Mobile Top, Desktop Left) */}
        <div className="w-full md:w-1/2 aspect-[4/3] md:aspect-auto md:h-auto relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-gray-900 via-gray-900/60 to-transparent z-10" />
          <img 
            src={productImage} 
            alt={productName}
            className={`w-full h-full object-cover transition-transform duration-1000 ${isLaunched ? 'scale-110' : 'scale-100 group-hover:scale-105'}`}
          />
          {/* Badge */}
          <div className="absolute top-4 left-4 z-20">
            {isLaunched ? (
               <span className="bg-green-500 text-white font-bold text-xs px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                 <Sparkles className="w-4 h-4" /> NO AR A AGORA!
               </span>
            ) : (
               <span className="bg-amber-500 text-white font-bold text-xs px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1 animate-pulse">
                 <Clock className="w-4 h-4" /> DROP EXCLUSIVO
               </span>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col justify-center relative z-20 bg-gray-900">
          <h3 className="text-2xl md:text-3xl font-black text-white mb-2 leading-tight">
            {productName}
          </h3>
          <p className="text-gray-400 text-sm mb-8 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Lançamento: {releaseDate.toLocaleDateString('pt-BR')} às {releaseDate.getHours().toString().padStart(2, '0')}:{releaseDate.getMinutes().toString().padStart(2, '0')}
          </p>

          <AnimatePresence mode="wait">
            {!isLaunched ? (
              <motion.div 
                key="countdown"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="mb-8"
              >
                <div className="flex gap-2 sm:gap-4 justify-start">
                  <TimeBlock value={timeLeft.days} label="Dias" />
                  <TimeBlock value={timeLeft.hours} label="Horas" />
                  <TimeBlock value={timeLeft.minutes} label="Minutos" />
                  <TimeBlock value={timeLeft.seconds} label="Segundos" />
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="launched"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-8 p-4 bg-green-500/20 border border-green-500/30 rounded-2xl"
              >
                <h4 className="text-green-400 font-black text-xl flex items-center gap-2">
                  <span className="text-2xl">🔥</span> DISPONÍVEL AGORA!
                </h4>
                <p className="text-green-100/80 text-sm mt-1">Este produto já foi liberado para o catálogo.</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Area */}
          {!isLaunched ? (
            <button 
              onClick={() => setShowModal(true)}
              className="w-full py-4 bg-white text-gray-900 rounded-2xl font-black uppercase tracking-wider hover:bg-gray-100 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            >
              Reservar Meu Exemplar
            </button>
          ) : (
            <button 
              onClick={() => {
                // Roteamento padrão ou link Whatsapp direto caso a UI já seja dentro da página
                window.location.href = `#produto`; // Ajuste no consumo
              }}
              className="w-full py-4 bg-green-500 text-white rounded-2xl font-black uppercase tracking-wider hover:bg-green-600 transition-colors shadow-[0_0_20px_rgba(34,197,94,0.4)]"
            >
              Comprar Agora
            </button>
          )}
          
          {!isLaunched && (
             <p className="text-gray-500 text-xs text-center mt-4 flex items-center justify-center gap-1">
               <Info className="w-3 h-3" /> Estoque de lançamento será limitadíssimo.
             </p>
          )}
        </div>
      </div>

      {/* Reservation Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowModal(false)} />
             <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="relative bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
             >
                <div className="p-6 bg-gradient-to-r from-gray-900 to-gray-800 text-white flex justify-between items-center">
                  <div>
                     <h3 className="font-black text-xl">Confirmar Reserva</h3>
                     <p className="text-sm text-gray-300 mt-1">{productName}</p>
                  </div>
                  <button onClick={() => setShowModal(false)} className="p-2 bg-white/10 rounded-full hover:bg-white/20">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <form onSubmit={handleReservation} className="p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Seu Nome Completo</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Como podemos te chamar?"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Tamanho Desejado</label>
                    <select 
                      value={formData.size}
                      onChange={e => setFormData({ ...formData, size: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                    >
                      {['PP', 'P', 'M', 'G', 'GG', 'XGG'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <p className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg border border-blue-100 flex gap-2 leading-relaxed">
                    <Info className="w-4 h-4 text-blue-500 shrink-0" />
                    Ao confirmar, enviaremos os dados da sua reserva por WhatsApp para o lojista, garantindo sua prioridade no lançamento.
                  </p>

                  <button 
                    type="submit"
                    className="w-full py-4 bg-green-600 text-white rounded-xl font-bold uppercase tracking-wider hover:bg-green-700 transition-colors flex justify-center items-center gap-2"
                  >
                    <MessageCircle className="w-5 h-5" /> Confirmar no WhatsApp
                  </button>
                </form>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
