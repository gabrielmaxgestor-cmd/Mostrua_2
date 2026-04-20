import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useNavigate, Link } from "react-router-dom";
import { Store, AlertCircle, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      
      // Check role
      try {
        // Force refresh to get latest claims
        const tokenResult = await cred.user.getIdTokenResult(true);
        let role = null;
        if (tokenResult.claims.admin) {
           role = "admin";
        } else {
           const snap = await getDoc(doc(db, "users", cred.user.uid));
           role = snap.data()?.role;
        }
        
        if (role === "admin") navigate("/admin");
        else if (role === "reseller") navigate("/dashboard");
        else navigate("/");
      } catch (firestoreErr: any) {
        console.error("Erro ao buscar dados do usuário no Firestore:", firestoreErr);
        // If Firestore fails but auth succeeded, fallback to home
        navigate("/");
      }
      
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
        <p className="text-center text-gray-500 mb-8 text-sm">Acesse seu painel de revendedor ou administrador</p>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

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
            {loading ? "Entrando..." : "Entrar"}
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
