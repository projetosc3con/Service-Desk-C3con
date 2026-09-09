import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type {
  TicketWithDetails,
  TicketComment,
  TicketStatusHistory,
  Profile,
  TicketStatus,
  TicketPriority,
  TicketType,
} from '../../types/database.types';
import {
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  formatDate,
  timeAgo,
  formatMinutesToDuration,
} from '../../lib/utils';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import {
  ArrowLeft,
  Clock,
  MessageSquare,
  History,
  Send,
  Kanban,
  CheckCircle2,
  AlertCircle,
  Shield,
  Layers,
  Edit2,
  Lock,
  Save,
  X,
} from 'lucide-react';

export const TicketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [ticket, setTicket] = useState<TicketWithDetails | null>(null);
  const [comments, setComments] = useState<(TicketComment & { author?: Profile })[]>([]);
  const [history, setHistory] = useState<(TicketStatusHistory & { changer?: Profile })[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  // Admin editable requester info states
  const [isEditingRequester, setIsEditingRequester] = useState(false);
  const [editRequesterName, setEditRequesterName] = useState('');
  const [editRequesterContact, setEditRequesterContact] = useState('');
  const [savingRequester, setSavingRequester] = useState(false);

  // Form states for triage & update
  const [status, setStatus] = useState<TicketStatus>('novo');
  const [priority, setPriority] = useState<string>('');
  const [type, setType] = useState<string>('');
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [savingTriage, setSavingTriage] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Comment state
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Add to Kanban modal state
  const [kanbanModalOpen, setKanbanModalOpen] = useState(false);
  const [kanbanColumns, setKanbanColumns] = useState<any[]>([]);
  const [selectedColumnId, setSelectedColumnId] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [savingTask, setSavingTask] = useState(false);

  const loadTicketData = async () => {
    if (!id) return;
    setLoading(true);

    try {
      // 1. Fetch Ticket
      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .select(
          `
          *,
          application:applications(*),
          assigned_profile:profiles!tickets_assigned_to_fkey(*)
        `
        )
        .eq('id', id)
        .single();

      if (ticketError) throw ticketError;
      setTicket(ticketData as any);

      setStatus(ticketData.status);
      setPriority(ticketData.priority || '');
      setType(ticketData.type || '');
      setAssignedTo(ticketData.assigned_to || '');
      setTaskTitle(`Atender ${ticketData.protocol}: ${ticketData.requester_name}`);

      setEditRequesterName(ticketData.requester_name || '');
      setEditRequesterContact(ticketData.requester_contact || '');

      // 2. Fetch Profiles for assignment
      const { data: profData } = await supabase
        .from('profiles')
        .select('*')
        .eq('active', true)
        .order('full_name');
      setProfiles(profData || []);

      // 3. Fetch Comments
      const { data: commentData } = await supabase
        .from('ticket_comments')
        .select(`*, author:profiles!ticket_comments_author_id_fkey(*)`)
        .eq('ticket_id', id)
        .order('created_at', { ascending: true });
      setComments((commentData as any) || []);

      // 4. Fetch Status History
      const { data: historyData } = await supabase
        .from('ticket_status_history')
        .select(`*, changer:profiles!ticket_status_history_changed_by_fkey(*)`)
        .eq('ticket_id', id)
        .order('changed_at', { ascending: false });
      setHistory((historyData as any) || []);

      // 5. Fetch user's kanban columns for quick task creation
      if (user) {
        const { data: cols } = await supabase
          .from('kanban_columns')
          .select('*')
          .eq('owner_id', user.id)
          .order('position');
        setKanbanColumns(cols || []);
        if (cols && cols.length > 0) {
          setSelectedColumnId(cols[0].id);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar dados do ticket:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTicketData();
  }, [id, user]);

  // Handle saving requester info (Admin only)
  const handleSaveRequesterInfo = async () => {
    if (!ticket || !editRequesterName.trim()) return;
    setSavingRequester(true);
    setSuccessNotice(null);

    try {
      const { error } = await supabase
        .from('tickets')
        .update({
          requester_name: editRequesterName.trim(),
          requester_contact: editRequesterContact.trim() || null,
        })
        .eq('id', ticket.id);

      if (error) throw error;

      setSuccessNotice('Dados do solicitante atualizados com sucesso pelo Administrador!');
      setIsEditingRequester(false);
      setTimeout(() => setSuccessNotice(null), 3000);
      await loadTicketData();
    } catch (err: any) {
      alert(`Erro ao atualizar solicitante: ${err.message}`);
    } finally {
      setSavingRequester(false);
    }
  };

  // Handle saving triage changes
  const handleSaveTriage = async () => {
    if (!ticket) return;
    setSavingTriage(true);
    setSuccessNotice(null);

    try {
      // If moving out of 'novo' or assigned to an agent, automatically set to 'assinado'
      let nextStatus = status;
      if (status === 'novo' && (assignedTo || priority || type)) {
        nextStatus = 'assinado';
        setStatus('assinado');
      }

      const { error } = await supabase
        .from('tickets')
        .update({
          status: nextStatus,
          priority: (priority as TicketPriority) || null,
          type: (type as TicketType) || null,
          assigned_to: assignedTo || null,
        })
        .eq('id', ticket.id);

      if (error) throw error;

      setSuccessNotice('Dados de triagem e status atualizados com sucesso!');
      setTimeout(() => setSuccessNotice(null), 3000);
      await loadTicketData();
    } catch (err: any) {
      alert(`Erro ao salvar triagem: ${err.message}`);
    } finally {
      setSavingTriage(false);
    }
  };

  // Handle adding internal comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket || !user || !newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const { error } = await supabase.from('ticket_comments').insert({
        ticket_id: ticket.id,
        author_id: user.id,
        body: newComment.trim(),
      });

      if (error) throw error;

      setNewComment('');
      // Reload comments
      const { data: commentData } = await supabase
        .from('ticket_comments')
        .select(`*, author:profiles!ticket_comments_author_id_fkey(*)`)
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: true });
      setComments((commentData as any) || []);
    } catch (err: any) {
      alert(`Erro ao enviar comentário: ${err.message}`);
    } finally {
      setSubmittingComment(false);
    }
  };

  // Handle creating personal kanban task
  const handleCreateKanbanTask = async () => {
    if (!ticket || !user || !selectedColumnId || !taskTitle.trim()) return;

    setSavingTask(true);
    try {
      const { error } = await supabase.from('kanban_tasks').insert({
        owner_id: user.id,
        column_id: selectedColumnId,
        title: taskTitle.trim(),
        ticket_id: ticket.id,
        description: `Chamado: ${ticket.protocol}\nSolicitante: ${ticket.requester_name}\nAplicação: ${ticket.application?.name}`,
        position: 0,
      });

      if (error) throw error;

      setKanbanModalOpen(false);
      setSuccessNotice('Tarefa criada no seu Kanban pessoal!');
      setTimeout(() => setSuccessNotice(null), 3000);
    } catch (err: any) {
      alert(`Erro ao criar tarefa no Kanban: ${err.message}`);
    } finally {
      setSavingTask(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400">
        <Clock className="w-8 h-8 animate-spin mx-auto mb-2 text-c3con-gold-500" />
        <p className="text-sm">Carregando detalhes do chamado...</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800">Chamado não encontrado</h2>
        <p className="text-sm text-slate-500 mt-1 mb-4">
          O chamado solicitado não existe ou você não possui permissão para acessá-lo.
        </p>
        <Link to="/app/fila">
          <Button variant="outline" size="sm">
            Voltar para a Fila
          </Button>
        </Link>
      </div>
    );
  }

  const statusInfo = STATUS_CONFIG[ticket.status];
  const priorityInfo = ticket.priority ? PRIORITY_CONFIG[ticket.priority] : null;

  return (
    <div className="space-y-6">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/app/fila')}
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-mono font-extrabold text-slate-900">
                {ticket.protocol}
              </h1>
              <Badge
                dot
                dotColor={statusInfo.dot}
                className={`${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
              >
                {statusInfo.label}
              </Badge>
              {priorityInfo && (
                <Badge className={`${priorityInfo.bg} ${priorityInfo.text} ${priorityInfo.border}`}>
                  Prioridade: {priorityInfo.label}
                </Badge>
              )}
              {ticket.resolution_time_minutes != null && (
                <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 flex items-center gap-1 font-medium">
                  <Clock className="w-3 h-3 text-emerald-600" />
                  Concluído em: {formatMinutesToDuration(ticket.resolution_time_minutes)}
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
              <span>Aberto {timeAgo(ticket.created_at)}</span>
              <span>&bull;</span>
              <span>{formatDate(ticket.created_at)}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setKanbanModalOpen(true)}
            leftIcon={<Kanban className="w-4 h-4 text-c3con-gold-600" />}
          >
            Vincular ao Meu Kanban
          </Button>
        </div>
      </div>

      {successNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Ticket Content, Comments, History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Original Request Card */}
          <Card>
            <CardHeader className="bg-slate-50/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-c3con-gold-600" />
                <CardTitle className="text-sm">Solicitação Original do Cliente</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                  {ticket.application?.name || 'Aplicação'}
                </span>
                {isAdmin && !isEditingRequester && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingRequester(true)}
                    className="text-xs text-c3con-gold-700 hover:text-c3con-gold-900 flex items-center gap-1 py-1 px-2.5 bg-white border border-slate-200 hover:bg-slate-50 shadow-xs"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar Solicitante</span>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardBody className="space-y-4">
              {isEditingRequester ? (
                <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-amber-200/50">
                    <span className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-c3con-gold-600" />
                      Alterar Dados do Solicitante (Apenas Administrador)
                    </span>
                    <button
                      onClick={() => {
                        setEditRequesterName(ticket.requester_name);
                        setEditRequesterContact(ticket.requester_contact || '');
                        setIsEditingRequester(false);
                      }}
                      className="text-slate-400 hover:text-slate-600 p-1 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="Nome do Solicitante"
                      required
                      value={editRequesterName}
                      onChange={(e) => setEditRequesterName(e.target.value)}
                    />
                    <Input
                      label="Contato Informado"
                      placeholder="E-mail ou telefone"
                      value={editRequesterContact}
                      onChange={(e) => setEditRequesterContact(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditRequesterName(ticket.requester_name);
                        setEditRequesterContact(ticket.requester_contact || '');
                        setIsEditingRequester(false);
                      }}
                      disabled={savingRequester}
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSaveRequesterInfo}
                      isLoading={savingRequester}
                      leftIcon={<Save className="w-3.5 h-3.5" />}
                    >
                      Salvar Alterações
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4 border-b border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Nome do Solicitante:</span>
                    <span className="text-slate-800 font-semibold text-sm">
                      {ticket.requester_name}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Contato Informado:</span>
                    <span className="text-slate-800 font-medium">
                      {ticket.requester_contact || (
                        <span className="text-slate-400 italic">Não informado</span>
                      )}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Descrição do Problema / Solicitação
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded font-medium">
                    <Lock className="w-3 h-3 text-slate-400" /> Descrição original (somente leitura)
                  </span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
                  {ticket.description}
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Internal Comments Feed */}
          <Card>
            <CardHeader className="bg-slate-50/70">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-c3con-gold-600" />
                <CardTitle className="text-sm">Comentários Internos da Equipe</CardTitle>
              </div>
              <span className="text-[11px] text-slate-500">
                Exclusivo para colaboradores (não visível ao cliente)
              </span>
            </CardHeader>
            <CardBody className="space-y-5">
              {comments.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  Nenhum comentário interno registrado ainda.
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/70 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-c3con-gold-500 text-white text-[10px] font-bold flex items-center justify-center">
                            {comment.author?.full_name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <span className="font-semibold text-slate-900">
                            {comment.author?.full_name || 'Colaborador'}
                          </span>
                        </div>
                        <span className="text-slate-400" title={formatDate(comment.created_at)}>
                          {timeAgo(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap pl-7">
                        {comment.body}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add comment input */}
              <form onSubmit={handleAddComment} className="pt-2">
                <div className="space-y-2">
                  <textarea
                    rows={3}
                    placeholder="Adicionar nota técnica ou alinhamento interno sobre este chamado..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-c3con-gold-400 focus:border-transparent transition-colors resize-y"
                  />
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      size="sm"
                      variant="primary"
                      disabled={!newComment.trim()}
                      isLoading={submittingComment}
                      rightIcon={<Send className="w-3.5 h-3.5" />}
                    >
                      Publicar Comentário
                    </Button>
                  </div>
                </div>
              </form>
            </CardBody>
          </Card>

          {/* Audit History Timeline */}
          <Card>
            <CardHeader className="bg-slate-50/70">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-c3con-gold-600" />
                <CardTitle className="text-sm">Histórico de Alterações de Status (Auditoria)</CardTitle>
              </div>
            </CardHeader>
            <CardBody>
              {history.length === 0 ? (
                <div className="text-center py-4 text-slate-400 text-xs">
                  Nenhuma transição de status registrada.
                </div>
              ) : (
                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {history.map((item) => {
                    const toStatusInfo = STATUS_CONFIG[item.to_status];
                    const fromStatusInfo = item.from_status
                      ? STATUS_CONFIG[item.from_status]
                      : null;

                    return (
                      <div key={item.id} className="relative text-xs">
                        <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-c3con-gold-500 ring-4 ring-white" />
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800">
                            {item.changer?.full_name || 'Sistema'}
                          </span>
                          <span className="text-slate-400">alterou status</span>
                          {fromStatusInfo && (
                            <>
                              <Badge className={`${fromStatusInfo.bg} ${fromStatusInfo.text}`}>
                                {fromStatusInfo.label}
                              </Badge>
                              <span className="text-slate-400">&rarr;</span>
                            </>
                          )}
                          <Badge className={`${toStatusInfo.bg} ${toStatusInfo.text}`}>
                            {toStatusInfo.label}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {formatDate(item.changed_at)} ({timeAgo(item.changed_at)})
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Right 1 Col: Triage & Assignment Panel */}
        <div className="space-y-6">
          <Card className="border-c3con-gold-200/60 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-c3con-dark-900 to-c3con-dark-800 text-white">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-c3con-gold-400" />
                <CardTitle className="text-sm text-white">Painel de Triagem &amp; Gestão</CardTitle>
              </div>
            </CardHeader>
            <CardBody className="space-y-4">
              {/* Status Selector */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Status do Ticket</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TicketStatus)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-c3con-gold-400"
                >
                  <option value="novo">Novo</option>
                  <option value="assinado">Assinado</option>
                  <option value="em_andamento">Em Andamento</option>
                  <option value="aguardando_cliente">Aguardando Cliente</option>
                  <option value="resolvido">Resolvido</option>
                  <option value="fechado">Fechado</option>
                </select>
              </div>

              {/* Priority Selector */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Prioridade de Atendimento
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-c3con-gold-400"
                >
                  <option value="">-- Definir Prioridade --</option>
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                  <option value="critica">Crítica (Urgente)</option>
                </select>
              </div>

              {/* Type Selector */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Classificação / Tipo
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-c3con-gold-400"
                >
                  <option value="">-- Definir Tipo --</option>
                  <option value="correcao">Correção de Erro (Bug)</option>
                  <option value="melhoria">Melhoria / Solicitação de Recurso</option>
                </select>
              </div>

              {/* Assigned To Selector */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Colaborador Responsável
                </label>
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-c3con-gold-400"
                >
                  <option value="">-- Não Atribuído --</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} ({p.role === 'admin' ? 'Admin' : 'Agente'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Save Button */}
              <div className="pt-2">
                <Button
                  variant="primary"
                  size="md"
                  className="w-full shadow-sm font-semibold"
                  isLoading={savingTriage}
                  onClick={handleSaveTriage}
                >
                  Salvar Alterações
                </Button>
              </div>
            </CardBody>
          </Card>

          {/* Ticket Metadata Summary */}
          <Card>
            <CardHeader className="bg-slate-50/50">
              <CardTitle className="text-xs uppercase tracking-wider text-slate-500">
                Informações Técnicas
              </CardTitle>
            </CardHeader>
            <CardBody className="space-y-2.5 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Criado em:</span>
                <span className="font-medium text-slate-800">{formatDate(ticket.created_at)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Última atualização:</span>
                <span className="font-medium text-slate-800">{formatDate(ticket.updated_at)}</span>
              </div>
              {ticket.triaged_at && (
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Triado em:</span>
                  <span className="font-medium text-slate-800">
                    {formatDate(ticket.triaged_at)}
                  </span>
                </div>
              )}
              {ticket.resolved_at && (
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Resolvido em:</span>
                  <span className="font-medium text-slate-800">
                    {formatDate(ticket.resolved_at)}
                  </span>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Modal to create Kanban Task linked to this ticket */}
      <Modal
        isOpen={kanbanModalOpen}
        onClose={() => setKanbanModalOpen(false)}
        title="Adicionar Tarefa ao Seu Kanban Pessoal"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Crie um cartão em seu quadro pessoal referenciando o protocolo{' '}
            <strong>{ticket.protocol}</strong>. Movimentar ou concluir a tarefa no seu Kanban não
            alterará o status do ticket oficial.
          </p>

          <Input
            label="Título da Tarefa no Kanban"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Coluna de Destino</label>
            <select
              value={selectedColumnId}
              onChange={(e) => setSelectedColumnId(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-c3con-gold-400"
            >
              {kanbanColumns.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setKanbanModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={savingTask}
              onClick={handleCreateKanbanTask}
            >
              Criar no Kanban
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
