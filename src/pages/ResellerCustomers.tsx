import React, { useEffect, useState, useMemo } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { MessageCircle, Search, Loader2 } from 'lucide-react';
 
export const ResellerCustomers = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
 
  useEffect(() => {
    if (!user?.uid) return;
    getDocs(query(collection(db, 'orders'), where('resellerId', '==', user.uid)))
      .then(snap => { setOrders(snap.docs.map(d => d.data())); setLoading(false); });
  }, [user?.uid]);
 
  const customers = useMemo(() => {
    const map = new Map<string, any>();
    orders.forEach(order => {
      const phone = order.customer?.phone || order.customerPhone || 'sem-telefone';
      if (!map.has(phone)) {
        map.set(phone, {
          name: order.customer?.name || order.customerName || '-',
          phone,
          totalOrders: 0,
          totalSpent: 0,
          lastOrder: null
        });
      }
      const c = map.get(phone);
      c.totalOrders++;
      c.totalSpent += order.total || 0;
      const date = order.createdAt?.toDate?.() || null;
      if (date && (!c.lastOrder || date > c.lastOrder)) c.lastOrder = date;
    });
    return Array.from(map.values()).sort((a, b) => (b.lastOrder || 0) - (a.lastOrder || 0));
  }, [orders]);
 
  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search.replace(/\D/g,''))
  );
 
  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;
 
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Clientes ({customers.length})</h1>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome ou telefone"
            className="pl-9 pr-4 py-2 border rounded-xl text-sm w-64" />
        </div>
      </div>
      {filtered.length === 0 ? (
        <p className="text-gray-500 text-center py-12">Nenhum cliente encontrado.</p>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr className="text-gray-500 text-left">
              <th className="p-4">Cliente</th><th className="p-4">Telefone</th>
              <th className="p-4 text-center">Pedidos</th><th className="p-4 text-right">Total</th>
              <th className="p-4 text-center">Acao</th>
            </tr></thead>
            <tbody>{filtered.map((c, i) => (
              <tr key={i} className="border-t hover:bg-gray-50">
                <td className="p-4 font-medium text-gray-900">{c.name}</td>
                <td className="p-4 text-gray-500">{c.phone}</td>
                <td className="p-4 text-center">{c.totalOrders}</td>
                <td className="p-4 text-right font-bold">R$ {c.totalSpent.toFixed(2)}</td>
                <td className="p-4 text-center">
                  <a href={`https://wa.me/55${c.phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                     className="p-2 bg-green-100 text-green-600 rounded-lg inline-flex hover:bg-green-200">
                    <MessageCircle className="w-4 h-4" />
                  </a>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
};
