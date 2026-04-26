import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useReseller } from "../../hooks/useReseller";
import { ExternalLink, Loader2, Monitor, Smartphone, RefreshCw } from "lucide-react";

export const StorePreview = () => {
  const { user } = useAuth();
  const { reseller, loading } = useReseller(user?.uid);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [iframeKey, setIframeKey] = useState(0);
  const [iframeLoading, setIframeLoading] = useState(true);

  const appBaseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
  const storeUrl = reseller?.slug ? `${appBaseUrl}/store/${reseller.slug}` : null;

  const handleRefresh = () => {
    setIframeLoading(true);
    setIframeKey(prev => prev + 1);
  };

  if (loading) return (
    <div className="flex justify-center py-12">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  );

  if (!storeUrl) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-gray-500">Sua loja ainda não está configurada.</p>
    </div>
  );

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prévia da Loja</h1>
          <p className="text-gray-500 text-sm">Veja exatamente como seus clientes enxergam sua loja.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Device toggle */}
          <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => setDevice("desktop")}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                device === "desktop"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Monitor className="w-4 h-4" />
              Desktop
            </button>
            <button
              onClick={() => setDevice("mobile")}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                device === "mobile"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Smartphone className="w-4 h-4" />
              Mobile
            </button>
          </div>

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-600 transition-colors"
            title="Atualizar prévia"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Open in new tab */}
          <a
            href={storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Abrir loja
          </a>
        </div>
      </div>

      {/* URL bar */}
      <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-4 py-2.5">
        <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
        <span className="text-sm text-gray-600 font-mono truncate">{storeUrl}</span>
      </div>

      {/* Preview area */}
      <div className="flex-1 flex justify-center bg-gray-200 rounded-2xl p-4 min-h-0" style={{ minHeight: "600px" }}>
        <div
          className={`relative bg-white rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ${
            device === "mobile"
              ? "w-[390px] h-[844px]"
              : "w-full h-full"
          }`}
          style={device === "mobile" ? { maxHeight: "844px" } : {}}
        >
          {/* Mobile notch decoration */}
          {device === "mobile" && (
            <div className="absolute top-0 left-0 right-0 h-8 bg-black z-10 flex items-center justify-center rounded-t-2xl">
              <div className="w-24 h-4 bg-gray-900 rounded-full" />
            </div>
          )}

          {/* Loading overlay */}
          {iframeLoading && (
            <div className="absolute inset-0 bg-white flex items-center justify-center z-20">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <p className="text-sm text-gray-500">Carregando prévia...</p>
              </div>
            </div>
          )}

          <iframe
            key={iframeKey}
            src={storeUrl}
            className="w-full h-full border-0"
            style={device === "mobile" ? { marginTop: "32px", height: "calc(100% - 32px)" } : {}}
            title="Prévia da loja"
            onLoad={() => setIframeLoading(false)}
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
        </div>
      </div>
    </div>
  );
};
