import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type {
  DashboardCard,
  FilterCondition,
  FilterField,
  FilterOperator,
  FilterMatchType,
  VisualizationType,
  ChartMetric,
  GroupByField,
} from '../../types/dashboard.types';
import {
  AVAILABLE_TABLE_COLUMNS,
  FILTER_FIELD_OPTIONS,
  OPERATOR_LABELS,
} from '../../types/dashboard.types';
import type { Application, Profile, TicketWithDetails } from '../../types/database.types';
import { filterTickets } from '../../utils/dashboardFilter';
import {
  Plus,
  Trash2,
  Table as TableIcon,
  BarChart2,
  PieChart as PieIcon,
  TrendingUp,
  Hash,
  Sliders,
  Filter,
  Layers,
} from 'lucide-react';

interface CardConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (card: DashboardCard) => void;
  initialCard?: DashboardCard | null;
  tickets: TicketWithDetails[];
  applications: Application[];
  teamMembers: Profile[];
}

export const CardConfigModal: React.FC<CardConfigModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialCard,
  tickets,
  applications,
  teamMembers,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'filters' | 'display'>('general');

  // Form states
  const [title, setTitle] = useState('');
  const [minColSpan, setMinColSpan] = useState(3);
  const [maxColSpan, setMaxColSpan] = useState(12);
  const [colSpan, setColSpan] = useState(6);

  const [filterMatchType, setFilterMatchType] = useState<FilterMatchType>('AND');
  const [conditions, setConditions] = useState<FilterCondition[]>([]);

  const [visualizationType, setVisualizationType] = useState<VisualizationType>('table');
  const [chartMetric, setChartMetric] = useState<ChartMetric>('count');
  const [groupByField, setGroupByField] = useState<GroupByField>('status');
  const [columnsToShow, setColumnsToShow] = useState<string[]>([
    'protocol',
    'requester_name',
    'application',
    'status',
    'priority',
    'created_at',
  ]);

  useEffect(() => {
    if (initialCard) {
      setTitle(initialCard.title);
      setMinColSpan(initialCard.min_col_span || 3);
      setMaxColSpan(initialCard.max_col_span || 12);
      setColSpan(initialCard.col_span || 6);
      setFilterMatchType(initialCard.filter_match_type || 'AND');
      setConditions(initialCard.filter_conditions ? [...initialCard.filter_conditions] : []);
      setVisualizationType(initialCard.visualization_type || 'table');
      setChartMetric(initialCard.chart_metric || 'count');
      setGroupByField(initialCard.group_by_field || 'status');
      setColumnsToShow(initialCard.columns_to_show || [
        'protocol',
        'requester_name',
        'application',
        'status',
        'priority',
        'created_at',
      ]);
    } else {
      // Default new card
      setTitle('Novo Widget de Chamados');
      setMinColSpan(3);
      setMaxColSpan(12);
      setColSpan(6);
      setFilterMatchType('AND');
      setConditions([]);
      setVisualizationType('table');
      setChartMetric('count');
      setGroupByField('status');
      setColumnsToShow([
        'protocol',
        'requester_name',
        'application',
        'status',
        'priority',
        'created_at',
      ]);
    }
    setActiveTab('general');
  }, [initialCard, isOpen]);

  // Preview match count
  const matchingTickets = filterTickets(tickets, conditions, filterMatchType);

  const handleAddCondition = () => {
    const newCondition: FilterCondition = {
      id: Math.random().toString(36).substring(2, 9),
      field: 'status',
      operator: 'equals',
      value: 'novo',
    };
    setConditions([...conditions, newCondition]);
  };

  const handleRemoveCondition = (id: string) => {
    setConditions(conditions.filter((c) => c.id !== id));
  };

  const handleUpdateCondition = (id: string, field: keyof FilterCondition, value: any) => {
    setConditions(
      conditions.map((c) => {
        if (c.id !== id) return c;
        const updated = { ...c, [field]: value };
        // Reset default value if field changed
        if (field === 'field') {
          if (value === 'status') updated.value = 'novo';
          else if (value === 'priority') updated.value = 'alta';
          else if (value === 'type') updated.value = 'problema';
          else if (value === 'application_id') updated.value = applications[0]?.id || '';
          else if (value === 'assigned_to') updated.value = teamMembers[0]?.id || '';
          else updated.value = '';
        }
        return updated;
      })
    );
  };

  const handleToggleColumn = (colId: string) => {
    if (columnsToShow.includes(colId)) {
      if (columnsToShow.length > 1) {
        setColumnsToShow(columnsToShow.filter((c) => c !== colId));
      }
    } else {
      setColumnsToShow([...columnsToShow, colId]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Por favor, defina um título para o card.');
      return;
    }

    const cardData: DashboardCard = {
      id: initialCard?.id || Math.random().toString(36).substring(2, 11),
      user_id: initialCard?.user_id,
      title: title.trim(),
      min_col_span: Math.min(Math.max(Number(minColSpan) || 1, 1), 12),
      max_col_span: Math.min(Math.max(Number(maxColSpan) || 1, 1), 12),
      col_span: Math.min(Math.max(Number(colSpan) || 1, 1), 12),
      position: initialCard?.position ?? 0,
      visualization_type: visualizationType,
      chart_metric: chartMetric,
      group_by_field: groupByField,
      columns_to_show: columnsToShow,
      filter_match_type: filterMatchType,
      filter_conditions: conditions,
      created_at: initialCard?.created_at,
      updated_at: new Date().toISOString(),
    };

    // Ensure col_span is within min and max
    if (cardData.col_span < cardData.min_col_span) {
      cardData.col_span = cardData.min_col_span;
    }
    if (cardData.col_span > cardData.max_col_span) {
      cardData.col_span = cardData.max_col_span;
    }

    onSave(cardData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialCard ? 'Editar Card do Dashboard' : 'Novo Card no Dashboard'}
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'general'
                ? 'border-c3con-gold-500 text-c3con-gold-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            1. Geral & Dimensões
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('filters')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'filters'
                ? 'border-c3con-gold-500 text-c3con-gold-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            2. Filtros de Dados ({conditions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('display')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
              activeTab === 'display'
                ? 'border-c3con-gold-500 text-c3con-gold-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            3. Visualização & Colunas
          </button>
        </div>

        {/* Tab 1: General & Dimensions */}
        {activeTab === 'general' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <Input
              label="Título do Card / Widget"
              placeholder="Ex: Chamados Críticos em Aberto, Tempo de Resolução..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Largura em Colunas (Grid de 12 colunas)
              </h4>
              <p className="text-xs text-slate-500">
                O dashboard opera em um layout de 12 colunas (padrão ServiceNow). Defina os limites de redimensionamento e o tamanho inicial.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Largura Mínima (Colunas)
                  </label>
                  <select
                    value={minColSpan}
                    onChange={(e) => setMinColSpan(Number(e.target.value))}
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-c3con-gold-400"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? 'coluna' : 'colunas'} ({Math.round((n / 12) * 100)}%)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Largura Inicial Padrão
                  </label>
                  <select
                    value={colSpan}
                    onChange={(e) => setColSpan(Number(e.target.value))}
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-c3con-gold-400"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? 'coluna' : 'colunas'} ({Math.round((n / 12) * 100)}%)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Largura Máxima (Colunas)
                  </label>
                  <select
                    value={maxColSpan}
                    onChange={(e) => setMaxColSpan(Number(e.target.value))}
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-c3con-gold-400"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? 'coluna' : 'colunas'} ({Math.round((n / 12) * 100)}%)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Filters with AND / OR Logic */}
        {activeTab === 'filters' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-xs font-bold text-slate-700">Combinação das Condições:</span>
                <p className="text-[11px] text-slate-500">
                  Como múltiplos filtros devem ser aplicados aos chamados
                </p>
              </div>

              <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-white shadow-xs">
                <button
                  type="button"
                  onClick={() => setFilterMatchType('AND')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    filterMatchType === 'AND'
                      ? 'bg-c3con-gold-500 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Todas (E / AND)
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMatchType('OR')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    filterMatchType === 'OR'
                      ? 'bg-c3con-gold-500 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Qualquer (OU / OR)
                </button>
              </div>
            </div>

            {/* Conditions List */}
            <div className="space-y-2.5 max-h-[36vh] overflow-y-auto pr-1">
              {conditions.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <Filter className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                  <p className="text-xs text-slate-500 font-medium">Sem condições de filtro definidas.</p>
                  <p className="text-[11px] text-slate-400">
                    O card exibirá todos os chamados da base ({tickets.length} chamados).
                  </p>
                </div>
              ) : (
                conditions.map((condition, idx) => {
                  const fieldMeta = FILTER_FIELD_OPTIONS.find((f) => f.id === condition.field);

                  return (
                    <div
                      key={condition.id}
                      className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
                    >
                      {/* Operator Indicator Pill */}
                      {idx > 0 && (
                        <span className="self-start sm:self-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-c3con-gold-100 text-c3con-gold-800 uppercase">
                          {filterMatchType === 'AND' ? 'E' : 'OU'}
                        </span>
                      )}

                      {/* Field Selection */}
                      <select
                        value={condition.field}
                        onChange={(e) =>
                          handleUpdateCondition(condition.id, 'field', e.target.value as FilterField)
                        }
                        className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-800 sm:w-36 focus:ring-2 focus:ring-c3con-gold-400"
                      >
                        {FILTER_FIELD_OPTIONS.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.label}
                          </option>
                        ))}
                      </select>

                      {/* Operator Selection */}
                      <select
                        value={condition.operator}
                        onChange={(e) =>
                          handleUpdateCondition(condition.id, 'operator', e.target.value as FilterOperator)
                        }
                        className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-700 sm:w-36 focus:ring-2 focus:ring-c3con-gold-400"
                      >
                        <option value="equals">{OPERATOR_LABELS.equals}</option>
                        <option value="not_equals">{OPERATOR_LABELS.not_equals}</option>
                        <option value="contains">{OPERATOR_LABELS.contains}</option>
                        {fieldMeta?.type === 'number' && (
                          <>
                            <option value="greater_than">{OPERATOR_LABELS.greater_than}</option>
                            <option value="less_than">{OPERATOR_LABELS.less_than}</option>
                            <option value="greater_or_equal">{OPERATOR_LABELS.greater_or_equal}</option>
                            <option value="less_or_equal">{OPERATOR_LABELS.less_or_equal}</option>
                          </>
                        )}
                        <option value="is_empty">{OPERATOR_LABELS.is_empty}</option>
                        <option value="is_not_empty">{OPERATOR_LABELS.is_not_empty}</option>
                      </select>

                      {/* Dynamic Value Input */}
                      {condition.operator !== 'is_empty' && condition.operator !== 'is_not_empty' && (
                        <div className="flex-1 min-w-[140px]">
                          {condition.field === 'status' ? (
                            <select
                              value={condition.value}
                              onChange={(e) =>
                                handleUpdateCondition(condition.id, 'value', e.target.value)
                              }
                              className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 font-medium text-slate-800 focus:ring-2 focus:ring-c3con-gold-400"
                            >
                              <option value="novo">Novo</option>
                              <option value="em_atendimento">Em Atendimento</option>
                              <option value="aguardando_terceiro">Aguardando Terceiro</option>
                              <option value="resolvido">Resolvido</option>
                              <option value="fechado">Fechado</option>
                              <option value="cancelado">Cancelado</option>
                            </select>
                          ) : condition.field === 'priority' ? (
                            <select
                              value={condition.value}
                              onChange={(e) =>
                                handleUpdateCondition(condition.id, 'value', e.target.value)
                              }
                              className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 font-medium text-slate-800 focus:ring-2 focus:ring-c3con-gold-400"
                            >
                              <option value="baixa">Baixa</option>
                              <option value="media">Média</option>
                              <option value="alta">Alta</option>
                              <option value="critica">Crítica</option>
                            </select>
                          ) : condition.field === 'type' ? (
                            <select
                              value={condition.value}
                              onChange={(e) =>
                                handleUpdateCondition(condition.id, 'value', e.target.value)
                              }
                              className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 font-medium text-slate-800 focus:ring-2 focus:ring-c3con-gold-400"
                            >
                              <option value="duvida">Dúvida</option>
                              <option value="problema">Problema</option>
                              <option value="solicitacao">Solicitação</option>
                              <option value="melhoria">Melhoria</option>
                            </select>
                          ) : condition.field === 'application_id' ? (
                            <select
                              value={condition.value}
                              onChange={(e) =>
                                handleUpdateCondition(condition.id, 'value', e.target.value)
                              }
                              className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 font-medium text-slate-800 focus:ring-2 focus:ring-c3con-gold-400"
                            >
                              {applications.map((app) => (
                                <option key={app.id} value={app.id}>
                                  {app.name}
                                </option>
                              ))}
                            </select>
                          ) : condition.field === 'assigned_to' ? (
                            <select
                              value={condition.value}
                              onChange={(e) =>
                                handleUpdateCondition(condition.id, 'value', e.target.value)
                              }
                              className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 font-medium text-slate-800 focus:ring-2 focus:ring-c3con-gold-400"
                            >
                              {teamMembers.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.full_name}
                                </option>
                              ))}
                            </select>
                          ) : condition.field === 'created_at' ? (
                            <input
                              type="date"
                              value={condition.value}
                              onChange={(e) =>
                                handleUpdateCondition(condition.id, 'value', e.target.value)
                              }
                              className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-c3con-gold-400"
                            />
                          ) : condition.field === 'resolution_time_minutes' ? (
                            <input
                              type="number"
                              placeholder="Ex: 60"
                              value={condition.value}
                              onChange={(e) =>
                                handleUpdateCondition(condition.id, 'value', e.target.value)
                              }
                              className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-c3con-gold-400"
                            />
                          ) : (
                            <input
                              type="text"
                              placeholder="Valor do filtro..."
                              value={condition.value}
                              onChange={(e) =>
                                handleUpdateCondition(condition.id, 'value', e.target.value)
                              }
                              className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-c3con-gold-400"
                            />
                          )}
                        </div>
                      )}

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveCondition(condition.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 rounded-lg transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddCondition}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Adicionar Condição
              </Button>

              <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">
                Preview: <strong>{matchingTickets.length}</strong> de {tickets.length} chamados filtrados
              </span>
            </div>
          </div>
        )}

        {/* Tab 3: Display Mode & Columns */}
        {activeTab === 'display' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Visualization Type Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Tipo de Visualização
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { id: 'table', label: 'Tabela', icon: TableIcon },
                  { id: 'bar', label: 'Barras', icon: BarChart2 },
                  { id: 'pie', label: 'Pizza / Rosca', icon: PieIcon },
                  { id: 'line', label: 'Linhas', icon: TrendingUp },
                  { id: 'stat', label: 'Card KPI', icon: Hash },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = visualizationType === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setVisualizationType(item.id as VisualizationType)}
                      className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                        isSelected
                          ? 'border-c3con-gold-500 bg-c3con-gold-50/50 text-c3con-gold-900 shadow-xs ring-1 ring-c3con-gold-400'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-c3con-gold-600' : 'text-slate-400'}`} />
                      <span className="text-xs font-semibold">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dynamic settings depending on visualization type */}
            {visualizationType === 'table' ? (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                <label className="block text-xs font-bold text-slate-700">
                  Colunas a serem exibidas na tabela
                </label>
                <p className="text-[11px] text-slate-500 mb-2">
                  Selecione quais colunas devem compor a exibição de dados desta tabela
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {AVAILABLE_TABLE_COLUMNS.map((col) => {
                    const isChecked = columnsToShow.includes(col.id);
                    return (
                      <label
                        key={col.id}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer select-none transition-colors ${
                          isChecked
                            ? 'bg-white border-c3con-gold-300 text-slate-900 font-semibold shadow-2xs'
                            : 'bg-white/60 border-slate-200 text-slate-500 hover:bg-white'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleColumn(col.id)}
                          className="rounded text-c3con-gold-600 focus:ring-c3con-gold-400 h-3.5 w-3.5"
                        />
                        <span>{col.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Configuração de Métricas do Gráfico
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Agrupar por (Dimensão)
                    </label>
                    <select
                      value={groupByField}
                      onChange={(e) => setGroupByField(e.target.value as GroupByField)}
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-c3con-gold-400"
                    >
                      <option value="status">Status do Chamado</option>
                      <option value="priority">Prioridade</option>
                      <option value="type">Tipo</option>
                      <option value="application_id">Aplicação</option>
                      <option value="assigned_to">Responsável</option>
                      <option value="created_at">Data de Criação (Dia)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Métrica a Exibir (Valor)
                    </label>
                    <select
                      value={chartMetric}
                      onChange={(e) => setChartMetric(e.target.value as ChartMetric)}
                      className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-c3con-gold-400"
                    >
                      <option value="count">Contagem de Chamados</option>
                      <option value="avg_resolution_time">Tempo Médio de Resolução (Minutos)</option>
                      <option value="sum_resolution_time">Tempo Total de Resolução (Minutos)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancelar
          </Button>

          <div className="flex gap-2">
            {activeTab !== 'display' ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setActiveTab(activeTab === 'general' ? 'filters' : 'display')
                }
              >
                Avançar
              </Button>
            ) : null}

            <Button type="submit" variant="primary" size="sm">
              {initialCard ? 'Salvar Alterações' : 'Adicionar ao Dashboard'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
