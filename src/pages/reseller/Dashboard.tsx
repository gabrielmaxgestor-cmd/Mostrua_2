import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useReseller } from "../../hooks/useReseller";
import { useOrders } from "../../hooks/useOrders";
import { useResellerProducts } from "../../hooks/useResellerProducts";
import { Package, ShoppingCart, Clock, Copy, Check, AlertCircle, Share2, DollarSign, MessageCircle } from "lucide-react";
import { ErrorState } from "../../components/ErrorState";

const MetricCard = ({ title, value, icon: Icon, color, link, badge, hoverBorder }: any) => {
  return (
    <Link to={link} className={`bg-[#13131C] p-5 rounded-2xl border border-white/10 transition-all hover:shadow-md block relative overflow-hidden group ${hoverBorder}`}>
       <div className="flex items-center gap-3 mb-4">
         <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
            <Icon className="w-5 h-5" />
         </div>
         {badge && badge}
       </div>
       <p className="text-3xl md:text-4xl font-black text-white mb-1 truncate">{value}</p>
       <p className="text-sm font-medium text-white/50">{title}</p>
    </Link>
  )
};

export const Dashboard = () => {
  const { user } = useAuth();
  const [retryCount, setRetryCount] = useState(0);
  const { reseller, loading: resellerLoading, error: resellerError } = useReseller(user?.uid);
  const { orders, loading: ordersLoading, error: ordersError } = useOrders(user?.uid);
  const { products, loading: productsLoading, error: productsError } = useResellerProducts(user?.uid);
  const [copied, setCopied] = useState(false);

  if (resellerLoading || ordersLoading || productsLoading) {
    return (
      <div className="space-y-6">
        <div className="w-64 h-10 bg-[#1A1A2E] animate-pulse rounded-lg mb-2"></div>
        <div className="w-full h-24 bg-[#1A1A2E] animate-pulse rounded-2xl"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="h-40 bg-[#13131C] animate-pulse rounded-2xl"></div>
          <div className="h-40 bg-[#13131C] animate-pulse rounded-2xl"></div>
          <div className="h-40 bg-[#13131C] animate-pulse rounded-2xl"></div>
          <div className="h-40 bg-[#13131C] animate-pulse rounded-2xl"></div>
        </div>
      </div>
    );
  }
  
  if (resellerError || ordersError || productsError) {
    return <ErrorState message="Erro ao carregar dados do painel." onRetry={() => setRetryCount(c => c + 1)} />;
  }

  const activeProductsCount = products.filter(p => p.active !== false).length;
  const totalOrdersCount = orders.length;
  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;

  const calculateTotal = () => {
    if (orders.length === 0) return 0;
    
    let total = 0;
    let hasField = false;
    
    orders.filter(o => o.status === 'delivered' || o.status === 'confirmed').forEach((o: any) => {
      if (typeof o.total === 'number') {
        total += o.total;
        hasField = true;
      } else if (o.items && Array.isArray(o.items)) {
        total += o.items.reduce((s: number, i: any) => s + ((i.price || 0) * (i.quantity || 1)), 0);
        hasField = true;
      }
    });

    if (!hasField && orders.some(o => o.status === 'delivered' || o.status === 'confirmed')) return null;
    return total;
  };

  const faturamentoValue = calculateTotal();
  const faturamentoText = faturamentoValue !== null 
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(faturamentoValue)
    : "—";

  const storeUrl = reseller ? `${window.location.origin}/store/${reseller.slug}` : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 18) return "Boa noite 🌙";
    if (hour >= 12) return "Boa tarde ⛅";
    return "Bom dia ☀️";
  };

  const storeName = reseller?.name || "Lojista";
  
  const getNextAction = () => {
    if (pendingOrdersCount > 0) return {
      icon: Clock,
      color: "orange",
      colorClass: "text-orange-600 bg-orange-100",
      title: `${pendingOrdersCount} pedido(s) aguardando`,
      desc: "Responda agora para não perder a venda",
      link: "/dashboard/orders",
      cta: "Ver pedidos",
      action: undefined
    };
    if (activeProductsCount === 0) return {
      icon: Package,
      color: "blue", 
      colorClass: "text-orange-500 bg-orange-100",
      title: "Ative seus primeiros produtos",
      desc: "Sem produtos ativos, sua loja não vende",
      link: "/dashboard/catalogs",
      cta: "Ativar produtos",
      action: undefined
    };
    return {
      icon: Share2,
      color: "green",
      colorClass: "text-green-600 bg-green-100",
      title: "Compartilhe sua loja agora",
      desc: "Cole o link no seu grupo do WhatsApp",
      link: undefined,
      cta: "Copiar link",
      action: handleCopy
    };
  };

  const nextAction = !isOnboarding ? getNextAction() : null;

  return (
    <div className="space-y-6 pb-20">
      {copied && (
        <div className="fixed bottom-6 right-6 bg-green-500 text-white px-4 py-3 rounded-xl shadow-lg font-bold flex items-center gap-2 z-50 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-5 h-5" />
          Link copiado!
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-white">{getGreeting()}, {storeName}</h1>
        <p className={`font-medium mt-1 ${pendingOrdersCount > 0 ? 'text-orange-600' : 'text-white/50'}`}>
          {pendingOrdersCount > 0 
            ? `Você tem ${pendingOrdersCount} pedido(s) aguardando atenção 🔴` 
            : (orders.length === 0 && activeProductsCount === 0) 
              ? "Vamos configurar sua loja para começar a vender? 👇" 
              : "Aqui está o resumo do seu negócio."}
        </p>
      </div>

      {reseller && (
        <div className="bg-[#13131C] p-5 rounded-2xl border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="flex-1 w-full">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-sm font-bold text-white/70">Link da sua loja</p>
              {((reseller as any).views !== undefined || (reseller as any).analytics?.views !== undefined) && (
                <span className="text-xs text-white/50 bg-[#13131C] px-2.5 py-0.5 rounded-full font-bold">
                   👀 {(reseller as any).views ?? (reseller as any).analytics?.views} visitas
                </span>
              )}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full">
              <div className="flex-1 flex items-center bg-[#0A0A0F] bg-[#0A0A0F] border border-white/10 rounded-xl bg-[#0A0A0F] px-4 py-3 overflow-hidden">
                <span className="text-white font-medium truncate whitespace-nowrap">{storeUrl}</span>
              </div>
              <div className="flex shrink-0 gap-2">
                <button 
                  onClick={handleCopy}
                  className="flex flex-1 justify-center items-center gap-2 px-5 py-3 bg-orange-500/10 text-orange-500 font-bold rounded-xl hover:bg-orange-100 transition-colors"
                >
                  <Copy className="w-4 h-4" /> Copiar
                </button>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Olha minha loja! ${storeUrl}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 justify-center items-center gap-2 px-5 py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-colors shadow-md shadow-green-500/20"
                >
                  <MessageCircle className="w-5 h-5" /> 
                  <span className="hidden sm:inline">Compartilhar</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {isOnboarding && (
        <div className="bg-[#13131C] rounded-2xl border border-white/10 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-black text-white">Configure sua loja</h2>
            <span className="text-sm font-bold text-white/50 bg-[#13131C] py-1.5 px-3 rounded-full">{completedSteps} de {setupSteps.length} concluídos</span>
          </div>
          <div className="w-full bg-[#13131C] rounded-full h-2 mb-3">
            <div
              className="h-2 rounded-full bg-orange-500 transition-all duration-500"
              style={{ width: `${(completedSteps / setupSteps.length) * 100}%` }}
            />
          </div>
          <p className="text-sm font-medium text-orange-500 bg-orange-500/10 py-2 px-4 rounded-lg mb-6 inline-block">
            {["Vamos começar? Sua primeira venda está a alguns passos 🚀",
              "Ótimo começo! Continue configurando sua loja",
              "Você está na metade! Quase lá 💪",
              "Quase pronto! Falta só mais um passo"
            ][completedSteps] || "Quase pronto!"}
          </p>

          <div className="space-y-3">
            {setupSteps.map((step, i) => (
              <div key={i} className={`relative flex items-start sm:items-center flex-col sm:flex-row gap-4 p-5 rounded-2xl border transition-all ${
                step.done
                  ? 'bg-[#0A0A0F] border-white/5 opacity-60'
                  : step.urgent
                    ? 'bg-red-500/10 border-y-red-100 border-r-red-100 border-l-4 border-l-red-500 shadow-sm'
                    : 'bg-[#13131C] border-white/10 hover:border-orange-500 hover:shadow-sm'
              }`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  step.done ? 'bg-green-100 text-green-600' : 'bg-[#13131C] border-2 border-white/20'
                }`}>
                  {step.done
                    ? <Check className="w-5 h-5" />
                    : <span className="text-sm font-black text-white/50">{i + 1}</span>
                  }
                </div>
                
                <div className="flex-1 w-full">
                  <div className="flex items-center gap-2">
                    <p className={`text-base font-bold ${step.done ? 'text-white/50 line-through' : 'text-white'}`}>
                      {step.label}
                    </p>
                    {!step.done && step.urgent && (
                       <span className="flex items-center gap-1 bg-red-100 text-red-400 text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full shrink-0">
                          <AlertCircle className="w-3 h-3 animate-[pulse_2s_ease-in-out_infinite]" />
                          Urgente
                       </span>
                    )}
                  </div>
                  {!step.done && <p className="text-sm text-white/50 mt-1">{step.sub}</p>}
                </div>
                
                {!step.done && (
                  <Link to={step.link}
                    className={`w-full sm:w-auto text-sm font-bold px-6 py-2.5 rounded-full shrink-0 text-center transition-transform active:scale-95 ${
                      step.urgent
                        ? 'bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-500/20'
                        : 'bg-orange-500 text-white hover:bg-orange-600 shadow-md shadow-orange-500/20'
                    }`}>
                    {step.cta}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <MetricCard 
          title="Faturamento Total"
          value={faturamentoText}
          icon={DollarSign}
          color="bg-emerald-50 text-emerald-600"
          hoverBorder="hover:border-emerald-300 hover:shadow-emerald-500/10"
          link="/dashboard/orders"
        />
        <MetricCard 
          title="Total de Pedidos"
          value={totalOrdersCount}
          icon={ShoppingCart}
          color="bg-purple-500/10 text-purple-600"
          hoverBorder="hover:border-purple-300 hover:shadow-purple-500/10"
          link="/dashboard/orders"
        />
        <MetricCard 
          title="Pedidos Pendentes"
          value={pendingOrdersCount}
          icon={Clock}
          color="bg-orange-500/10 text-orange-600"
          hoverBorder="hover:border-orange-300 hover:shadow-orange-500/10"
          link="/dashboard/orders"
          badge={pendingOrdersCount > 0 && (
            <span className="bg-red-100 text-red-600 text-[10px] uppercase font-black px-2 py-1 rounded-md animate-[pulse_2s_ease-in-out_infinite] shadow-sm ml-auto">
              Atender agora
            </span>
          )}
        />
        <MetricCard 
          title="Produtos Ativos"
          value={activeProductsCount}
          icon={Package}
          color="bg-orange-500/10 text-orange-500"
          hoverBorder="hover:border-orange-300 hover:shadow-orange-500/10"
          link="/dashboard/products"
        />
      </div>

      {nextAction && (
        <div className="bg-[#13131C] p-6 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left relative overflow-hidden group shadow-sm transition-all hover:border-orange-500">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${nextAction.colorClass} shadow-inner`}>
             <nextAction.icon className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <p className="text-xs uppercase font-black tracking-wider text-white/40 mb-1">Próxima ação sugerida</p>
            <h3 className="text-xl font-bold text-white leading-tight">{nextAction.title}</h3>
            <p className="text-white/50 text-sm mt-1">{nextAction.desc}</p>
          </div>
          {nextAction.link ? (
             <Link to={nextAction.link} className={`w-full sm:w-auto px-8 py-3.5 rounded-full font-bold transition-all text-white shadow-md active:scale-95 grid place-items-center ${
               nextAction.color === 'orange' ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20' : 
               nextAction.color === 'blue' ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20' : 
               'bg-green-600 hover:bg-green-700 shadow-green-500/20'
             }`}>
               {nextAction.cta}
             </Link>
          ) : (
             <button onClick={nextAction.action} className={`w-full sm:w-auto px-8 py-3.5 rounded-full font-bold transition-all text-white shadow-md active:scale-95 grid place-items-center ${
               nextAction.color === 'orange' ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20' : 
               nextAction.color === 'blue' ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20' : 
               'bg-green-600 hover:bg-green-700 shadow-green-500/20'
             }`}>
               {nextAction.cta}
             </button>
          )}
        </div>
      )}
    </div>
  );
};

