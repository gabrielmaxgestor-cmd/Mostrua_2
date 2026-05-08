import React, { useState } from 'react';
import { Package } from 'lucide-react';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string | null;
  alt: string;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({ src, alt, className = '', ...props }) => {
  const [error, setError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  if (!src || error) {
    return (
      <div className={`bg-[#13131C] flex flex-col items-center justify-center aspect-square ${className}`}>
        <Package className="w-8 h-8 text-white/30 mb-2" />
        <span className="text-xs font-medium text-white/40">Sem imagem</span>
      </div>
    );
  }

  return (
    <div className={`relative aspect-square overflow-hidden bg-[#13131C] ${className}`}>
      {/* Skeleton Loader */}
      {!isLoaded && !error && (
        <div className="absolute inset-0 animate-pulse bg-[#1A1A2E]" />
      )}
      
      {/* Actual Image */}
      <img
        src={src}
        alt={alt}
        onLoad={() => setIsLoaded(true)}
        onError={() => setError(true)}
        loading="lazy"
        referrerPolicy="no-referrer"
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        {...props}
      />
    </div>
  );
};
