import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { STATUS_CONFIG, formatDateShort } from '../../lib/utils';
import type { TicketStatus } from '../../types/database.types';
import { Badge } from '../../components/ui/Badge';
import { Search, PlusCircle, Clock, AlertCircle, Sparkles } from 'lucide-react';

interface SearchedTicketResult {
  protocol: string;
  status: TicketStatus;
  created_at: string;
  updated_at: string;
  application_name: string | null;
}

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchProtocol, setSearchProtocol] = useState('');
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [ticketResult, setTicketResult] = useState<SearchedTicketResult | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchProtocol.trim();
    if (!query) return;

    setSearching(true);
    setSearched(true);
    setTicketResult(null);

    try {
      const { data, error } = await supabase.rpc('get_ticket_status', {
        p_protocol: query,
      });

      if (error) throw error;

      if (data && data.length > 0) {
        setTicketResult(data[0] as SearchedTicketResult);
      } else {
        setTicketResult(null);
      }
    } catch (err) {
      console.error('Erro ao pesquisar protocolo:', err);
      setTicketResult(null);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between items-center p-6 sm:p-10 relative overflow-hidden selection:bg-c3con-gold-500 selection:text-white bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url('/background-wallpaper.jpeg')` }}
    >
      {/* Dark backdrop overlay for contrast & focus */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px] pointer-events-none" />

      {/* Subtle ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-c3con-gold-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Center Content */}
      <main className="w-full max-w-xl flex flex-col items-center text-center my-auto z-10 py-8">
        {/* Centered Logo */}
        <div className="mb-8 group">
          <div className="p-4 bg-white backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl transition-transform duration-300 group-hover:scale-105">
            <img
              src="/LOGO-A.png"
              alt="C3con Soluções em Software"
              className="h-28 sm:h-32 w-auto object-contain mx-auto drop-shadow-md"
            />
          </div>
        </div>

        {/* Minimalist Subtitle */}
        <p className="text-sm sm:text-base text-slate-400 max-w-md mx-auto mb-8 font-light tracking-wide">
          Central Integrada de Suporte e Atendimento às Soluções C3con
        </p>

        {/* Search Input for Existing Ticket */}
        <form onSubmit={handleSearch} className="w-full mb-6">
          <div className="relative group">
            <input
              type="text"
              placeholder="Pesquisar solicitação cadastrada"
              value={searchProtocol}
              onChange={(e) => setSearchProtocol(e.target.value)}
              className="w-full pl-12 pr-28 py-3.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl text-sm text-slate-100 placeholder-slate-500 shadow-inner focus:outline-none focus:ring-2 focus:ring-c3con-gold-400/80 focus:border-c3con-gold-400/50 transition-all font-mono tracking-wide"
            />
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-c3con-gold-400 transition-colors">
              <Search className="w-5 h-5" />
            </div>
            <div className="absolute inset-y-0 right-1.5 flex items-center">
              <button
                type="submit"
                disabled={searching || !searchProtocol.trim()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed border border-slate-700 hover:border-slate-600"
              >
                {searching ? 'Buscando...' : 'Consultar'}
              </button>
            </div>
          </div>
        </form>

        {/* Search Results Display */}
        {searched && (
          <div className="w-full mb-8 animate-in fade-in zoom-in-95 duration-200">
            {ticketResult ? (
              <div className="p-5 bg-slate-900/80 border border-c3con-gold-500/30 rounded-2xl text-left shadow-lg backdrop-blur-sm">
                <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-c3con-gold-400 tracking-wider">
                      {ticketResult.protocol}
                    </span>
                    {ticketResult.application_name && (
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                        {ticketResult.application_name}
                      </span>
                    )}
                  </div>
                  {(() => {
                    const statusInfo = STATUS_CONFIG[ticketResult.status];
                    return (
                      <Badge
                        dot
                        dotColor={statusInfo.dot}
                        className={`${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
                      >
                        {statusInfo.label}
                      </Badge>
                    );
                  })()}
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Aberto em: {formatDateShort(ticketResult.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-end">
                    <Sparkles className="w-3.5 h-3.5 text-c3con-gold-500/70" />
                    <span>Última atualização: {formatDateShort(ticketResult.updated_at)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl text-xs text-slate-400 flex items-center justify-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-400/80 shrink-0" />
                <span>
                  Nenhum chamado encontrado com o protocolo informado. Verifique os dados digitados.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Divider / Spacer */}
        <div className="w-16 h-px bg-slate-800/80 my-2" />

        {/* CTA to Open New Ticket */}
        <div className="w-full mt-4">
          <button
            type="button"
            onClick={() => navigate('/novo-chamado')}
            className="w-full py-4 px-6 bg-gradient-to-r from-c3con-gold-500 to-c3con-gold-600 hover:from-c3con-gold-400 hover:to-c3con-gold-500 text-slate-950 font-bold text-sm sm:text-base rounded-2xl shadow-lg shadow-c3con-gold-500/10 hover:shadow-c3con-gold-500/20 active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2.5 group"
          >
            <PlusCircle className="w-5 h-5 text-slate-950 group-hover:rotate-90 transition-transform duration-300" />
            <span>Abrir Nova Solicitação</span>
          </button>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="w-full max-w-4xl text-center text-xs text-slate-600 z-10 pt-4">
        &copy; {new Date().getFullYear()} <Link
          to="/login"
          className="text-xs hover:text-c3con-gold-400 font-medium transition-colors inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg hover:bg-white/5"
        > C3con Engenharia  &amp; Soluções em Software.</Link>
      </footer>
    </div>
  );
};
