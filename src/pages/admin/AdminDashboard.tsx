import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { Layers, Package, Users, ShoppingCart, BookOpen } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await adminService.getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error("Error fetching stats", error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    );
  }

  const statusStyles: Record<string, string> = {
    pending:   'bg-yellow-500/15 text-yellow-300 border border-yellow-500/25',
    confirmed: 'bg-orange-500/15 text-orange-300 border border-orange-500/25',
    shipped:   'bg-green-500/15  text-green-300  border border-green-500/25',
  };

  const statusLabels: Record<string, string> = {
    pending:   'Pendente',
    confirmed: 'Confirmado',
    shipped:   'Enviado',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-white/50 mt-0.5">Visão geral da plataforma</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Nichos Ativos */}
        <div className="bg-[#13131C] p-5 rounded-2xl border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-orange-500 rounded-t-2xl" />
          <div className="w-10 h-10 bg-orange-500/15 text-orange-400 rounded-xl flex items-center justify-center mb-3">
            <Layers className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-1">Nichos Ativos</p>
          <h3 className="text-3xl font-bold text-white">{stats?.activeNiches ?? 0}</h3>
        </div>

        {/* Catálogos */}
        <div className="bg-[#13131C] p-5 rounded-2xl border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-blue-500 rounded-t-2xl" />
          <div className="w-10 h-10 bg-blue-500/15 text-blue-400 rounded-xl flex items-center justify-center mb-3">
            <BookOpen className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-1">Catálogos</p>
          <h3 className="text-3xl font-bold text-white">{stats?.totalCatalogs ?? 0}</h3>
        </div>

        {/* Produtos */}
        <div className="bg-[#13131C] p-5 rounded-2xl border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-purple-500 rounded-t-2xl" />
          <div className="w-10 h-10 bg-purple-500/15 text-purple-400 rounded-xl flex items-center justify-center mb-3">
            <Package className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-1">Produtos</p>
          <h3 className="text-3xl font-bold text-white">{stats?.totalProducts ?? 0}</h3>
        </div>

        {/* Revendedores */}
        <div className="bg-[#13131C] p-5 rounded-2xl border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-teal-500 rounded-t-2xl" />
          <div className="w-10 h-10 bg-teal-500/15 text-teal-400 rounded-xl flex items-center justify-center mb-3">
            <Users className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-1">Revendedores</p>
          <h3 className="text-3xl font-bold text-white">{stats?.activeResellers ?? 0}</h3>
        </div>

        {/* Pedidos 24h */}
        <div className="bg-[#13131C] p-5 rounded-2xl border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-green-500 rounded-t-2xl" />
          <div className="w-10 h-10 bg-green-500/15 text-green-400 rounded-xl flex items-center justify-center mb-3">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-1">Pedidos (24h)</p>
          <h3 className="text-3xl font-bold text-white">{stats?.recentOrdersCount ?? 0}</h3>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-[#13131C] rounded-2xl border border-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="font-bold text-base text-white">Últimos Pedidos</h2>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
            Ao vivo
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0A0A0F]">
                <th className="px-6 py-3 text-xs font-semibold text-white/45 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-xs font-semibold text-white/45 uppercase tracking-wider">Revendedor ID</th>
                <th className="px-6 py-3 text-xs font-semibold text-white/45 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-xs font-semibold text-white/45 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-white/45 uppercase tracking-wider">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {!stats?.recentOrders?.length ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-white/35">
                    <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    Nenhum pedido recente.
                  </td>
                </tr>
              ) : (
                stats.recentOrders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-medium text-white/90">{order.customerName}</td>
                    <td className="px-6 py-4 text-white/50 text-sm font-mono truncate max-w-[150px]">{order.resellerId}</td>
                    <td className="px-6 py-4 font-bold text-green-400">R$ {order.total?.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        statusStyles[order.status] ?? 'bg-white/5 text-white/60 border border-white/10'
                      }`}>
                        {statusLabels[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white/50 text-sm">
                      {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString('pt-BR') : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
