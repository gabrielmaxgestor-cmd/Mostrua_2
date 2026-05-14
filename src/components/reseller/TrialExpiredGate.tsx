import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Lock, ArrowRight } from "lucide-react";

export const TrialExpiredGate: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#13131C] border border-white/10 rounded-2xl p-8 text-center space-y-6">

        {/* Ícone */}
        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8 text-red-500" />
        </div>

        {/* Título e descrição */}
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-white">
            Seu período de teste encerrou
          </h1>
          <p className="text-white/50 text-sm leading-relaxed">
            Os 7 dias gratuitos chegaram ao fim. Para continuar usando sua loja
            e recebendo pedidos, escolha um plano.
          </p>
        </div>

        {/* CTA principal */}
        <button
          onClick={() => navigate("/dashboard/plans")}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors"
        >
          Ver planos e assinar
          <ArrowRight className="w-4 h-4" />
        </button>

        {/* Sair */}
        <button
          onClick={handleLogout}
          className="text-sm text-white/30 hover:text-white/60 transition-colors"
        >
          Sair da conta
        </button>
      </div>
    </div>
  );
};
