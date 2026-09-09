import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Copy, Check, PlusCircle, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const TicketSuccessPage: React.FC = () => {
  const { protocol } = useParams<{ protocol: string }>();
  const [copied, setCopied] = useState(false);

  const handleCopyProtocol = () => {
    if (protocol) {
      navigator.clipboard.writeText(protocol);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-cover bg-center bg-no-repeat selection:bg-c3con-gold-500 selection:text-white"
      style={{ backgroundImage: `url('/background-wallpaper.jpeg')` }}
    >
      {/* Dark backdrop overlay for contrast & focus */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px] pointer-events-none" />

      <div className="relative z-10 w-full flex flex-col items-center">
        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-white rounded-2xl shadow-xl border border-white/10 mb-4">
            <img
              src="/LOGO-A.png"
              alt="C3con Soluções em Software"
              className="h-14 w-auto object-contain mx-auto"
            />
          </div>
        </div>

        <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden text-center p-8 text-slate-800">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Solicitação Registrada com Sucesso!
        </h1>
        <p className="text-sm text-slate-600 mb-6">
          Seu chamado foi recebido e já está disponível em nossa fila de atendimento para triagem da equipe técnica.
        </p>

        {/* Protocol Highlight Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-6 text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
            Número de Protocolo
          </span>
          <div className="flex items-center justify-center gap-3">
            <span className="text-2xl sm:text-3xl font-mono font-extrabold tracking-wider text-c3con-gold-600 select-all">
              {protocol || 'SD-XXXX-XXXXX'}
            </span>
            <button
              onClick={handleCopyProtocol}
              title="Copiar protocolo"
              className="p-2 text-slate-500 hover:text-c3con-gold-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              {copied ? (
                <span className="flex items-center text-xs font-semibold text-emerald-600 gap-1">
                  <Check className="w-4 h-4" /> Copiado!
                </span>
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Guarde este protocolo para futuras referências sobre o andamento do seu chamado.
          </p>
        </div>

        <div className="space-y-3">
          <Link to="/novo-chamado">
            <Button
              variant="primary"
              size="md"
              className="w-full font-semibold"
              leftIcon={<PlusCircle className="w-4 h-4" />}
            >
              Abrir Outro Chamado
            </Button>
          </Link>
          <Link to="/">
            <Button
              variant="outline"
              size="md"
              className="w-full mt-2"
            >
              Voltar à Tela Inicial
            </Button>
          </Link>
          <div className="pt-2">
            <Link
              to="/login"
              className="text-xs text-slate-500 hover:text-slate-700 inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Sou colaborador da C3con (Acessar Painel)
            </Link>
          </div>
        </div>
      </div>

      <footer className="mt-8 text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} C3con Engenharia &amp; Soluções em Software.
      </footer>
      </div>
    </div>
  );
};
