import React, { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { onCanInstallChange, promptInstall } from '../../utils/pwaInstall';

interface InstallBannerProps {
  storeName?: string;
  primaryColor?: string;
}

export const InstallBanner: React.FC<InstallBannerProps> = ({ storeName = 'nossa loja', primaryColor = '#2563EB' }) => {
  const [canInstall, setCanInstall] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if it's mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || navigator.maxTouchPoints > 0;
    
    if (!isMobile) return;

    // Check if dismissed recently
    const dismissedAt = localStorage.getItem('pwa_install_dismissed');
    if (dismissedAt) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        return;
      }
    }

    onCanInstallChange((can) => {
      setCanInstall(can);
    });

    // Show after 30 seconds
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 30000);

    return () => clearTimeout(timer);
  }, []);

  const handleInstall = async () => {
    const outcome = await promptInstall();
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa_install_dismissed', Date.now().toString());
    setIsVisible(false);
  };

  if (!canInstall || !isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 z-50 animate-in slide-in-from-bottom duration-500">
      <div className="max-w-md mx-auto bg-[#13131C] rounded-2xl shadow-2xl border border-white/5 p-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-white" style={{ backgroundColor: primaryColor }}>
          <Download className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-white text-sm">Instalar App</h4>
          <p className="text-xs text-white/50">Instale {storeName} na sua tela inicial para acesso rápido!</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={handleInstall}
            className="px-4 py-2 text-white font-bold text-sm rounded-xl transition-opacity hover:opacity-90"
            style={{ backgroundColor: primaryColor }}
          >
            Instalar
          </button>
          <button 
            onClick={handleDismiss}
            className="p-2 text-white/40 hover:text-white/60 bg-[#0A0A0F] hover:bg-[#13131C] rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
