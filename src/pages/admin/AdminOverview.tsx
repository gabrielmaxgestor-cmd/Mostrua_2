import React, { useEffect, useState } from "react";
import { adminAnalyticsService, AdminMetrics } from "../../services/adminAnalyticsService";
import { Users, ShoppingCart, Package, ArrowRight, Clock } from "lucide-react";
import { Link } from "react-router-dom";

export const AdminOverview = () => {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAnalyticsService.getGlobalMetrics().then(data => {
      setMetrics(data);
      setLoading(false);
    });
  }, []);

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  const StatCard = ({ title, value, icon: Icon, color = "blue" }: any) => (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-${color}-50 text-${color}-600`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <h3 className="text-gray-500 font-medium mb-1">{title}</h3>
      <p className="text-3xl font-black text-gray-900">{value}</p>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Visão geral da plataforma</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total de Revendedores" 
          value={metrics.saas.totalResellers} 
          icon={Users} 
          color="blue"
        />
        <StatCard 
          title="Total de Pedidos" 
          value={metrics.platform.totalOrders} 
          icon={ShoppingCart} 
          color="green"
        />
        <StatCard 
          title="Produtos Cadastrados" 
          value={metrics.platform.totalProducts} 
          icon={Package} 
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Orders */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Últimos Pedidos</h3>
            <Link to="/admin/orders" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
              Ver todos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="flex-1 flex flex-col justify-center items-center text-gray-400 py-8">
            <Clock className="w-12 h-12 mb-3 text-gray-300" />
            <p>Nenhum pedido recente.</p>
          </div>
        </div>

        {/* New Resellers */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Novos Revendedores</h3>
            <Link to="/admin/users" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
              Ver todos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="space-y-4">
            {metrics.saas.totalResellers > 0 ? (
              <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                    R
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Revendedor Exemplo</p>
                    <p className="text-xs text-gray-500">loja-exemplo</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                  Ativo
                </span>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-center items-center text-gray-400 py-8">
                <Users className="w-12 h-12 mb-3 text-gray-300" />
                <p>Nenhum revendedor recente.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
