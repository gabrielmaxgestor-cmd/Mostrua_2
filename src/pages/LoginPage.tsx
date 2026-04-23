import React, { useState } from "react";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "../firebase";
import { useNavigate, Link } from "react-router-dom";
import { Store, AlertCircle, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuthRole = async (user: any) => {
    try {
      // Force refresh to get latest claims
      const tokenResult = await user.getIdTokenResult(true);
      let role = null;
      if (tokenResult.claims.admin) {
         role = "admin";
      } else {
         const snap = await getDoc(doc(db, "users", user.uid));
         role = snap.data()?.role;
      }
      
      if (role === "admin") navigate("/admin");
      else if (role === "reseller") navigate("/dashboard");
      else navigate("/");
    } catch (firestoreErr: any) {
      console.error("Erro ao buscar dados do usuário no Firestore:", firestoreErr);
      navigate("/");
    }
  };

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await handleAuthRole(cred.user);
    } catch (err: any) {
      console.error("Erro no login:", err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError("Email ou senha inválidos. Verifique e tente novamente.");
      } else if (err.code === 'auth/operation-not-allowed') {
        setError("O login por Email/Senha não está ativado no Firebase Console.");
      } else {
        setError("Erro ao fazer login: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setLoading(true);
    setError("");
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      
      // Se não existir na coleção de usuários, significa que é o primeiro login.
      // O correto seria ele passar pela criação de loja, mas se ele só clicou em entrar,
      // validamos de qualquer forma para ver se ele é revendedor ou redirecionamos para home/registro.
      const snap = await getDoc(doc(db, "users", cred.user.uid));
      if (!snap.exists()) {
        // Redireciona para registro caso a conta não tenha sido configurada ainda no Firestore
        navigate("/register", { state: { email: cred.user.email, name: cred.user.displayName, googleSignIn: true } });
      } else {
        await handleAuthRole(cred.user);
      }
    } catch (err: any) {
      console.error("Erro no login com Google:", err);
      setError("Erro ao fazer login com o Google.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 relative">
      <Link to="/" className="absolute top-6 left-6 sm:top-8 sm:left-8 flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors font-medium">
        <ArrowLeft className="w-5 h-5" />
        <span className="hidden sm:inline">Voltar para o início</span>
        <span className="sm:hidden">Voltar</span>
      </Link>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-10 w-full max-w-md">
        <div className="flex items-center gap-2 justify-center mb-8">
          <img src="/logo.svg" alt="Mostrua Logo" className="h-10" />
        </div>
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">Entrar na plataforma</h1>
        <p className="text-center text-gray-500 mb-8 text-sm">Acesse o seu painel de controle</p>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex justify-center items-center gap-3 py-3 px-4 border border-gray-300 rounded-xl shadow-sm bg-white text-gray-700 font-bold hover:bg-gray-50 mb-6 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continuar com o Google
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Ou entre com seu email</span>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Senha</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-blue-200 mt-2"
          >
            {loading ? "Entrando..." : "Entrar com Email"}
          </button>
        </form>
        <div className="text-center mt-4">
          <Link to="/forgot-password" className="text-sm text-gray-500 hover:text-blue-600">
            Esqueceu a senha?
          </Link>
        </div>
        <p className="text-center text-sm text-gray-500 mt-4">
          Ainda nao tem conta?{' '}
          <Link to="/register" className="text-blue-600 font-bold hover:underline">
            Criar conta gratis
          </Link>
        </p>
      </div>
    </div>
  );
}
