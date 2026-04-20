import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ResellerLayout } from "../components/Layout";
import { Check, Star } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { subscriptionService } from "../services/subscriptionService";
import { Plan } from "../types";

export const ResellerPlans: React.FC = () => {
  const { profile, subscription } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      await subscriptionService.seedPlansIfEmpty();
      const p = await subscriptionService.getPlans();
      // Sort by price
      setPlans(p.sort((a, b) => a.price - b.price));
      setLoading(false);
    };
    fetchPlans();
  }, []);

  const handleSubscribe = async (plan: Plan) => {
    if (!profile) return;

    setSubmitting(true);
    try {
      const data = await subscriptionService.createSubscription(profile.uid, plan.id);
      
      if (data.invoiceUrl) {
        window.location.href = data.invoiceUrl;
      } else {
        alert("Assinatura criada, mas link de pagamento não encontrado.");
        window.location.href = "/dashboard/subscription";
      }
    } catch (error: any) {
      console.error("Error subscribing", error);
      alert(error.message || "Erro ao processar assinatura.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ResellerLayout>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      </ResellerLayout>
    );
  }

  return (
    <ResellerLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Escolha o plano ideal para sua loja</h1>
          <p className="text-xl text-gray-500">
            Escale suas vendas com recursos profissionais e limites maiores.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const isCurrentPlan = subscription?.planId === plan.id && subscription?.status === 'active';
            const isPopular = plan.name === 'PREMIUM';

            return (
              <div 
                key={plan.id} 
                className={`relative bg-white rounded-3xl border transition-all duration-300 flex flex-col ${
                  isPopular 
                    ? 'border-blue-500 shadow-xl shadow-blue-100 md:-translate-y-4' 
                    : 'border-gray-200 shadow-sm hover:shadow-md'
                }`}
              >
                {isPopular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold flex items-center gap-1 shadow-sm">
                    <Star className="w-4 h-4 fill-current" /> Mais Popular
                  </div>
                )}
                
                <div className="p-8 border-b border-gray-100">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-gray-900">R$ {plan.price.toFixed(2).replace('.', ',')}</span>
                    <span className="text-gray-500 font-medium">/mês</span>
                  </div>
                </div>

                <div className="p-8 flex-1 flex flex-col">
                  <ul className="space-y-4 mb-8 flex-1">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="mt-1 bg-green-100 rounded-full p-0.5">
                          <Check className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSubscribe(plan)}
                    disabled={isCurrentPlan || submitting}
                    className={`w-full py-4 rounded-xl font-bold transition-all ${
                      isCurrentPlan
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : isPopular
                          ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200'
                          : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {isCurrentPlan ? 'Seu Plano Atual' : submitting ? 'Processando...' : 'Assinar Agora'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ResellerLayout>
  );
};
