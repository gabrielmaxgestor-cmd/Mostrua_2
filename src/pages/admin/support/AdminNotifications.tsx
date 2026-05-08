import React, { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../../firebase";
import { useAuth } from "../../../context/AuthContext";
import {
  createNotificationForReseller,
  broadcastNotification,
  NotificationType,
} from "../../../services/notificationService";

interface ResellerOption {
  id: string;
  name: string;
  email: string;
}

type SendTarget = "all" | "specific";

const NOTIFICATION_TYPES: { value: NotificationType; label: string }[] = [
  { value: "system", label: "📢 Comunicado do sistema" },
  { value: "plan", label: "💳 Plano / Assinatura" },
  { value: "custom", label: "✏️ Mensagem personalizada" },
];

export const AdminNotifications: React.FC = () => {
  const { user } = useAuth() as any;

  const [target, setTarget] = useState<SendTarget>("all");
  const [selectedResellerId, setSelectedResellerId] = useState("");
  const [type, setType] = useState<NotificationType>("system");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [resellers, setResellers] = useState<ResellerOption[]>([]);
  const [loadingResellers, setLoadingResellers] = useState(false);
  const [sending, setSending] = useState(false);
  const [resellerSearch, setResellerSearch] = useState("");
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    async function loadResellers() {
      setLoadingResellers(true);
      try {
        const q = query(collection(db, "resellers"), where("status", "==", "active"));
        const snap = await getDocs(q);
        setResellers(
          snap.docs.map((d) => ({
            id: d.id,
            name: d.data().storeName || d.data().name || "Sem nome",
            email: d.data().email || "",
          }))
        );
      } finally {
        setLoadingResellers(false);
      }
    }
    loadResellers();
  }, []);

  const filteredResellers = resellers.filter((r) => {
    if (!resellerSearch.trim()) return true;
    const q = resellerSearch.toLowerCase();
    return r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q);
  });

  function resetForm() {
    setTitle("");
    setMessage("");
    setSelectedResellerId("");
    setResellerSearch("");
  }

  async function handleSend() {
    if (!title.trim() || !message.trim()) {
      setFeedback({ ok: false, msg: "Preencha o título e a mensagem." });
      return;
    }
    if (target === "specific" && !selectedResellerId) {
      setFeedback({ ok: false, msg: "Selecione um revendedor." });
      return;
    }

    setSending(true);
    setFeedback(null);

    try {
      const payload = {
        type,
        title: title.trim(),
        message: message.trim(),
        target: target === "all" ? ("all" as const) : ("specific" as const),
        createdBy: user!.uid,
      };

      if (target === "specific") {
        await createNotificationForReseller(selectedResellerId, {
          ...payload,
          target: "specific",
          resellerId: selectedResellerId,
        });
      } else {
        const ids = resellers.map((r) => r.id);
        if (ids.length === 0) {
          setFeedback({ ok: false, msg: "Nenhum revendedor ativo encontrado." });
          setSending(false);
          return;
        }
        await broadcastNotification({ ...payload, target: "all" }, ids);
      }

      setFeedback({
        ok: true,
        msg:
          target === "all"
            ? `Notificação enviada para ${resellers.length} revendedores.`
            : "Notificação enviada com sucesso.",
      });
      resetForm();
    } catch {
      setFeedback({ ok: false, msg: "Erro ao enviar notificação." });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Notificações</h1>
        <p className="text-white/50">Envie comunicados e alertas para os revendedores</p>
      </div>

      <div className="bg-[#13131C] border border-white/5 rounded-2xl p-6 shadow-sm space-y-5">
        {/* Target */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">Destinatário</label>
          <div className="flex gap-3">
            <TargetOption
              label="Todos os revendedores"
              sublabel={`${resellers.length} ativos`}
              selected={target === "all"}
              onClick={() => setTarget("all")}
            />
            <TargetOption
              label="Revendedor específico"
              sublabel="Selecione abaixo"
              selected={target === "specific"}
              onClick={() => setTarget("specific")}
            />
          </div>
        </div>

        {/* Reseller picker */}
        {target === "specific" && (
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Selecionar revendedor</label>
            <input
              type="text"
              value={resellerSearch}
              onChange={(e) => setResellerSearch(e.target.value)}
              placeholder="Buscar por nome ou email..."
              className="w-full border border-white/10 rounded-xl px-3 py-2.5 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            {loadingResellers ? (
              <p className="text-sm text-white/40">Carregando revendedores...</p>
            ) : (
              <div className="max-h-44 overflow-y-auto border border-white/10 rounded-xl">
                {filteredResellers.length === 0 ? (
                  <p className="text-sm text-white/40 text-center py-4">Nenhum revendedor encontrado</p>
                ) : (
                  filteredResellers.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setSelectedResellerId(r.id)}
                      className={`w-full text-left px-3 py-2.5 text-sm transition-colors border-b border-white/5 last:border-0 ${
                        selectedResellerId === r.id
                          ? "bg-orange-500/10 text-orange-500"
                          : "hover:bg-[#0A0A0F] text-white/70"
                      }`}
                    >
                      <span className="font-medium">{r.name}</span>
                      <span className="text-white/40 ml-2 text-xs">{r.email}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1">Tipo de notificação</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as NotificationType)}
            className="w-full border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            {NOTIFICATION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1">Título</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Atualização do sistema"
            maxLength={100}
            className="w-full border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1">Mensagem</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="Digite o conteúdo da notificação..."
            maxLength={500}
            className="w-full border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
          />
          <p className="text-xs text-white/40 text-right mt-0.5">{message.length}/500</p>
        </div>

        {feedback && (
          <div className={`text-sm px-3 py-2.5 rounded-xl ${
            feedback.ok
              ? "bg-green-500/10 text-green-400 border border-green-500/30"
              : "bg-red-500/10 text-red-400 border border-red-500/30"
          }`}>
            {feedback.msg}
          </div>
        )}

        <button
          onClick={handleSend}
          disabled={sending}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500 text-white font-bold py-3 rounded-xl transition-colors text-sm shadow-lg shadow-orange-500"
        >
          {sending
            ? "Enviando..."
            : target === "all"
            ? `Enviar para todos (${resellers.length})`
            : "Enviar notificação"}
        </button>
      </div>

      {/* Preview */}
      {(title || message) && (
        <div className="mt-6">
          <p className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-2">Preview</p>
          <div className="bg-[#13131C] border border-white/5 rounded-2xl px-4 py-3 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="text-xl shrink-0">
                {type === "system" ? "📢" : type === "plan" ? "💳" : "✉️"}
              </span>
              <div>
                <p className="font-semibold text-white text-sm">{title || "Título da notificação"}</p>
                <p className="text-xs text-white/50 mt-0.5 whitespace-pre-wrap">
                  {message || "Conteúdo da mensagem..."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function TargetOption({
  label, sublabel, selected, onClick,
}: {
  label: string; sublabel: string; selected: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 text-left px-4 py-3 rounded-xl border-2 transition-colors ${
        selected ? "border-orange-500 bg-orange-500/10" : "border-white/10 hover:border-white/20"
      }`}
    >
      <p className={`text-sm font-medium ${selected ? "text-orange-500" : "text-white/70"}`}>{label}</p>
      <p className="text-xs text-white/40 mt-0.5">{sublabel}</p>
    </button>
  );
}
