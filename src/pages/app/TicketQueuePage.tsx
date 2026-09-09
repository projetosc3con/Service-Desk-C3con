import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type {
  TicketWithDetails,
  Application,
  Profile,
} from '../../types/database.types';
import {
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  TYPE_CONFIG,
  formatDate,
  timeAgo,
  formatMinutesToDuration,
} from '../../lib/utils';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  Search,
  RefreshCw,
  Inbox,
} from 'lucide-react';

export const TicketQueuePage: React.FC = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<TicketWithDetails[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApp, setSelectedApp] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all');

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Load Applications
      const { data: appsData } = await supabase
        .from('applications')
        .select('*')
        .order('name');
      setApplications(appsData || []);

      // 2. Load Profiles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');
      setProfiles(profilesData || []);

      // 3. Load Tickets with relations
      const { data: ticketsData, error } = await supabase
        .from('tickets')
        .select(
          `
          *,
          application:applications(*),
          assigned_profile:profiles!tickets_assigned_to_fkey(*)
        `
        )
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets((ticketsData as any) || []);
    } catch (err) {
      console.error('Erro ao carregar fila de tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter logic
  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesProtocol = ticket.protocol.toLowerCase().includes(query);
        const matchesRequester = ticket.requester_name.toLowerCase().includes(query);
        const matchesDesc = ticket.description.toLowerCase().includes(query);
        if (!matchesProtocol && !matchesRequester && !matchesDesc) return false;
      }

      // App filter
      if (selectedApp !== 'all' && ticket.application_id !== selectedApp) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'all' && ticket.status !== selectedStatus) {
        return false;
      }

      // Priority filter
      if (selectedPriority !== 'all') {
        if (selectedPriority === 'unassigned' && ticket.priority !== null) return false;
        if (selectedPriority !== 'unassigned' && ticket.priority !== selectedPriority)
          return false;
      }

      // Assignee filter
      if (selectedAssignee !== 'all') {
        if (selectedAssignee === 'unassigned' && ticket.assigned_to !== null) return false;
        if (selectedAssignee !== 'unassigned' && ticket.assigned_to !== selectedAssignee)
          return false;
      }

      return true;
    });
  }, [tickets, searchTerm, selectedApp, selectedStatus, selectedPriority, selectedAssignee]);

  // Metrics counters
  const metrics = useMemo(() => {
    const novos = tickets.filter((t) => t.status === 'novo').length;
    const assinados = tickets.filter((t) => t.status === 'assinado').length;
    const emAndamento = tickets.filter((t) => t.status === 'em_andamento').length;
    const aguardando = tickets.filter((t) => t.status === 'aguardando_cliente').length;
    const resolvidos = tickets.filter((t) => t.status === 'resolvido' || t.status === 'fechado').length;
    return { novos, assinados, emAndamento, aguardando, resolvidos, total: tickets.length };
  }, [tickets]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Fila de Solicitações
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Centralize e realize a triagem de chamados abertos pelos clientes de todas as aplicações
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            isLoading={loading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Atualizar Fila
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Novos - Destaque de Triagem */}
        <div
          onClick={() => setSelectedStatus(selectedStatus === 'novo' ? 'all' : 'novo')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${selectedStatus === 'novo'
            ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-300'
            : 'bg-white text-slate-800 border-slate-200 hover:border-blue-400 hover:shadow-sm'
            }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${selectedStatus === 'novo' ? 'text-blue-100' : 'text-blue-600'
                }`}
            >
              Novos
            </span>
          </div>
          <div className="text-2xl font-bold mt-2">{metrics.novos}</div>
          <p
            className={`text-[11px] mt-1 ${selectedStatus === 'novo' ? 'text-blue-100' : 'text-slate-400'
              }`}
          >
            Necessitam triagem inicial
          </p>
        </div>

        {/* Assinados */}
        <div
          onClick={() => setSelectedStatus(selectedStatus === 'assinado' ? 'all' : 'assinado')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${selectedStatus === 'assinado'
            ? 'bg-purple-600 text-white border-purple-600 shadow-md ring-2 ring-purple-300'
            : 'bg-white text-slate-800 border-slate-200 hover:border-purple-300 hover:shadow-sm'
            }`}
        >
          <span
            className={`text-xs font-semibold uppercase tracking-wider ${selectedStatus === 'assinado' ? 'text-purple-100' : 'text-purple-600'
              }`}
          >
            Assinados
          </span>
          <div className="text-2xl font-bold mt-2">{metrics.assinados}</div>
          <p
            className={`text-[11px] mt-1 ${selectedStatus === 'assinado' ? 'text-purple-100' : 'text-slate-400'
              }`}
          >
            Triados e com responsável
          </p>
        </div>

        {/* Em Andamento */}
        <div
          onClick={() =>
            setSelectedStatus(selectedStatus === 'em_andamento' ? 'all' : 'em_andamento')
          }
          className={`p-4 rounded-xl border transition-all cursor-pointer ${selectedStatus === 'em_andamento'
            ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-300'
            : 'bg-white text-slate-800 border-slate-200 hover:border-amber-300 hover:shadow-sm'
            }`}
        >
          <span
            className={`text-xs font-semibold uppercase tracking-wider ${selectedStatus === 'em_andamento' ? 'text-amber-100' : 'text-amber-600'
              }`}
          >
            Em Andamento
          </span>
          <div className="text-2xl font-bold mt-2">{metrics.emAndamento}</div>
          <p
            className={`text-[11px] mt-1 ${selectedStatus === 'em_andamento' ? 'text-amber-100' : 'text-slate-400'
              }`}
          >
            Sendo trabalhados
          </p>
        </div>

        {/* Aguardando Cliente */}
        <div
          onClick={() =>
            setSelectedStatus(
              selectedStatus === 'aguardando_cliente' ? 'all' : 'aguardando_cliente'
            )
          }
          className={`p-4 rounded-xl border transition-all cursor-pointer ${selectedStatus === 'aguardando_cliente'
            ? 'bg-orange-600 text-white border-orange-600 shadow-md ring-2 ring-orange-300'
            : 'bg-white text-slate-800 border-slate-200 hover:border-orange-300 hover:shadow-sm'
            }`}
        >
          <span
            className={`text-xs font-semibold uppercase tracking-wider ${selectedStatus === 'aguardando_cliente' ? 'text-orange-100' : 'text-orange-600'
              }`}
          >
            Aguard. Cliente
          </span>
          <div className="text-2xl font-bold mt-2">{metrics.aguardando}</div>
          <p
            className={`text-[11px] mt-1 ${selectedStatus === 'aguardando_cliente' ? 'text-orange-100' : 'text-slate-400'
              }`}
          >
            Aguardando resposta
          </p>
        </div>

        {/* Resolvidos / Fechados */}
        <div
          onClick={() =>
            setSelectedStatus(selectedStatus === 'resolvido' ? 'all' : 'resolvido')
          }
          className={`p-4 rounded-xl border transition-all cursor-pointer ${selectedStatus === 'resolvido'
            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300'
            : 'bg-white text-slate-800 border-slate-200 hover:border-emerald-300 hover:shadow-sm'
            }`}
        >
          <span
            className={`text-xs font-semibold uppercase tracking-wider ${selectedStatus === 'resolvido' ? 'text-emerald-100' : 'text-emerald-600'
              }`}
          >
            Concluídos
          </span>
          <div className="text-2xl font-bold mt-2">{metrics.resolvidos}</div>
          <p
            className={`text-[11px] mt-1 ${selectedStatus === 'resolvido' ? 'text-emerald-100' : 'text-slate-400'
              }`}
          >
            Resolvidos ou fechados
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search bar */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Buscar por protocolo, solicitante ou palavras-chave..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-c3con-gold-400 focus:bg-white transition-all text-slate-800 placeholder-slate-400"
            />
          </div>

          {/* Quick Clear */}
          {(searchTerm ||
            selectedApp !== 'all' ||
            selectedStatus !== 'all' ||
            selectedPriority !== 'all' ||
            selectedAssignee !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedApp('all');
                  setSelectedStatus('all');
                  setSelectedPriority('all');
                  setSelectedAssignee('all');
                }}
                className="text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1 self-center shrink-0"
              >
                Limpar Filtros
              </button>
            )}
        </div>

        {/* Dropdown Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100 text-xs">
          {/* Aplicação */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Aplicação / Solução
            </label>
            <select
              value={selectedApp}
              onChange={(e) => setSelectedApp(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-c3con-gold-400"
            >
              <option value="all">Todas as Aplicações</option>
              {applications.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-c3con-gold-400"
            >
              <option value="all">Todos os Status</option>
              <option value="novo">Novo</option>
              <option value="assinado">Assinado</option>
              <option value="em_andamento">Em Andamento</option>
              <option value="aguardando_cliente">Aguardando Cliente</option>
              <option value="resolvido">Resolvido</option>
              <option value="fechado">Fechado</option>
            </select>
          </div>

          {/* Prioridade */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Prioridade
            </label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-c3con-gold-400"
            >
              <option value="all">Todas as Prioridades</option>
              <option value="unassigned">Sem prioridade (Pendente)</option>
              <option value="critica">Crítica</option>
              <option value="alta">Alta</option>
              <option value="media">Média</option>
              <option value="baixa">Baixa</option>
            </select>
          </div>

          {/* Responsável */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Responsável
            </label>
            <select
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-c3con-gold-400"
            >
              <option value="all">Todos os Responsáveis</option>
              <option value="unassigned">Não atribuído</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tickets Table / List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-c3con-gold-500" />
            <p className="text-sm">Carregando chamados...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-12 text-center">
            <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-700">Nenhum chamado encontrado</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Nenhuma solicitação atende aos filtros atuais ou a fila está vazia no momento.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Protocolo</th>
                  <th className="py-3 px-4">Aplicação</th>
                  <th className="py-3 px-4">Solicitante &amp; Assunto</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Prioridade</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Responsável</th>
                  <th className="py-3 px-4 text-right">Aberto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTickets.map((ticket) => {
                  const isNovo = ticket.status === 'novo';
                  const statusInfo = STATUS_CONFIG[ticket.status];
                  const priorityInfo = ticket.priority ? PRIORITY_CONFIG[ticket.priority] : null;
                  const typeInfo = ticket.type ? TYPE_CONFIG[ticket.type] : null;

                  return (
                    <tr
                      key={ticket.id}
                      onClick={() => navigate(`/app/chamados/${ticket.id}`)}
                      className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${isNovo ? 'bg-blue-50/30' : ''
                        }`}
                    >
                      {/* Protocolo */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {isNovo && (
                            <span
                              title="Novo chamado aguardando triagem"
                              className="w-2 h-2 rounded-full bg-blue-500 animate-pulse-subtle shrink-0"
                            />
                          )}
                          <span className="font-mono font-bold text-slate-900 text-xs hover:text-c3con-gold-600 transition-colors">
                            {ticket.protocol}
                          </span>
                        </div>
                      </td>

                      {/* Aplicação */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200/60">
                          {ticket.application?.name || 'Aplicação'}
                        </span>
                      </td>

                      {/* Solicitante & Assunto */}
                      <td className="py-3.5 px-4 max-w-xs sm:max-w-sm">
                        <div className="font-semibold text-slate-900 text-xs">
                          {ticket.requester_name}
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {ticket.description}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Badge
                          dot
                          dotColor={statusInfo.dot}
                          className={`${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
                        >
                          {statusInfo.label}
                        </Badge>
                      </td>

                      {/* Prioridade */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {priorityInfo ? (
                          <Badge
                            className={`${priorityInfo.bg} ${priorityInfo.text} ${priorityInfo.border}`}
                          >
                            {priorityInfo.label}
                          </Badge>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Pendente</span>
                        )}
                      </td>

                      {/* Tipo */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {typeInfo ? (
                          <Badge
                            className={`${typeInfo.bg} ${typeInfo.text} ${typeInfo.border}`}
                          >
                            {typeInfo.label}
                          </Badge>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Pendente</span>
                        )}
                      </td>

                      {/* Responsável */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {ticket.assigned_profile ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                              {ticket.assigned_profile.full_name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs text-slate-700 font-medium">
                              {ticket.assigned_profile.full_name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Sem atribuição
                          </span>
                        )}
                      </td>

                      {/* Aberto & Resolução */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right text-xs text-slate-400">
                        <div title={formatDate(ticket.created_at)}>
                          {timeAgo(ticket.created_at)}
                        </div>
                        {ticket.resolution_time_minutes != null && (
                          <div className="text-[10px] text-emerald-600 font-medium mt-0.5" title="Tempo total até conclusão">
                            {formatMinutesToDuration(ticket.resolution_time_minutes)}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
