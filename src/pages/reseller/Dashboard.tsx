import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useReseller } from "../../hooks/useReseller";
import { useOrders } from "../../hooks/useOrders";
import { useResellerProducts } from "../../hooks/useResellerProducts";
import { Package, ShoppingCart, Clock, ExternalLink, Copy } from "lucide-react";
import { ErrorState } from "../../components/ErrorState";

export const Dashboard = () => {
  const { user } = useAuth();
  const [retryCount, setRetryCount] = useState(0);
  const { reseller, loading: resellerLoading, error: resellerError } = useReseller(user?.uid);
  const { orders, loading: ordersLoading, error: ordersError } = useOrders(user?.uid);
  const { products, loading: productsLoading, error: productsError } = useResellerProducts(user?.uid);

  if (resellerLoading || ordersLoading || productsLoading) return <div className="p-12 text-center">Carregando...</div>;
  if (resellerError || ordersError || productsError) return <ErrorState message="Erro ao carregar dados do painel." onRetry={() => setRetryCount(c => c + 1)} />;

  const activeProductsCount = products.filter(p => p.active !== false).length;
  const totalOrdersCount = orders.length;
  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;

  const storeUrl = reseller ? `${window.location.origin}/store/${reseller.slug}` : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(storeUrl);
    alert("Link copiado!");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Bem-vindo ao painel da sua loja.</p>
      </div>

      {!reseller?.settings?.whatsapp && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
          <strong>Atencao:</strong> Voce nao configurou seu WhatsApp.
          Os clientes nao conseguirao finalizar pedidos.
          <Link to="/dashboard/store" className="ml-2 underline">Configurar agora</Link>
        </div>
      )}

      {reseller && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Link da sua loja</p>
            <div className="flex items-center gap-2">
              <span className="text-gray-900 font-medium bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                {storeUrl}
              </span>
              <button 
                onClick={handleCopy}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Copiar link"
              >
                <Copy className="w-5 h-5" />
              </button>
            </div>
          </div>
          <a 
            href={`/store/${reseller.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            Ver minha loja <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{activeProductsCount}</p>
          <p className="text-sm font-medium text-gray-500 mt-1">Produtos Ativos</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-6 h-6" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalOrdersCount}</p>
          <p className="text-sm font-medium text-gray-500 mt-1">Total de Pedidos</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{pendingOrdersCount}</p>
          <p className="text-sm font-medium text-gray-500 mt-1">Pedidos Pendentes</p>
        </div>
      </div>
    </div>
  );
};
