import React, { useState } from "react";
import { Save, Globe, CreditCard, Mail, Shield } from "lucide-react";

export const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState("general");

  const tabs = [
    { id: "general", label: "Geral", icon: Globe },
    { id: "billing", label: "Faturamento", icon: CreditCard },
    { id: "email", label: "E-mail", icon: Mail },
    { id: "security", label: "Segurança", icon: Shield },
  ];

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold text-white">Configurações</h1>
        <p className="text-white/50">Gerencie as configurações globais da plataforma</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-64 shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${
                    activeTab === tab.id
                      ? "bg-orange-500/10 text-orange-500"
                      : "text-white/60 hover:bg-[#0A0A0F] hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex-1 bg-[#13131C] rounded-3xl border border-white/5 shadow-sm p-8">
          {activeTab === "general" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-4">Informações da Plataforma</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-white/70 mb-1">Nome da Plataforma</label>
                    <input type="text" defaultValue="Catálogo Digital SaaS" className="w-full px-4 py-2.5 bg-[#0A0A0F] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white/70 mb-1">URL Base</label>
                    <input type="text" defaultValue="https://app.catalogodigital.com" className="w-full px-4 py-2.5 bg-[#0A0A0F] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white/70 mb-1">E-mail de Suporte</label>
                    <input type="email" defaultValue="suporte@catalogodigital.com" className="w-full px-4 py-2.5 bg-[#0A0A0F] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" />
                  </div>
                </div>
              </div>
              <div className="pt-6 border-t border-white/5">
                <button className="bg-orange-500 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-600 transition-colors">
                  <Save className="w-5 h-5" /> Salvar Alterações
                </button>
              </div>
            </div>
          )}

          {activeTab === "billing" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-4">Configurações de Pagamento</h2>
                <p className="text-white/50 mb-4">Integração com gateway de pagamento (Stripe/Mercado Pago).</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-white/70 mb-1">Chave Pública (Public Key)</label>
                    <input type="text" placeholder="pk_test_..." className="w-full px-4 py-2.5 bg-[#0A0A0F] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white/70 mb-1">Chave Secreta (Secret Key)</label>
                    <input type="password" placeholder="sk_test_..." className="w-full px-4 py-2.5 bg-[#0A0A0F] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" />
                  </div>
                </div>
              </div>
              <div className="pt-6 border-t border-white/5">
                <button className="bg-orange-500 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-600 transition-colors">
                  <Save className="w-5 h-5" /> Salvar Alterações
                </button>
              </div>
            </div>
          )}

          {activeTab === "email" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-4">Configurações de E-mail (SMTP)</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-white/70 mb-1">Servidor SMTP</label>
                    <input type="text" placeholder="smtp.sendgrid.net" className="w-full px-4 py-2.5 bg-[#0A0A0F] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-white/70 mb-1">Porta</label>
                      <input type="text" placeholder="587" className="w-full px-4 py-2.5 bg-[#0A0A0F] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-white/70 mb-1">Usuário</label>
                      <input type="text" placeholder="apikey" className="w-full px-4 py-2.5 bg-[#0A0A0F] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white/70 mb-1">Senha</label>
                    <input type="password" placeholder="••••••••" className="w-full px-4 py-2.5 bg-[#0A0A0F] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" />
                  </div>
                </div>
              </div>
              <div className="pt-6 border-t border-white/5">
                <button className="bg-orange-500 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-600 transition-colors">
                  <Save className="w-5 h-5" /> Salvar Alterações
                </button>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-4">Segurança</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-[#0A0A0F] border border-white/10 rounded-xl">
                    <div>
                      <h3 className="font-bold text-white">Autenticação em Duas Etapas (2FA)</h3>
                      <p className="text-sm text-white/50">Exigir 2FA para todos os administradores.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-[#1A1A2E] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#13131C] after:border-white/20 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
