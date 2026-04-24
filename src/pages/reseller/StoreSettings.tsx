import React, { useState, useEffect, useRef } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import { useReseller } from "../../hooks/useReseller";
import { cloudinaryService } from "../../services/cloudinaryService";
import { Save, Image as ImageIcon, Loader2, Share2, Info, Check, AlertCircle, MessageCircle, AtSign, Copy } from "lucide-react";
import { QRCodeGenerator } from "../../components/reseller/QRCodeGenerator";
import { CatalogExporter } from "../../components/reseller/CatalogExporter";

export const StoreSettings = () => {
  const { user } = useAuth();
  const { reseller, loading } = useReseller(user?.uid);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error", text: string } | null>(null);

  const [formData, setFormData] = useState({
    storeName: "",
    primaryColor: "#2563eb",
    secondaryColor: "#1e40af",
    description: "",
    whatsapp: "",
    instagram: "",
    pixKey: "",
    pixName: "",
    pixCity: ""
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState("");

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (reseller?.settings) {
      setFormData({
        storeName: reseller.storeName || "",
        primaryColor: reseller.settings.primaryColor || "#2563eb",
        secondaryColor: reseller.settings.secondaryColor || "#1e40af",
        description: reseller.settings.description || "",
        whatsapp: reseller.settings.whatsapp || "",
        instagram: reseller.settings.instagram || "",
        pixKey: reseller.settings.pixKey || "",
        pixName: reseller.settings.pixName || "",
        pixCity: reseller.settings.pixCity || ""
      });
      setLogoPreview(reseller.settings.logo || "");
      setBannerPreview(reseller.settings.banner || "");
    }
  }, [reseller]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);
    
    if (value.length > 2) {
      value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    }
    if (value.length > 10) {
      value = `${value.slice(0, 10)}-${value.slice(10)}`;
    }
    setFormData({ ...formData, whatsapp: value });
  };

  const handleInstagramChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (!value.startsWith("@") && value.length > 0) {
      value = "@" + value;
    }
    setFormData({ ...formData, instagram: value });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;

    if (!formData.storeName?.trim()) {
      setToast({ type: "error", text: "Nome da loja é obrigatório." });
      setTimeout(() => setToast(null), 5000);
      return;
    }

    setIsSubmitting(true);
    try {
      let logoUrl = logoPreview;
      let bannerUrl = bannerPreview;

      const uploadPromises = [];
      if (logoFile) {
        uploadPromises.push(
          cloudinaryService.uploadImage(logoFile).then(url => { logoUrl = url; })
        );
      }
      if (bannerFile) {
        uploadPromises.push(
          cloudinaryService.uploadImage(bannerFile).then(url => { bannerUrl = url; })
        );
      }

      if (uploadPromises.length > 0) {
        await Promise.all(uploadPromises);
      }

      const newSettings: any = {
        ...(reseller?.settings || {}),
        primaryColor: formData.primaryColor || "#2563eb",
        secondaryColor: formData.secondaryColor || "#1e40af",
        description: formData.description || "",
        whatsapp: (formData.whatsapp || "").replace(/\D/g, ""),
        instagram: formData.instagram || "",
        pixKey: formData.pixKey || "",
        pixName: formData.pixName || "",
        pixCity: formData.pixCity || "",
        logo: logoUrl || "",
        banner: bannerUrl || ""
      };

      // Remove undefined fields just to be safe with Firestore
      Object.keys(newSettings).forEach(key => {
        if (newSettings[key] === undefined) {
          delete newSettings[key];
        }
      });

      const updates: any = {
        settings: newSettings,
        updatedAt: new Date().toISOString()
      };

      if (formData.storeName !== reseller?.storeName) {
        updates.storeName = formData.storeName;
      }

      let hasStoreNameFallback = false;
      try {
        await updateDoc(doc(db, "resellers", user.uid), updates);
      } catch (err: any) {
        // Se a regra no servidor não permite atualizar o storeName
        if (err.code === 'permission-denied' && updates.storeName) {
          console.warn("Permissão negada ao atualizar storeName. Tentando sem o storeName...");
          delete updates.storeName;
          await updateDoc(doc(db, "resellers", user.uid), updates);
          hasStoreNameFallback = true;
        } else {
          throw err;
        }
      }

      if (hasStoreNameFallback) {
        setToast({ type: "success", text: "Opções salvas, mas Nome da Loja bloqueado (regras desatualizadas)." });
      } else {
        setToast({ type: "success", text: "Configurações salvas com sucesso!" });
      }
      setTimeout(() => setToast(null), 5000);
    } catch (error: any) {
      console.error("[StoreSettings] Código:", error?.code);
      console.error("[StoreSettings] Mensagem:", error?.message);
      console.error("[StoreSettings] Objeto completo:", JSON.stringify(error));

      let msg = "Erro ao salvar configurações.";
      if (error?.code === 'permission-denied') {
        msg = "Permissão negada (Regras do Firestore). Ocorreu um erro ao salvar as configurações. Suas regras do Firestore (`firestore.rules`) parecem estar desatualizadas. Por favor, faça o deploy das novas regras usando `firebase deploy --only firestore:rules`.";
      } else if (error?.code === 'storage/unauthorized') {
        msg = "Sem permissão para fazer upload de imagens.";
      } else if (error?.message) {
        msg = error.message;
      }

      setToast({ type: "error", text: msg });
      setTimeout(() => setToast(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div>Carregando...</div>;

  const getStoreUrl = (slug: string | undefined, customDomain?: string, customDomainStatus?: string): string => {
    if (!slug) return "";
    // Se tem domínio customizado ativo, usar ele
    if (customDomain && customDomainStatus === "active") {
      return `https://${customDomain}`;
    }
    // URL base do app — usar variável de ambiente ou fallback
    const appBaseUrl = import.meta.env.VITE_APP_URL || "https://mostrua.com.br";
    return `${appBaseUrl}/store/${slug}`;
  };

  const storeUrl = getStoreUrl(
    reseller?.slug,
    reseller?.customDomain,
    reseller?.customDomainStatus
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(storeUrl);
    setToast({ type: "success", text: "Link copiado para a área de transferência!" });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Minha Loja</h1>
        <p className="text-gray-500">Personalize a aparência e informações da sua loja.</p>
      </div>

      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-full text-white text-sm font-medium shadow-xl transition-all duration-300 transform translate-y-0 opacity-100 ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {toast.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl border border-gray-200 space-y-6">
            
            {/* Imagens */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900">Imagens</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
                  <div 
                    onClick={() => logoInputRef.current?.click()}
                    className="aspect-square w-32 border-2 border-dashed border-gray-300 rounded-2xl overflow-hidden cursor-pointer hover:border-blue-500 bg-gray-50 flex items-center justify-center relative"
                  >
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-2" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <input type="file" ref={logoInputRef} onChange={handleLogoChange} accept="image/*" className="hidden" />
                  <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Recomendado: 400×400px, PNG ou JPG, máx. 1MB
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Banner</label>
                  <div 
                    onClick={() => bannerInputRef.current?.click()}
                    className="aspect-video w-full border-2 border-dashed border-gray-300 rounded-2xl overflow-hidden cursor-pointer hover:border-blue-500 bg-gray-50 flex items-center justify-center relative"
                  >
                    {bannerPreview ? (
                      <img src={bannerPreview} alt="Banner" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <input type="file" ref={bannerInputRef} onChange={handleBannerChange} accept="image/*" className="hidden" />
                  <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Recomendado: 1200×400px (proporção 3:1), máx. 2MB
                  </p>
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Cores */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900">Cores da Marca</h3>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">Cor da sua loja</label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[
                    { name: "Azul Clássico", primary: "#2563eb" },
                    { name: "Verde Fresco", primary: "#16a34a" },
                    { name: "Rosa Feminino", primary: "#db2777" },
                    { name: "Laranja Vibrante", primary: "#ea580c" },
                    { name: "Roxo Elegante", primary: "#7c3aed" },
                    { name: "Preto Premium", primary: "#111827" },
                    { name: "Vermelho Forte", primary: "#dc2626" },
                    { name: "Teal Moderno", primary: "#0d9488" },
                  ].map(palette => (
                    <button
                      key={palette.primary}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, primaryColor: palette.primary }))}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all ${
                        formData.primaryColor === palette.primary 
                          ? 'border-gray-900 bg-gray-50' 
                          : 'border-transparent hover:border-gray-200'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full shadow-sm" style={{ backgroundColor: palette.primary }} />
                      <span className="text-[10px] text-gray-600 text-center leading-tight">{palette.name}</span>
                    </button>
                  ))}
                </div>
                
                {/* Opção customizada */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <label className="text-xs text-gray-600 font-medium">Personalizar:</label>
                  <input
                    type="color"
                    value={formData.primaryColor}
                    onChange={e => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                    className="w-8 h-8 rounded cursor-pointer border border-gray-200 p-0"
                  />
                  <span className="text-xs text-gray-500 font-mono">{formData.primaryColor}</span>
                </div>

                {/* Cor Secundária */}
                <div className="mt-4">
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Cor secundária
                    <span className="ml-2 text-xs font-normal text-gray-400">
                      Usada em fundos, badges e destaques
                    </span>
                  </label>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <label className="text-xs text-gray-600 font-medium">Cor:</label>
                    <input
                      type="color"
                      value={formData.secondaryColor}
                      onChange={e => setFormData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      className="w-8 h-8 rounded cursor-pointer border border-gray-200 p-0"
                    />
                    <span className="text-xs text-gray-500 font-mono">{formData.secondaryColor}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const hex = formData.primaryColor.replace('#', '');
                        const r = parseInt(hex.slice(0, 2), 16);
                        const g = parseInt(hex.slice(2, 4), 16);
                        const b = parseInt(hex.slice(4, 6), 16);
                        const lighten = (c: number) => Math.min(255, Math.floor(c + (255 - c) * 0.4));
                        const toHex = (c: number) => c.toString(16).padStart(2, '0');
                        const secondary = `#${toHex(lighten(r))}${toHex(lighten(g))}${toHex(lighten(b))}`;
                        setFormData(prev => ({ ...prev, secondaryColor: secondary }));
                      }}
                      className="ml-auto text-xs text-blue-600 font-medium hover:text-blue-700 transition-colors"
                    >
                      Gerar automaticamente ✨
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 ml-1">
                    Dica: clique em "Gerar automaticamente" para criar uma versão harmoniosa da cor principal.
                  </p>
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Informações */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900">Informações</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Loja <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.storeName}
                  onChange={e => setFormData({ ...formData, storeName: e.target.value })}
                  maxLength={50}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Ex: Moda da Ana, Loja do João..."
                />
                <p className="text-xs text-gray-400 mt-1">
                  Este é o nome que aparece na sua loja e no painel.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição da Loja</label>
                <textarea 
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  placeholder="Conte um pouco sobre sua loja..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                  <div className="relative">
                    <MessageCircle className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="tel" 
                      value={formData.whatsapp}
                      onChange={handlePhoneChange}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
                  <div className="relative">
                    <AtSign className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text" 
                      value={formData.instagram}
                      onChange={handleInstagramChange}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="@sualoja"
                    />
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Pagamento Pix */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900">Recebimento via Pix</h3>
              <p className="text-sm text-gray-500">Configure sua chave Pix para gerar QR Codes automáticos no checkout.</p>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chave Pix</label>
                <input 
                  type="text" 
                  value={formData.pixKey}
                  onChange={e => setFormData({...formData, pixKey: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Seu CPF, CNPJ, email, telefone ou chave aleatória"
                />
                <p className="text-xs text-gray-500 mt-1">Sua chave PIX para facilitar o pagamento dos clientes</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Recebedor</label>
                  <input 
                    type="text" 
                    value={formData.pixName}
                    onChange={e => setFormData({...formData, pixName: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Como aparece no seu banco"
                    maxLength={25}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                  <input 
                    type="text" 
                    value={formData.pixCity}
                    onChange={e => setFormData({...formData, pixCity: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Sua cidade"
                    maxLength={15}
                  />
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Configurações de URL */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900">Endereço da Loja (Link)</h3>
              <p className="text-sm text-gray-500">Este é o link que você compartilha no Instagram e WhatsApp.</p>
              
              <div>
                <div className="flex items-center">
                  <span className="text-gray-500 bg-gray-50 border border-r-0 border-gray-200 rounded-l-xl px-3 py-3 text-sm truncate max-w-[200px] sm:max-w-none">
                    {(import.meta.env.VITE_APP_URL || window.location.origin).replace(/^https?:\/\//, '')}/store/
                  </span>
                  <input 
                    type="text" 
                    value={reseller?.slug || ''}
                    disabled
                    className="w-full pl-3 pr-4 py-3 rounded-r-xl border border-gray-200 bg-gray-50 focus:outline-none text-gray-500 cursor-not-allowed"
                    title="Para alterar seu link, entre em contato com o suporte."
                    placeholder="seudominio"
                  />
                </div>
                <p className="text-xs text-orange-500 mt-2 font-medium">
                  Nota: Alterar o endereço base da loja pode quebrar links de produtos compartilhados anteriormente por você com seus clientes. Para segurança, a alteração self-service customizada está sendo limitada temporariamente.
                </p>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button 
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Salvar Configurações
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Divulgação e Compartilhamento */}
          <div className="space-y-6 mt-8">
            {/* Compartilhe sua loja */}
            <div className="bg-blue-50 rounded-3xl border border-blue-100 p-6">
              <h3 className="font-bold text-gray-900 mb-1">Link da sua loja</h3>
              <p className="text-sm text-gray-500 mb-4">Compartilhe esse link para que seus clientes possam comprar.</p>
              <div className="flex gap-2">
                <div className="flex-1 bg-white rounded-xl px-4 py-3 border border-blue-100 text-sm font-medium truncate flex items-center">
                  {storeUrl ? (
                    <span className="text-gray-700">{storeUrl}</span>
                  ) : (
                    <span className="text-gray-400 italic">Sua loja ainda não possui um link ativo (Verifique o slug)</span>
                  )}
                </div>
                <button onClick={handleCopy} disabled={!storeUrl} className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Share2 className="w-6 h-6 text-gray-400" /> Kit de Divulgação
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <QRCodeGenerator 
                  storeUrl={storeUrl} 
                  primaryColor={formData.primaryColor} 
                  storeName={reseller?.storeName || 'Minha Loja'} 
                />
                {reseller?.id && reseller?.slug && (
                  <CatalogExporter 
                    resellerId={reseller.id}
                    storeName={reseller.storeName || 'Minha Loja'}
                    slug={reseller.slug}
                    logo={logoPreview}
                    banner={bannerPreview}
                    whatsapp={formData.whatsapp}
                    primaryColor={formData.primaryColor}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-6 h-fit">
            <div className="bg-white rounded-3xl border border-gray-200 p-4 overflow-hidden">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Preview da sua loja</p>
              
              {/* Mini mockup do header da loja */}
              <div className="rounded-2xl overflow-hidden border border-gray-100">
                {/* Header simulado */}
                <div className="p-4 flex items-center gap-3" style={{ backgroundColor: formData.primaryColor + '15' }}>
                  {logoPreview ? (
                    <img src={logoPreview} className="w-10 h-10 rounded-xl object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: formData.primaryColor }}>
                      {reseller?.storeName?.[0]?.toUpperCase() || 'L'}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{reseller?.storeName || 'Minha Loja'}</p>
                    {formData.description && <p className="text-xs text-gray-500 line-clamp-1">{formData.description}</p>}
                  </div>
                </div>
                
                {/* Banner simulado */}
                {bannerPreview ? (
                  <div className="aspect-[3/1] overflow-hidden">
                    <img src={bannerPreview} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="aspect-[3/1] flex items-center justify-center text-xs text-gray-400 bg-gray-50">
                    Sem banner
                  </div>
                )}
                
                {/* Botão de compra simulado */}
                <div className="p-3 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-gray-400">Exemplo de produto</p>
                  </div>
                  <button
                    className="w-full py-2 rounded-xl text-white text-xs font-bold transition-all"
                    style={{ backgroundColor: formData.primaryColor }}
                  >
                    Adicionar ao carrinho
                  </button>
                </div>
              </div>
              
              {/* Cor atual */}
              <div className="mt-3 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: formData.primaryColor }} />
                  <p className="text-xs text-gray-500">Cor principal: {formData.primaryColor}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: formData.secondaryColor }} />
                  <p className="text-xs text-gray-500">Cor secundária: {formData.secondaryColor}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
