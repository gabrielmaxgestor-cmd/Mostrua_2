import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { useReseller } from '../../hooks/useReseller';
import { Globe, Loader2, CheckCircle2, XCircle, AlertCircle, ExternalLink } from 'lucide-react';

export const CustomDomain = () => {
  const { user } = useAuth();
  const { reseller, loading } = useReseller(user?.uid);
  const [domain, setDomain] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (reseller?.customDomain) {
      setDomain(reseller.customDomain);
    }
  }, [reseller]);

  if (loading) return <div>Carregando...</div>;

  // Limitação de plano: apenas para exemplo, vamos assumir que 'pro' é o plano pago
  // Se não tiver campo plan, vamos assumir que é free para demonstrar o upsell
  const isPro = reseller?.plan === 'pro';

  const handleSaveDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;

    // Basic domain validation
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain)) {
      setToast({ type: 'error', text: 'Por favor, insira um domínio válido (ex: loja.com.br)' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'resellers', user.uid), {
        customDomain: domain.toLowerCase(),
        customDomainStatus: 'pending',
        customDomainVerifiedAt: null
      });

      // Aqui você chamaria a API da Vercel no seu backend real:
      // await fetch('/api/vercel/domains', { method: 'POST', body: JSON.stringify({ domain }) })

      setToast({ type: 'success', text: 'Domínio salvo! Siga as instruções para configurar o DNS.' });
      setTimeout(() => setToast(null), 5000);
    } catch (error) {
      console.error("Error saving domain:", error);
      setToast({ type: 'error', text: 'Erro ao salvar domínio.' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async () => {
    if (!user?.uid || !reseller?.customDomain) return;
    
    setIsVerifying(true);
    try {
      // Simulação de verificação de DNS
      // No mundo real, você chamaria a API da Vercel:
      // const res = await fetch(`/api/vercel/domains/${reseller.customDomain}/verify`)
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // Fake delay
      
      // Para demonstração, vamos simular que deu certo
      await updateDoc(doc(db, 'resellers', user.uid), {
        customDomainStatus: 'active',
        customDomainVerifiedAt: new Date()
      });

      setToast({ type: 'success', text: 'Domínio verificado com sucesso!' });
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      setToast({ type: 'error', text: 'Ainda não conseguimos verificar. Tente novamente mais tarde.' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRemove = async () => {
    if (!user?.uid) return;
    if (!confirm('Tem certeza que deseja remover este domínio?')) return;

    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'resellers', user.uid), {
        customDomain: null,
        customDomainStatus: null,
        customDomainVerifiedAt: null
      });
      setDomain('');
      setToast({ type: 'success', text: 'Domínio removido.' });
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      setToast({ type: 'error', text: 'Erro ao remover domínio.' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isPro) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white p-8 rounded-3xl border border-gray-200 text-center space-y-6">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
            <Globe className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Domínio Personalizado</h2>
            <p className="text-gray-500 max-w-md mx-auto">
              Tenha sua loja no seu próprio endereço (ex: www.sualoja.com.br). 
              Esta é uma funcionalidade exclusiva do plano Pro.
            </p>
          </div>
          <button className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors">
            Fazer Upgrade para o Pro
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Domínio Personalizado</h1>
        <p className="text-gray-500">Conecte seu próprio domínio à sua loja.</p>
      </div>

      {toast && (
        <div className={`p-4 rounded-xl text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.text}
        </div>
      )}

      <div className="bg-white p-6 rounded-3xl border border-gray-200 space-y-6">
        
        {/* Form */}
        <form onSubmit={handleSaveDomain} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Seu Domínio</label>
            <div className="flex gap-3">
              <input 
                type="text" 
                value={domain}
                onChange={e => setDomain(e.target.value)}
                placeholder="ex: loja.minhaempresa.com.br"
                disabled={reseller?.customDomainStatus === 'active'}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50 disabled:text-gray-500"
              />
              {!reseller?.customDomainStatus || reseller?.customDomainStatus === 'failed' ? (
                <button 
                  type="submit"
                  disabled={isSubmitting || !domain}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Salvar
                </button>
              ) : (
                <button 
                  type="button"
                  onClick={handleRemove}
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  Remover
                </button>
              )}
            </div>
          </div>
        </form>

        {/* Status & Instructions */}
        {reseller?.customDomain && (
          <div className="pt-6 border-t border-gray-100 space-y-6">
            
            {/* Status Badge */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="flex items-center gap-3">
                {reseller.customDomainStatus === 'active' ? (
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                ) : reseller.customDomainStatus === 'failed' ? (
                  <XCircle className="w-6 h-6 text-red-500" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-yellow-500" />
                )}
                <div>
                  <p className="font-bold text-gray-900">{reseller.customDomain}</p>
                  <p className="text-sm text-gray-500">
                    Status: {
                      reseller.customDomainStatus === 'active' ? <span className="text-green-600">Verificado e Ativo</span> :
                      reseller.customDomainStatus === 'failed' ? <span className="text-red-600">Erro na verificação</span> :
                      <span className="text-yellow-600">Aguardando configuração DNS</span>
                    }
                  </p>
                </div>
              </div>
              
              {reseller.customDomainStatus === 'active' && (
                <a 
                  href={`https://${reseller.customDomain}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700"
                >
                  Acessar <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>

            {/* Instructions */}
            {reseller.customDomainStatus !== 'active' && (
              <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 space-y-4">
                <h3 className="font-bold text-blue-900">Como configurar seu domínio</h3>
                <p className="text-sm text-blue-800">
                  Vá ao painel da empresa onde você comprou seu domínio (Registro.br, GoDaddy, HostGator, etc) e adicione o seguinte registro DNS:
                </p>
                
                <div className="bg-white rounded-xl border border-blue-200 overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-2 font-bold text-gray-700">Tipo</th>
                        <th className="px-4 py-2 font-bold text-gray-700">Nome (Host)</th>
                        <th className="px-4 py-2 font-bold text-gray-700">Valor (Destino)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-4 py-3 font-mono text-blue-600">CNAME</td>
                        <td className="px-4 py-3 font-mono text-gray-900">
                          {reseller.customDomain.split('.').length > 2 ? reseller.customDomain.split('.')[0] : '@'}
                        </td>
                        <td className="px-4 py-3 font-mono text-gray-900">cname.vercel-dns.com</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-blue-700">
                    * A propagação do DNS pode levar até 48 horas.
                  </p>
                  <button 
                    onClick={handleVerify}
                    disabled={isVerifying}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isVerifying && <Loader2 className="w-4 h-4 animate-spin" />}
                    Verificar Domínio
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
