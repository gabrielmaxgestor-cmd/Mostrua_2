'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  TrendingUp, Eye, ShoppingBag, Percent, Trophy, Sparkles, Loader2, Calendar 
} from 'lucide-react';
import { getDashboardStats, AnalyticsSummary, PeriodType } from '../../services/analyticsService';

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

interface AnalyticsDashboardProps {
  catalogId: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ catalogId }) => {
  const [period, setPeriod] = useState<PeriodType>('7d');
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      const result = await getDashboardStats(catalogId, period);
      setData(result);
      setLoading(false);
    };
    fetchAnalytics();
  }, [catalogId, period]);

  const globalConversion = useMemo(() => {
    if (!data || data.totalViews === 0) return 0;
    return ((data.totalOrders / data.totalViews) * 100).toFixed(1);
  }, [data]);

  const autoInsight = useMemo(() => {
    if (!data || data.topProducts.length === 0) return "Aguardando mais dados para gerar insights.";
    const topProd = data.topProducts[0];
    
    if (topProd.conversion > 8) {
       return `🔥 Excelente foco em ${topProd.name}! A conversão está em ${topProd.conversion}%. Considere criar um combo com esse produto para ticket médio maior.`;
    }
    return `Seu produto mais pedido foi "${topProd.name}". Dica: observe se há tamanhos em falta para não perder vendas (tamanhos G e GG costumam ser os mais pedidos).`;
  }, [data]);

  if (loading || !data) {
    return (
      <div className="w-full h-96 flex flex-col items-center justify-center text-gray-400">
         <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-500" />
         <p>Processando dezenas de métricas...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 space-y-8 bg-gray-50/50 min-h-screen">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Catalycs • Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Inteligência de Vendas e Acessos</p>
        </div>
        
        <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-xl border border-gray-200">
          {(['7d', '30d', '90d'] as PeriodType[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                period === p 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {p === '7d' ? '7 Dias' : p === '30d' ? '30 Dias' : '90 Dias'}
            </button>
          ))}
        </div>
      </div>

      {/* Auto Insight Highlight */}
      <div className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-lg shadow-blue-900/10 flex flex-col md:flex-row items-center gap-4">
        <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl shrink-0">
          <Sparkles className="w-8 h-8 text-yellow-300" />
        </div>
        <div>
          <h4 className="text-blue-100 font-bold uppercase tracking-wider text-xs mb-1">Inteligência Artificial (Insight)</h4>
          <p className="text-lg font-medium leading-tight">{autoInsight}</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-2">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
            <Eye className="w-5 h-5" />
          </div>
          <span className="text-gray-500 font-medium text-sm">Visualizações Totais</span>
          <span className="text-3xl font-black text-gray-900">{data.totalViews.toLocaleString('pt-BR')}</span>
        </div>
        
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-2">
          <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mb-2">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <span className="text-gray-500 font-medium text-sm">Pedidos no WhatsApp</span>
          <span className="text-3xl font-black text-gray-900">{data.totalOrders.toLocaleString('pt-BR')}</span>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-2">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
            <Percent className="w-5 h-5" />
          </div>
          <span className="text-gray-500 font-medium text-sm">Taxa de Conversão</span>
          <span className="text-3xl font-black text-gray-900">{globalConversion}%</span>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-2">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
            <Trophy className="w-5 h-5" />
          </div>
          <span className="text-gray-500 font-medium text-sm">Time Mais Procurado</span>
          <span className="text-2xl font-black text-gray-900 truncate">{data.topTeam}</span>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Bar Chart: Top Teams */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gray-400" />
            Top Ligas/Times por Visualização
          </h3>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.topTeams} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="team" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <RechartsTooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                 />
                <Bar dataKey="views" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Categories */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-6 text-center">
            Preferência de Qualidade
          </h3>
          <div className="w-full h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.categoryDistribution}
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  labelLine={false}
                >
                  {data.categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Data Table Row */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="font-bold text-gray-900">Perdidos no Hype (Top Produtos)</h3>
          <span className="text-xs font-bold bg-green-50 text-green-700 px-3 py-1 rounded-lg">Atualizado agora</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/50 text-gray-700 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-bold">Produto</th>
                <th className="px-6 py-4 font-bold">Equipe</th>
                <th className="px-6 py-4 font-bold text-right">Acessos</th>
                <th className="px-6 py-4 font-bold text-right">Carrinhos</th>
                <th className="px-6 py-4 font-bold text-right">Conversão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.topProducts.map((prod) => (
                <tr key={prod.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-900 whitespace-nowrap">{prod.name}</td>
                  <td className="px-6 py-4">{prod.team}</td>
                  <td className="px-6 py-4 text-right font-mono">{prod.views.toLocaleString('pt-BR')}</td>
                  <td className="px-6 py-4 text-right font-mono text-green-600 font-bold">{prod.orders}</td>
                  <td className="px-6 py-4 text-right font-mono font-medium">
                     <span className={prod.conversion > 10 ? 'text-blue-600' : 'text-gray-500'}>
                        {prod.conversion}%
                     </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
