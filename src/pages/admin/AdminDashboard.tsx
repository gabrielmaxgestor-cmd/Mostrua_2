import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { Layers, Package, Users, ShoppingCart, TrendingUp, Store } from 'lucide-react';

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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-[#13131C] p-6 rounded-2xl border border-white/5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-xl flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-white/50">Nichos Ativos</p>
              <h3 className="text-2xl font-bold text-white">{stats?.activeNiches || 0}</h3>
            </div>
          </div>
        </div>

        <div className="bg-[#13131C] p-6 rounded-2xl border border-white/5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-white/50">Catálogos</p>
              <h3 className="text-2xl font-bold text-white">{stats?.totalCatalogs || 0}</h3>
            </div>
          </div>
        </div>

        <div className="bg-[#13131C] p-6 rounded-2xl border border-white/5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-500/10 text-purple-600 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-white/50">Produtos</p>
              <h3 className="text-2xl font-bold text-white">{stats?.totalProducts || 0}</h3>
            </div>
          </div>
        </div>

        <div className="bg-[#13131C] p-6 rounded-2xl border border-white/5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/10 text-green-600 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-white/50">Revendedores</p>
              <h3 className="text-2xl font-bold text-white">{stats?.activeResellers || 0}</h3>
            </div>
          </div>
        </div>

        <div className="bg-[#13131C] p-6 rounded-2xl border border-white/5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-500/10 text-orange-600 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-white/50">Pedidos (24h)</p>
              <h3 className="text-2xl font-bold text-white">{stats?.recentOrdersCount || 0}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#13131C] rounded-2xl border border-white/5 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="font-bold text-lg text-white">Últimos Pedidos</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0A0A0F] text-white/50 text-sm">
                <th className="p-4 font-medium">Cliente</th>
                <th className="p-4 font-medium">Revendedor ID</th>
                <th className="p-4 font-medium">Total</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {stats?.recentOrders?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-white/50">Nenhum pedido recente.</td>
                </tr>
              ) : (
                stats?.recentOrders?.map((order: any) => (
                  <tr key={order.id} className="hover:bg-[#0A0A0F]">
                    <td className="p-4 font-medium text-white">{order.customerName}</td>
                    <td className="p-4 text-white/50 text-sm truncate max-w-[150px]">{order.resellerId}</td>
                    <td className="p-4 font-bold text-green-600">R$ {order.total?.toFixed(2)}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-400' :
                        order.status === 'confirmed' ? 'bg-orange-100 text-orange-500' :
                        order.status === 'shipped' ? 'bg-green-100 text-green-400' :
                        'bg-[#13131C] text-white/70'
                      }`}>
                        {order.status === 'pending' ? 'Pendente' :
                         order.status === 'confirmed' ? 'Confirmado' :
                         order.status === 'shipped' ? 'Enviado' : order.status}
                      </span>
                    </td>
                    <td className="p-4 text-white/50 text-sm">
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
