import { useAuth } from '../../context/AuthContext';
import { useAnalytics } from '../../hooks/useAnalytics';
import { BarChart3, TrendingUp, TrendingDown, ShoppingBag, Eye, ShoppingCart, DollarSign } from 'lucide-react';

export default function Analytics() {
  const { user } = useAuth();
  const { loading, dailyViews, topViewedProducts, topCartProducts, stats } = useAnalytics(user?.uid);

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!loading && stats.current7DaysViews === 0 && stats.totalOrders === 0) {
    return (
      <div className="text-center py-16">
        <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900">Ainda sem dados</h2>
        <p className="text-gray-500 mt-2">
          Compartilhe o link da sua loja para comecar a receber visitas.
          Os dados aparecem aqui em ate 24h.
        </p>
      </div>
    );
  }

  // SVG Chart calculations
  const maxViews = Math.max(...dailyViews.map(d => d.views), 1);
  const chartHeight = 250;
  const chartWidth = 800;
  const padding = 40;
  const xStep = (chartWidth - padding * 2) / (dailyViews.length - 1 || 1);

  const points = dailyViews.map((d, i) => {
    const x = padding + i * xStep;
    const y = chartHeight - padding - (d.views / maxViews) * (chartHeight - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <Eye className="w-5 h-5 text-blue-600" />
            </div>
            <div className={`flex items-center gap-1 text-sm font-medium ${stats.viewsChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.viewsChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {Math.abs(stats.viewsChange).toFixed(1)}%
            </div>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Visitas (7 dias)</h3>
          <p className="text-2xl font-bold text-gray-900">{stats.current7DaysViews}</p>
          <p className="text-xs text-gray-400 mt-1">vs {stats.previous7DaysViews} na semana anterior</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Pedidos (7 dias)</h3>
          <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Taxa de Conversão</h3>
          <p className="text-2xl font-bold text-gray-900">{stats.conversionRate.toFixed(2)}%</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Ticket Médio</h3>
          <p className="text-2xl font-bold text-gray-900">R$ {stats.averageTicket.toFixed(2)}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
        <h3 className="text-lg font-bold text-gray-900 mb-6">Visitas nos últimos 14 dias</h3>
        <div className="min-w-[600px]">
          <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="overflow-visible">
            {/* Y Axis Grid */}
            {[0, 0.5, 1].map(ratio => {
              const y = padding + ratio * (chartHeight - padding * 2);
              return (
                <g key={ratio}>
                  <line x1={padding} y1={y} x2={chartWidth - padding} y2={y} stroke="#f3f4f6" strokeWidth="1" />
                  <text x={padding - 10} y={y + 4} textAnchor="end" className="text-xs fill-gray-400">
                    {Math.round(maxViews * (1 - ratio))}
                  </text>
                </g>
              );
            })}

            {/* Line */}
            <polyline
              points={points}
              fill="none"
              stroke="#16a34a"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Points & Tooltips */}
            {dailyViews.map((d, i) => {
              const x = padding + i * xStep;
              const y = chartHeight - padding - (d.views / maxViews) * (chartHeight - padding * 2);
              const dateStr = new Date(d.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
              
              return (
                <g key={i} className="group cursor-pointer">
                  <circle cx={x} cy={y} r="4" fill="#fff" stroke="#16a34a" strokeWidth="2" className="group-hover:r-6 transition-all" />
                  {/* X Axis Label */}
                  <text x={x} y={chartHeight - 10} textAnchor="middle" className="text-xs fill-gray-400">
                    {dateStr}
                  </text>
                  {/* Tooltip */}
                  <g className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <rect x={x - 30} y={y - 35} width="60" height="24" rx="4" fill="#1f2937" />
                    <text x={x} y={y - 18} textAnchor="middle" className="text-xs fill-white font-medium">
                      {d.views}
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-gray-400" /> Produtos Mais Visualizados
          </h3>
          <div className="space-y-4">
            {topViewedProducts.map((p, i) => (
              <div key={p.productId} className="flex items-center gap-4">
                <span className="text-lg font-bold text-gray-300 w-4">{i + 1}</span>
                <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                  {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : null}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                  <p className="text-xs text-gray-500">{p.views} visualizações</p>
                </div>
              </div>
            ))}
            {topViewedProducts.length === 0 && <p className="text-sm text-gray-500 text-center py-4">Nenhum dado disponível</p>}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-gray-400" /> Mais Adicionados ao Carrinho
          </h3>
          <div className="space-y-4">
            {topCartProducts.map((p, i) => (
              <div key={p.productId} className="flex items-center gap-4">
                <span className="text-lg font-bold text-gray-300 w-4">{i + 1}</span>
                <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                  {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : null}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                  <p className="text-xs text-gray-500">{p.addedToCart || 0} adições</p>
                </div>
              </div>
            ))}
            {topCartProducts.length === 0 && <p className="text-sm text-gray-500 text-center py-4">Nenhum dado disponível</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
