import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Store, ChevronRight, Check, X, Loader2, Mail, Lock, User, Phone, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { generateSlug, validateSlug, isSlugAvailable } from "../utils/slug";
import { nicheService } from "../services/nicheService";
import { resellerService } from "../services/resellerService";
import { Niche } from "../types";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

export default function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [niches, setNiches] = useState<Niche[]>([]);

  const [isGoogleSignIn, setIsGoogleSignIn] = useState(false);
  const [googleUid, setGoogleUid] = useState("");

  // Step 1
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (location.state?.googleSignIn) {
      setIsGoogleSignIn(true);
      setEmail(location.state.email || "");
      setName(location.state.name || "");
      if (auth.currentUser) {
        setGoogleUid(auth.currentUser.uid);
      }
      setStep(2);
    }
  }, [location]);

  const validateEmail = (value: string) => {
    const emailRegex = /\S+@\S+\.\S+/;
    if (value && !emailRegex.test(value)) {
      setEmailError("Formato de email inválido.");
    } else {
      setEmailError("");
    }
  };

  // Step 2
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [storeName, setStoreName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);

  // Step 3
  const [nicheId, setNicheId] = useState("");

  useEffect(() => {
    nicheService.getActiveNiches().then(setNiches).catch(console.error);
  }, []);

  // Slug generation and validation
  useEffect(() => {
    if (storeName && !slug) {
      setSlug(generateSlug(storeName));
    }
  }, [storeName]);

  useEffect(() => {
    const checkSlug = async () => {
      if (!slug) {
        setSlugAvailable(null);
        return;
      }
      
      if (!validateSlug(slug)) {
        setSlugAvailable(false);
        return;
      }

      setCheckingSlug(true);
      const available = await isSlugAvailable(slug);
      setSlugAvailable(available);
      setCheckingSlug(false);
    };

    const timeoutId = setTimeout(checkSlug, 500);
    return () => clearTimeout(timeoutId);
  }, [slug]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);
    
    if (value.length > 2) {
      value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    }
    if (value.length > 10) {
      value = `${value.slice(0, 10)}-${value.slice(10)}`;
    }
    setPhone(value);
  };

  const handleNextStep = () => {
    setError("");
    if (step === 1) {
      if (!email || (!isGoogleSignIn && (!password || !confirmPassword))) {
        setError("Preencha todos os campos.");
        return;
      }
      const emailRegex = /\S+@\S+\.\S+/;
      if (!emailRegex.test(email)) {
        setError("Formato de email inválido.");
        return;
      }
      if (!isGoogleSignIn) {
        if (password.length < 8) {
          setError("A senha deve ter pelo menos 8 caracteres.");
          return;
        }
        if (password !== confirmPassword) {
          setError("As senhas não coincidem.");
          return;
        }
      }
      setStep(2);
    } else if (step === 2) {
      if (!name || !phone || !storeName || !slug) {
        setError("Preencha todos os campos.");
        return;
      }
      if (storeName.length < 3) {
        setError("O nome da loja deve ter pelo menos 3 caracteres.");
        return;
      }
      const phoneDigits = phone.replace(/\D/g, "");
      if (phoneDigits.length < 10) {
        setError("WhatsApp inválido.");
        return;
      }
      if (slugAvailable === false) {
        setError("O link escolhido não está disponível ou é inválido.");
        return;
      }
      setStep(3);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    setError("");
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const snap = await getDoc(doc(db, "users", cred.user.uid));
      if (snap.exists()) {
        const role = snap.data()?.role;
        if (role === "admin") navigate("/admin");
        else if (role === "reseller") navigate("/dashboard");
        else navigate("/");
        return;
      }
      
      setIsGoogleSignIn(true);
      setGoogleUid(cred.user.uid);
      setEmail(cred.user.email || "");
      setName(cred.user.displayName || "");
      setStep(2);
    } catch (err: any) {
      console.error("Erro no cadastro com Google:", err);
      setError("Erro ao autenticar com Google.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!nicheId) {
      setError("Selecione um nicho para sua loja.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let result;
      if (isGoogleSignIn && googleUid) {
        result = await resellerService.createResellerProfile({
          uid: googleUid,
          name,
          email,
          phone,
          storeName,
          slug,
          nicheId
        });
      } else {
        result = await resellerService.registerReseller({
          name,
          email,
          password,
          phone,
          storeName,
          slug,
          nicheId
        });
      }

      if (result.success) {
        navigate("/reseller/welcome", { state: { slug: result.slug } });
      }
    } catch (err: any) {
      setError(err.message || "Erro ao criar conta. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      <Link to="/" className="absolute top-6 left-6 sm:top-8 sm:left-8 flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors font-medium">
        <ArrowLeft className="w-5 h-5" />
        <span className="hidden sm:inline">Voltar para o início</span>
        <span className="sm:hidden">Voltar</span>
      </Link>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <img src="/logo.svg" alt="Mostrua Logo" className="h-12" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Crie sua loja grátis
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Ja tem conta?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Entrar
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 text-center">
          <p className="text-green-800 font-bold">Teste gratis por 7 dias</p>
          <p className="text-green-600 text-sm">Sem cartao de credito. Cancele quando quiser.</p>
        </div>
        <div className="bg-white py-8 px-4 shadow-xl shadow-gray-200/50 sm:rounded-2xl sm:px-10 border border-gray-100">
          
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 rounded-full -z-10"></div>
              <div 
                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 rounded-full -z-10 transition-all duration-500"
                style={{ width: `${((step - 1) / 2) * 100}%` }}
              ></div>
              
              {[1, 2, 3].map((i) => (
                <div 
                  key={i} 
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                    step >= i ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'bg-white text-gray-400 border-2 border-gray-200'
                  }`}
                >
                  {step > i ? <Check className="w-4 h-4" /> : i}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs font-medium text-gray-500">
              <span>Conta</span>
              <span>Loja</span>
              <span>Nicho</span>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <button
                  onClick={handleGoogleSignup}
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-3 py-3 px-4 border border-gray-300 rounded-xl shadow-sm bg-white text-gray-700 font-bold hover:bg-gray-50 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Continuar com o Google
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Ou crie com seu email</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="relative">
                    <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        validateEmail(e.target.value);
                      }}
                      className={`w-full pl-10 pr-4 py-3 rounded-xl border focus:ring-2 outline-none transition-all ${
                        emailError ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'
                      }`}
                      placeholder="seu@email.com"
                    />
                    {emailError && <p className="text-xs text-red-500 mt-1">{emailError}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      placeholder="Mínimo 8 caracteres"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Senha</label>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      placeholder="Confirme sua senha"
                    />
                  </div>
                </div>

                <button
                  onClick={handleNextStep}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors mt-6"
                >
                  Continuar <ChevronRight className="w-4 h-4 ml-2" />
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                  <div className="relative">
                    <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      placeholder="João da Silva"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                  <div className="relative">
                    <Phone className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={handlePhoneChange}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Loja</label>
                  <div className="relative">
                    <Store className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      placeholder="Minha Loja Inc"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Link da Loja</label>
                  <div className="flex items-center">
                    <span className="text-gray-500 bg-gray-50 border border-r-0 border-gray-200 rounded-l-xl px-3 py-3 text-sm">
                      {window.location.host}/
                    </span>
                    <div className="relative flex-1">
                      <input
                        type="text"
                        required
                        value={slug}
                        onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        className={`w-full pr-10 pl-3 py-3 rounded-r-xl border focus:outline-none transition-all ${
                          slugAvailable === true ? 'border-green-500 focus:ring-1 focus:ring-green-500' :
                          slugAvailable === false ? 'border-red-500 focus:ring-1 focus:ring-red-500' :
                          'border-gray-200 focus:ring-1 focus:ring-blue-500'
                        }`}
                        placeholder="minha-loja"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {checkingSlug ? (
                          <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                        ) : slugAvailable === true ? (
                          <Check className="w-5 h-5 text-green-500" />
                        ) : slugAvailable === false ? (
                          <X className="w-5 h-5 text-red-500" />
                        ) : null}
                      </div>
                    </div>
                  </div>
                  {slugAvailable === false && slug.length > 0 && (
                    <p className="mt-1 text-xs text-red-500">Este link não está disponível ou é inválido.</p>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      if (isGoogleSignIn) {
                        setIsGoogleSignIn(false);
                        auth.signOut();
                      }
                      setStep(1);
                    }}
                    className="flex-1 py-3 px-4 border border-gray-200 rounded-xl shadow-sm text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={handleNextStep}
                    className="flex-1 flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    Continuar <ChevronRight className="w-4 h-4 ml-2" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <p className="text-sm text-gray-600 text-center mb-4">
                  Escolha o nicho principal da sua loja. Isso definirá os catálogos e produtos iniciais.
                </p>

                <div className="grid grid-cols-2 gap-4 max-h-64 overflow-y-auto custom-scrollbar p-1">
                  {niches.map((niche) => (
                    <div
                      key={niche.id}
                      onClick={() => setNicheId(niche.id)}
                      className={`cursor-pointer rounded-xl border-2 overflow-hidden transition-all ${
                        nicheId === niche.id ? 'border-blue-600 ring-2 ring-blue-600/20 shadow-md' : 'border-transparent hover:border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="aspect-video relative">
                        <img src={niche.imageUrl} alt={niche.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        {nicheId === niche.id && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-sm">
                            <Check className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="p-3 text-center">
                        <p className="font-bold text-gray-900 text-sm">{niche.name}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 py-3 px-4 border border-gray-200 rounded-xl shadow-sm text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading || !nicheId}
                    className="flex-[2] flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Criar minha loja"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function AlertCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
