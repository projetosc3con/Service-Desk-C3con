import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { Application } from '../../types/database.types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Send, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

export const PublicTicketPage: React.FC = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);

  // Form states
  const [applicationId, setApplicationId] = useState('');
  const [requesterName, setRequesterName] = useState('');
  const [requesterContact, setRequesterContact] = useState('');
  const [description, setDescription] = useState('');

  // Honeypot field for anti-spam (invisible to real users)
  const [honeypot, setHoneypot] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadApplications() {
      try {
        const { data, error } = await supabase
          .from('applications')
          .select('*')
          .eq('active', true)
          .order('name');

        if (error) throw error;
        setApplications(data || []);
        if (data && data.length > 0) {
          setApplicationId(data[0].id);
        }
      } catch (err: any) {
        console.error('Erro ao carregar aplicações:', err);
        setErrorMessage('Não foi possível carregar a lista de aplicações no momento.');
      } finally {
        setLoadingApps(false);
      }
    }

    loadApplications();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Anti-spam honeypot check
    if (honeypot) {
      console.warn('Honeypot preenchido. Requisição bloqueada.');
      setErrorMessage('Erro de validação ao enviar solicitação.');
      return;
    }

    if (!applicationId) {
      setErrorMessage('Por favor, selecione o sistema ou aplicação.');
      return;
    }

    if (!requesterName.trim()) {
      setErrorMessage('Por favor, informe seu nome.');
      return;
    }

    if (!description.trim() || description.trim().length < 10) {
      setErrorMessage('Por favor, descreva seu problema ou solicitação com mais detalhes (mínimo 10 caracteres).');
      return;
    }

    setSubmitting(true);

    try {
      // Inserção pública via RPC security definer retornando o protocolo de forma segura
      const { data: protocol, error: rpcError } = await supabase.rpc('create_public_ticket', {
        p_application_id: applicationId,
        p_requester_name: requesterName.trim(),
        p_requester_contact: requesterContact.trim() || null,
        p_description: description.trim(),
      });

      if (rpcError) {
        throw rpcError;
      }

      if (protocol) {
        navigate(`/chamado-enviado/${protocol}`);
      } else {
        navigate('/chamado-enviado/sucesso');
      }
    } catch (err: any) {
      console.error('Erro ao abrir chamado:', err);
      setErrorMessage(
        err.message || 'Ocorreu um erro ao registrar sua solicitação. Tente novamente em instantes.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-cover bg-center bg-no-repeat selection:bg-c3con-gold-500 selection:text-white"
      style={{ backgroundImage: `url('/background-wallpaper.jpeg')` }}
    >
      {/* Dark backdrop overlay for contrast & focus */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px] pointer-events-none" />

      <div className="relative z-10 w-full flex flex-col items-center">
        {/* Back to Home Navigation */}
        <div className="w-full max-w-xl mb-4 flex justify-start">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors py-1.5 px-3 rounded-lg bg-slate-900/60 hover:bg-slate-800/80 border border-white/10 backdrop-blur"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar à tela inicial</span>
          </Link>
        </div>

        {/* Brand Header */}
        <div className="text-center mb-8 max-w-lg">
          <div className="inline-flex p-3 bg-white rounded-2xl shadow-2xl border border-white/10 mb-4">
            <img
              src="/LOGO-A.png"
              alt="C3con Soluções em Software"
              className="h-16 w-auto object-contain mx-auto"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Central de Atendimento
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            Relate problemas, informe dúvidas ou envie sugestões de melhorias para nossa equipe de suporte e engenharia.
          </p>
        </div>

        {/* Main Ticket Form Card */}
        <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden text-slate-800">
        <div className="bg-gradient-to-r from-c3con-dark-900 to-c3con-dark-800 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-c3con-gold-400"></span>
            <span className="text-xs font-semibold tracking-wider uppercase text-slate-200">
              Abertura de Chamado
            </span>
          </div>
          <span className="text-xs text-c3con-gold-300 font-medium">Sem necessidade de cadastro</span>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Não foi possível enviar o chamado</p>
                <p className="text-xs text-rose-700 mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Honeypot anti-spam field (hidden) */}
          <div className="hidden" aria-hidden="true">
            <label htmlFor="website_hp">Não preencha este campo:</label>
            <input
              type="text"
              id="website_hp"
              name="website_hp"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          {/* Application Selection */}
          <div className="space-y-1.5">
            <Select
              label="Qual solução ou sistema você está utilizando?"
              required
              value={applicationId}
              onChange={(e) => setApplicationId(e.target.value)}
              disabled={loadingApps || applications.length === 0}
            >
              {loadingApps ? (
                <option value="">Carregando sistemas...</option>
              ) : applications.length === 0 ? (
                <option value="">Nenhum sistema disponível</option>
              ) : (
                applications.map((app) => (
                  <option key={app.id} value={app.id}>
                    {app.name} {app.description ? `— ${app.description}` : ''}
                  </option>
                ))
              )}
            </Select>
            <p className="text-xs text-slate-500">
              Selecione o software onde ocorreu o problema ou para o qual deseja a melhoria.
            </p>
          </div>

          {/* Requester Name */}
          <Input
            label="Seu Nome Completo"
            placeholder="Ex: João da Silva"
            required
            value={requesterName}
            onChange={(e) => setRequesterName(e.target.value)}
          />

          {/* Requester Contact */}
          <Input
            label="Seu Contato (E-mail ou Telefone/WhatsApp)"
            placeholder="Ex: joao@empresa.com ou (11) 98765-4321"
            helperText="Opcional. Usado caso nossa equipe precise de esclarecimentos adicionais."
            value={requesterContact}
            onChange={(e) => setRequesterContact(e.target.value)}
          />

          {/* Description */}
          <div className="space-y-1.5">
            <label htmlFor="ticket-description" className="block text-xs font-semibold text-slate-700">
              Descrição do Problema ou Sugestão <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="ticket-description"
              rows={5}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva detalhadamente o que aconteceu, passos para reproduzir ou o que gostaria de sugerir..."
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-c3con-gold-400 focus:border-transparent transition-colors resize-y min-h-[120px]"
            />
            <p className="text-xs text-slate-400">
              Quanto mais detalhes nos fornecer (telas envolvidas, dados digitados), mais rápido poderemos resolver.
            </p>
          </div>

          {/* Submit button */}
          <div className="pt-2">
            <Button
              type="submit"
              size="lg"
              variant="primary"
              className="w-full shadow-md font-semibold tracking-wide"
              isLoading={submitting}
              rightIcon={<Send className="w-4 h-4" />}
            >
              {submitting ? 'Registrando chamado...' : 'Enviar Solicitação de Suporte'}
            </Button>
          </div>
        </form>

        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Protocolo gerado automaticamente
          </span>
          <a
            href="/login"
            className="text-c3con-gold-700 font-medium hover:underline hover:text-c3con-gold-800"
          >
            Acesso da Equipe &rarr;
          </a>
        </div>
      </div>

      {/* Footer info */}
      <footer className="mt-8 text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} C3con Engenharia &amp; Soluções em Software. Todos os direitos reservados.
      </footer>
      </div>
    </div>
  );
};
