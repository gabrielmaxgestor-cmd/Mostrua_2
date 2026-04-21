import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useReseller } from "../../hooks/useReseller";
import { useOrders } from "../../hooks/useOrders";
import { useResellerProducts } from "../../hooks/useResellerProducts";
import { Package, ShoppingCart, Clock, ExternalLink, Copy, Check } from "lucide-react";
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

  const setupSteps = [
    {
      done: !!reseller?.settings?.whatsapp,
      label: "Configure seu WhatsApp para receber pedidos",
      sub: "Sem isso, clientes não conseguem finalizar compras",
      link: "/dashboard/store",
      cta: "Configurar",
      urgent: true
    },
    {
      done: !!reseller?.settings?.logo,
      label: "Adicione o logo da sua loja",
      sub: "Passa mais credibilidade para os clientes",
      link: "/dashboard/store",
      cta: "Adicionar logo"
    },
    {
      done: activeProductsCount > 0,
      label: "Ative seus primeiros produtos",
      sub: "Escolha os catálogos e defina seus preços",
      link: "/dashboard/catalogs",
      cta: "Ativar produtos"
    },
    {
      done: !!reseller?.settings?.banner,
      label: "Adicione um banner para sua loja",
      sub: "Uma imagem de capa aumenta a conversão",
      link: "/dashboard/store",
      cta: "Adicionar banner"
    }
  ];

  const completedSteps = setupSteps.filter(s => s.done).length;
  const isOnboarding = completedSteps < setupSteps.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Aqui está o resumo do seu negócio hoje.</p>
      </div>

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

      {isOnboarding && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-gray-900">Configure sua loja</h2>
            <span className="text-sm text-gray-500">{completedSteps}/{setupSteps.length} concluídos</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mb-5">
            <div
              className="h-1.5 rounded-full bg-blue-600 transition-all"
              style={{ width: `${(completedSteps / setupSteps.length) * 100}%` }}
            />
          </div>
          <div className="space-y-3">
            {setupSteps.map((step, i) => (
              <div key={i} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                step.done
                  ? 'bg-gray-50 border-gray-100 opacity-60'
                  : step.urgent
                    ? 'bg-red-50 border-red-100'
                    : 'bg-gray-50 border-gray-100 hover:border-blue-100'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  step.done ? 'bg-green-100 text-green-600' : 'bg-white border-2 border-gray-200'
                }`}>
                  {step.done
                    ? <Check className="w-4 h-4" />
                    : <span className="text-xs font-bold text-gray-400">{i + 1}</span>
                  }
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${step.done ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                    {step.label}
                  </p>
                  {!step.done && <p className="text-xs text-gray-400 mt-0.5">{step.sub}</p>}
                </div>
                {!step.done && (
                  <Link to={step.link}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg shrink-0 ${
                      step.urgent
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}>
                    {step.cta}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/dashboard/products"
          className="bg-white p-6 rounded-2xl border border-gray-200 hover:border-blue-200 hover:shadow-md transition-all group block">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{activeProductsCount}</p>
          <p className="text-sm font-medium text-gray-500 mt-1">Produtos Ativos</p>
          <p className="text-xs text-blue-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            Gerenciar produtos →
          </p>
        </Link>

        <Link to="/dashboard/orders"
          className="bg-white p-6 rounded-2xl border border-gray-200 hover:border-green-200 hover:shadow-md transition-all group block">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-6 h-6" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalOrdersCount}</p>
          <p className="text-sm font-medium text-gray-500 mt-1">Total de Pedidos</p>
          <p className="text-xs text-green-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            Ver todos os pedidos →
          </p>
        </Link>

        <Link to="/dashboard/orders"
          className="bg-white p-6 rounded-2xl border border-gray-200 hover:border-orange-200 hover:shadow-md transition-all block group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{pendingOrdersCount}</p>
          <p className="text-sm font-medium text-gray-500 mt-1">Pedidos Pendentes</p>
          {pendingOrdersCount > 0 ? (
            <p className="text-xs text-orange-500 mt-2 font-medium">
              Atender agora →
            </p>
          ) : (
             <p className="text-xs text-orange-500 mt-2 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              Mural de Pedidos →
            </p>
          )}
        </Link>
      </div>
    </div>
  );
};
