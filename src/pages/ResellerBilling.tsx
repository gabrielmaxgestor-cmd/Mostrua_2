import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { CreditCard, ExternalLink, Loader2 } from 'lucide-react';

export const ResellerBilling = () => {
  const { user, subscription, plan } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    getDocs(query(
      collection(db, 'payments'),
      where('resellerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    )).then(snap => {
      setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user?.uid]);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Assinatura e Faturamento</h1>
      
      {subscription && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-bold text-gray-900 mb-4">Plano Atual</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-black text-blue-600">{plan?.name || 'Carregando...'}</p>
              <p className="text-gray-500 text-sm">Status: {subscription.status}</p>
              {subscription.currentPeriodEnd && (
                <p className="text-gray-500 text-sm">
                  Proximo vencimento: {subscription.currentPeriodEnd.toDate().toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>
            {subscription.invoiceUrl && (
              <a href={subscription.invoiceUrl} target="_blank" rel="noopener noreferrer"
                 className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold">
                Pagar fatura <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-bold text-gray-900 mb-4">Historico de Pagamentos</h2>
        {payments.length === 0 ? (
          <p className="text-gray-500 text-sm">Nenhum pagamento registrado ainda.</p>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="text-gray-500 text-left border-b">
              <th className="pb-2">Data</th><th className="pb-2">Valor</th><th className="pb-2">Status</th>
            </tr></thead>
            <tbody>{payments.map(p => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="py-3">{p.createdAt?.toDate?.().toLocaleDateString('pt-BR') || '-'}</td>
                <td className="py-3 font-bold">R$ {p.value?.toFixed(2) || '-'}</td>
                <td className="py-3"><span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">{p.status}</span></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
};
