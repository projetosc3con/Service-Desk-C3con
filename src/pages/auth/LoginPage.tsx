import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { AlertCircle, ArrowLeft, LogIn } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/app/fila';

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/app/fila', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      navigate(from, { replace: true });
    } catch (err: any) {
      console.error('Erro de autenticação:', err);
      setErrorMsg(err.message || 'Falha ao autenticar. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url('/background-wallpaper.jpeg')` }}
    >
      {/* Dark backdrop overlay for contrast & focus */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px] pointer-events-none" />

      <div className="relative z-10">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div className="inline-flex p-3 bg-white backdrop-blur rounded-2xl border border-white/10 mb-4 shadow-lg">
            <img
              src="/LOGO-A.png"
              alt="C3con Soluções em Software"
              className="h-16 w-auto object-contain mx-auto"
            />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Acesso da Equipe C3con
          </h2>
          <p className="mt-1 text-xs text-slate-300">
            Painel restrito a colaboradores autorizados
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-slate-100">
            {errorMsg && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <Input
                label="E-mail Corporativo"
                type="email"
                placeholder="seu.email@exemplo.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Input
                label="Senha"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full font-semibold shadow-md mt-2"
                isLoading={loading}
                rightIcon={<LogIn className="w-4 h-4" />}
              >
                Entrar no Service Desk
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col items-center gap-3">
              <Link
                to="/"
                className="text-xs text-slate-400 hover:text-slate-600 inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Voltar à tela inicial
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
