import React, { useState, useEffect, useRef } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import { useReseller } from "../../hooks/useReseller";
import { storageService } from "../../services/storageService";
import { Save, Image as ImageIcon, Loader2, Share2 } from "lucide-react";
import { QRCodeGenerator } from "../../components/reseller/QRCodeGenerator";
import { CatalogExporter } from "../../components/reseller/CatalogExporter";

export const StoreSettings = () => {
  const { user } = useAuth();
  const { reseller, loading } = useReseller(user?.uid);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error", text: string } | null>(null);

  const [formData, setFormData] = useState({
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

    setIsSubmitting(true);
    try {
      let logoUrl = logoPreview;
      let bannerUrl = bannerPreview;

      if (logoFile) {
        logoUrl = await storageService.uploadImage(logoFile, `resellers/${user.uid}/logo`);
      }
      if (bannerFile) {
        bannerUrl = await storageService.uploadImage(bannerFile, `resellers/${user.uid}/banner`);
      }

      await updateDoc(doc(db, "resellers", user.uid), {
        "settings.primaryColor": formData.primaryColor,
        "settings.secondaryColor": formData.secondaryColor,
        "settings.description": formData.description,
        "settings.whatsapp": formData.whatsapp.replace(/\D/g, ""),
        "settings.instagram": formData.instagram,
        "settings.pixKey": formData.pixKey,
        "settings.pixName": formData.pixName,
        "settings.pixCity": formData.pixCity,
        "settings.logo": logoUrl,
        "settings.banner": bannerUrl
      });

      setToast({ type: "success", text: "Configurações salvas com sucesso!" });
      setTimeout(() => setToast(null), 3000);
    } catch (error: any) {
      console.error("Error saving settings:", error);
      setToast({ type: "error", text: "Erro ao salvar configurações." });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div>Carregando...</div>;

  const storeUrl = reseller?.slug ? `${window.location.origin}/${reseller.slug}` : window.location.origin;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Minha Loja</h1>
        <p className="text-gray-500">Personalize a aparência e informações da sua loja.</p>
      </div>

      {toast && (
        <div className={`p-4 rounded-xl text-white ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}>
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
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Cores */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900">Cores da Marca</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cor Primária</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="color" 
                      value={formData.primaryColor}
                      onChange={e => setFormData({...formData, primaryColor: e.target.value})}
                      className="w-12 h-12 rounded cursor-pointer border-0 p-0"
                    />
                    <input 
                      type="text" 
                      value={formData.primaryColor}
                      onChange={e => setFormData({...formData, primaryColor: e.target.value})}
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cor Secundária</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="color" 
                      value={formData.secondaryColor}
                      onChange={e => setFormData({...formData, secondaryColor: e.target.value})}
                      className="w-12 h-12 rounded cursor-pointer border-0 p-0"
                    />
                    <input 
                      type="text" 
                      value={formData.secondaryColor}
                      onChange={e => setFormData({...formData, secondaryColor: e.target.value})}
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Informações */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900">Informações</h3>
              
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
                  <input 
                    type="tel" 
                    value={formData.whatsapp}
                    onChange={handlePhoneChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
                  <input 
                    type="text" 
                    value={formData.instagram}
                    onChange={handleInstagramChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="@sualoja"
                  />
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
                  <span className="text-gray-500 bg-gray-50 border border-r-0 border-gray-200 rounded-l-xl px-3 py-3 text-sm">
                    {window.location.host}/
                  </span>
                  <input 
                    type="text" 
                    value={reseller?.slug || ''}
                    disabled
                    className="w-full pl-3 pr-4 py-3 rounded-r-xl border border-gray-200 bg-gray-50 focus:outline-none text-gray-500 cursor-not-allowed"
                    title="Para alterar seu link, entre em contato com o suporte."
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
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Salvar Configurações
              </button>
            </div>
          </form>

          {/* Divulgação */}
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Share2 className="w-6 h-6 text-gray-400" /> Divulgação
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

        {/* Preview */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Preview da Loja</h3>
            <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
              <div 
                className="h-32 bg-gray-100 relative"
                style={bannerPreview ? { backgroundImage: `url(${bannerPreview})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { backgroundColor: formData.primaryColor }}
              >
                <div className="absolute -bottom-8 left-6 w-16 h-16 rounded-xl border-4 border-white bg-white overflow-hidden shadow-sm">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-1" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-bold text-xl" style={{ backgroundColor: formData.primaryColor }}>
                      {reseller?.storeName?.charAt(0) || "L"}
                    </div>
                  )}
                </div>
              </div>
              <div className="pt-12 pb-6 px-6">
                <h4 className="font-bold text-lg text-gray-900">{reseller?.storeName || "Nome da Loja"}</h4>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{formData.description || "Descrição da sua loja aparecerá aqui."}</p>
                
                <div className="mt-6 space-y-3">
                  <div className="h-10 rounded-xl flex items-center justify-center text-white font-medium text-sm" style={{ backgroundColor: formData.primaryColor }}>
                    Botão Principal
                  </div>
                  <div className="h-10 rounded-xl flex items-center justify-center text-white font-medium text-sm" style={{ backgroundColor: formData.secondaryColor }}>
                    Botão Secundário
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
