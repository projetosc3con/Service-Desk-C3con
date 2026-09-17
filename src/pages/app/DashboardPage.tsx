import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Application, Profile, TicketWithDetails } from '../../types/database.types';
import type { DashboardCard } from '../../types/dashboard.types';
import { DashboardCardView } from '../../components/dashboard/DashboardCardView';
import { CardConfigModal } from '../../components/dashboard/CardConfigModal';
import { Button } from '../../components/ui/Button';
import {
  Plus,
  RotateCcw,
  RefreshCw,
  LayoutDashboard,
  Clock,
  CheckCircle2,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const [cards, setCards] = useState<DashboardCard[]>([]);
  const [tickets, setTickets] = useState<TicketWithDetails[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [teamMembers, setTeamMembers] = useState<Profile[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<DashboardCard | null>(null);

  // Notification feedback
  const [notice, setNotice] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3000);
  };

  // Generate 3 standard default ServiceNow widgets
  const getDefaultCards = (userId?: string): DashboardCard[] => [
    {
      id: 'default-card-status',
      user_id: userId,
      title: 'Distribuição de Chamados por Status',
      min_col_span: 3,
      max_col_span: 12,
      col_span: 4,
      position: 0,
      visualization_type: 'pie',
      chart_metric: 'count',
      group_by_field: 'status',
      columns_to_show: ['protocol', 'requester_name', 'application', 'status', 'created_at'],
      filter_match_type: 'AND',
      filter_conditions: [],
    },
    {
      id: 'default-card-sla',
      user_id: userId,
      title: 'Tempo Médio de Resolução por Aplicação (min)',
      min_col_span: 4,
      max_col_span: 12,
      col_span: 8,
      position: 1,
      visualization_type: 'bar',
      chart_metric: 'avg_resolution_time',
      group_by_field: 'application_id',
      columns_to_show: ['protocol', 'application', 'status', 'resolution_time_minutes'],
      filter_match_type: 'AND',
      filter_conditions: [],
    },
    {
      id: 'default-card-critical-table',
      user_id: userId,
      title: 'Chamados com Prioridade Alta ou Crítica',
      min_col_span: 6,
      max_col_span: 12,
      col_span: 12,
      position: 2,
      visualization_type: 'table',
      chart_metric: 'count',
      group_by_field: 'status',
      columns_to_show: [
        'protocol',
        'requester_name',
        'application',
        'status',
        'priority',
        'assigned_profile',
        'created_at',
      ],
      filter_match_type: 'OR',
      filter_conditions: [
        {
          id: 'cond-1',
          field: 'priority',
          operator: 'equals',
          value: 'alta',
        },
        {
          id: 'cond-2',
          field: 'priority',
          operator: 'equals',
          value: 'critica',
        },
      ],
    },
  ];

  const loadData = async (isInitial = false) => {
    if (!user) return;
    if (isInitial) setLoading(true);
    else setRefreshing(true);

    try {
      // 1. Fetch tickets with details
      const { data: ticketsData, error: ticketsErr } = await supabase
        .from('tickets')
        .select(`
          *,
          application:applications(*),
          assigned_profile:profiles(*)
        `)
        .order('created_at', { ascending: false });

      if (ticketsErr) throw ticketsErr;
      setTickets((ticketsData as any) || []);

      // 2. Fetch applications
      const { data: appsData } = await supabase
        .from('applications')
        .select('*')
        .eq('active', true)
        .order('name');
      setApplications(appsData || []);

      // 3. Fetch team members
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');
      setTeamMembers(profilesData || []);

      // 4. Fetch user dashboard cards
      const { data: cardsData, error: cardsErr } = await supabase
        .from('dashboard_cards')
        .select('*')
        .eq('user_id', user.id)
        .order('position', { ascending: true });

      if (cardsErr) {
        console.warn('Erro ao carregar cards do Supabase:', cardsErr);
      }

      if (cardsData && cardsData.length > 0) {
        setCards(cardsData as any);
      } else {
        // Seed default cards
        const defaults = getDefaultCards(user.id);
        const { data: seededCards, error: seedErr } = await supabase
          .from('dashboard_cards')
          .insert(
            defaults.map((c) => ({
              user_id: user.id,
              title: c.title,
              min_col_span: c.min_col_span,
              max_col_span: c.max_col_span,
              col_span: c.col_span,
              position: c.position,
              visualization_type: c.visualization_type,
              chart_metric: c.chart_metric,
              group_by_field: c.group_by_field,
              columns_to_show: c.columns_to_show,
              filter_match_type: c.filter_match_type,
              filter_conditions: c.filter_conditions,
            }))
          )
          .select();

        if (!seedErr && seededCards && seededCards.length > 0) {
          setCards(seededCards as any);
        } else {
          setCards(defaults);
        }
      }
    } catch (err: any) {
      console.error('Erro ao carregar dados do dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(true);
  }, [user]);

  // Save Card (Create or Update)
  const handleSaveCard = async (savedCard: DashboardCard) => {
    if (!user) return;

    setIsModalOpen(false);

    try {
      const isEditing = cards.some((c) => c.id === savedCard.id);

      if (isEditing) {
        // Optimistic update
        setCards((prev) => prev.map((c) => (c.id === savedCard.id ? savedCard : c)));
        showNotice('Card atualizado com sucesso!');

        const { error } = await supabase
          .from('dashboard_cards')
          .update({
            title: savedCard.title,
            min_col_span: savedCard.min_col_span,
            max_col_span: savedCard.max_col_span,
            col_span: savedCard.col_span,
            visualization_type: savedCard.visualization_type,
            chart_metric: savedCard.chart_metric,
            group_by_field: savedCard.group_by_field,
            columns_to_show: savedCard.columns_to_show,
            filter_match_type: savedCard.filter_match_type,
            filter_conditions: savedCard.filter_conditions,
            updated_at: new Date().toISOString(),
          })
          .eq('id', savedCard.id);

        if (error) throw error;
      } else {
        const newCardPayload = {
          user_id: user.id,
          title: savedCard.title,
          min_col_span: savedCard.min_col_span,
          max_col_span: savedCard.max_col_span,
          col_span: savedCard.col_span,
          position: cards.length,
          visualization_type: savedCard.visualization_type,
          chart_metric: savedCard.chart_metric,
          group_by_field: savedCard.group_by_field,
          columns_to_show: savedCard.columns_to_show,
          filter_match_type: savedCard.filter_match_type,
          filter_conditions: savedCard.filter_conditions,
        };

        const { data: inserted, error } = await supabase
          .from('dashboard_cards')
          .insert(newCardPayload)
          .select()
          .single();

        if (error) throw error;

        if (inserted) {
          setCards((prev) => [...prev, inserted as any]);
        }
        showNotice('Card adicionado ao seu dashboard!');
      }
    } catch (err: any) {
      console.error('Erro ao salvar card:', err);
      alert(`Erro ao salvar card: ${err.message}`);
      loadData();
    }
  };

  // Delete Card
  const handleDeleteCard = async (cardId: string) => {
    if (!confirm('Deseja realmente remover este card do seu dashboard?')) return;

    setCards((prev) => prev.filter((c) => c.id !== cardId));
    showNotice('Card removido do dashboard.');

    try {
      const { error } = await supabase.from('dashboard_cards').delete().eq('id', cardId);
      if (error) throw error;
    } catch (err: any) {
      console.error('Erro ao excluir card:', err);
      alert(`Erro ao excluir card: ${err.message}`);
      loadData();
    }
  };

  // Resize Card
  const handleResizeCard = async (cardId: string, newColSpan: number) => {
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, col_span: newColSpan } : c))
    );

    try {
      await supabase
        .from('dashboard_cards')
        .update({ col_span: newColSpan, updated_at: new Date().toISOString() })
        .eq('id', cardId);
    } catch (err) {
      console.error('Erro ao redimensionar card:', err);
    }
  };

  // Reset to default cards
  const handleResetDefaults = async () => {
    if (!user) return;
    if (!confirm('Deseja restaurar o dashboard para a visualização padrão?')) return;

    try {
      await supabase.from('dashboard_cards').delete().eq('user_id', user.id);
      await loadData();
      showNotice('Dashboard restaurado para o padrão.');
    } catch (err: any) {
      alert(`Erro ao restaurar: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Dashboard Personalizado
            </h1>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-c3con-gold-100 text-c3con-gold-800 uppercase tracking-wider">
              ServiceNow Style
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Crie, filtre e organize cards analíticos e operacionais com regras lógicas (E / OU) e grid flexível de 1 a 12 colunas.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(false)}
            isLoading={refreshing}
            leftIcon={<RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />}
            title="Atualizar dados dos chamados"
          >
            Atualizar
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleResetDefaults}
            leftIcon={<RotateCcw className="w-4 h-4" />}
            title="Restaurar widgets recomendados de fábrica"
          >
            Padrão
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingCard(null);
              setIsModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Adicionar Card
          </Button>
        </div>
      </div>

      {/* Main Dashboard Grid Area */}
      {loading ? (
        <div className="p-16 text-center text-slate-400">
          <Clock className="w-8 h-8 animate-spin mx-auto mb-2 text-c3con-gold-500" />
          <p className="text-sm font-medium">Carregando seu dashboard analítico...</p>
        </div>
      ) : cards.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm max-w-lg mx-auto">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-c3con-gold-50 text-c3con-gold-600 flex items-center justify-center">
            <LayoutDashboard className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">Nenhum card no seu dashboard</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Você ainda não possui cards personalizados. Adicione um novo card ou restaure os widgets recomendados.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Button variant="outline" size="sm" onClick={handleResetDefaults}>
              Restaurar Widgets Padrão
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setEditingCard(null);
                setIsModalOpen(true);
              }}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Criar Primeiro Card
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
          {cards.map((card) => (
            <DashboardCardView
              key={card.id}
              card={card}
              allTickets={tickets}
              onEdit={(c) => {
                setEditingCard(c);
                setIsModalOpen(true);
              }}
              onDelete={handleDeleteCard}
              onResize={handleResizeCard}
            />
          ))}
        </div>
      )}

      {/* Card Config Modal (Builder) */}
      <CardConfigModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCard}
        initialCard={editingCard}
        tickets={tickets}
        applications={applications}
        teamMembers={teamMembers}
      />

      {/* Floating Notice Toast */}
      {notice && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom duration-200 text-xs font-medium border border-slate-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notice}</span>
        </div>
      )}
    </div>
  );
};
