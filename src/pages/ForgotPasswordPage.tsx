import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
 
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (err: any) {
      // Nao revele se o email existe ou nao (seguranca)
      setSent(true); // sempre mostra sucesso
    } finally {
      setLoading(false);
    }
  };
 
  if (sent) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Email enviado</h1>
        <p className="text-gray-500 mb-6">
          Se esse email estiver cadastrado, voce receberá um link de recuperação em instantes.
          Verifique também sua pasta de spam.
        </p>
        <Link to="/login" className="text-blue-600 font-bold hover:underline">Voltar ao login</Link>
      </div>
    </div>
  );
 
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Link to="/login" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-8">
          <ArrowLeft className="w-4 h-4" /> Voltar ao login
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Recuperar senha</h1>
        <p className="text-gray-500 mb-6">Digite seu email e enviaremos um link de recuperação.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Enviando...' : 'Enviar link de recuperação'}
          </button>
        </form>
      </div>
    </div>
  );
}
