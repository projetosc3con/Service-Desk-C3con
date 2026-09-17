import React, { useState } from 'react';
import type { DashboardCard } from '../../types/dashboard.types';
import type { TicketWithDetails } from '../../types/database.types';
import { filterTickets, aggregateChartData } from '../../utils/dashboardFilter';
import { Badge } from '../ui/Badge';
import {
  Edit2,
  Trash2,
  Minimize2,
  Maximize2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDateShort } from '../../lib/utils';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

interface DashboardCardViewProps {
  card: DashboardCard;
  allTickets: TicketWithDetails[];
  onEdit: (card: DashboardCard) => void;
  onDelete: (cardId: string) => void;
  onResize: (cardId: string, newColSpan: number) => void;
}

const CHART_COLORS = [
  '#c5a960', // c3con gold
  '#2563eb', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ef4444', // red
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#64748b', // slate
];

const COL_SPAN_CLASSES: Record<number, string> = {
  1: 'md:col-span-1',
  2: 'md:col-span-2',
  3: 'md:col-span-3',
  4: 'md:col-span-4',
  5: 'md:col-span-5',
  6: 'md:col-span-6',
  7: 'md:col-span-7',
  8: 'md:col-span-8',
  9: 'md:col-span-9',
  10: 'md:col-span-10',
  11: 'md:col-span-11',
  12: 'md:col-span-12',
};

export const DashboardCardView: React.FC<DashboardCardViewProps> = ({
  card,
  allTickets,
  onEdit,
  onDelete,
  onResize,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  // Filter tickets according to card conditions
  const filteredTickets = filterTickets(allTickets, card.filter_conditions, card.filter_match_type);

  // Paginated table tickets
  const totalPages = Math.ceil(filteredTickets.length / pageSize) || 1;
  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Aggregate data for charts
  const chartData = aggregateChartData(filteredTickets, card.group_by_field, card.chart_metric);

  // Calculate total for KPI / Stat
  const totalKpiValue =
    card.chart_metric === 'count'
      ? filteredTickets.length
      : card.chart_metric === 'avg_resolution_time'
      ? Math.round(
          (filteredTickets.reduce((acc, t) => acc + (t.resolution_time_minutes || 0), 0) /
            (filteredTickets.filter((t) => t.resolution_time_minutes && t.resolution_time_minutes > 0).length || 1)) *
            10
        ) / 10
      : filteredTickets.reduce((acc, t) => acc + (t.resolution_time_minutes || 0), 0);

  const colClass = COL_SPAN_CLASSES[card.col_span] || 'md:col-span-6';

  const canShrink = card.col_span > card.min_col_span;
  const canExpand = card.col_span < card.max_col_span;

  const handleShrink = () => {
    if (canShrink) {
      onResize(card.id, card.col_span - 1);
    }
  };

  const handleExpand = () => {
    if (canExpand) {
      onResize(card.id, card.col_span + 1);
    }
  };

  return (
    <div
      className={`col-span-12 ${colClass} bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-fit transition-all hover:shadow-md`}
    >
      {/* Card Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/40 rounded-t-2xl">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="font-semibold text-sm text-slate-800 truncate" title={card.title}>
            {card.title}
          </h3>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-600 font-medium shrink-0">
            {filteredTickets.length}
          </span>
        </div>

        {/* Card Actions & Resize Buttons */}
        <div className="flex items-center gap-1 shrink-0">
          {canShrink && (
            <button
              type="button"
              onClick={handleShrink}
              title={`Reduzir largura (Mínimo: ${card.min_col_span} colunas)`}
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
          )}

          {canExpand && (
            <button
              type="button"
              onClick={handleExpand}
              title={`Aumentar largura (Máximo: ${card.max_col_span} colunas)`}
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => onEdit(card)}
            title="Editar configurações do card"
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onDelete(card.id)}
            title="Remover card do dashboard"
            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Card Content Area */}
      <div className="p-4 flex-1">
        {filteredTickets.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <p className="text-xs font-medium">Nenhum chamado corresponde aos filtros deste widget.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Edite as condições do card para visualizar dados.
            </p>
          </div>
        ) : card.visualization_type === 'table' ? (
          /* Table View */
          <div className="space-y-3">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    {card.columns_to_show.includes('protocol') && <th className="pb-2">Protocolo</th>}
                    {card.columns_to_show.includes('requester_name') && <th className="pb-2">Solicitante</th>}
                    {card.columns_to_show.includes('application') && <th className="pb-2">Aplicação</th>}
                    {card.columns_to_show.includes('status') && <th className="pb-2">Status</th>}
                    {card.columns_to_show.includes('priority') && <th className="pb-2">Prioridade</th>}
                    {card.columns_to_show.includes('type') && <th className="pb-2">Tipo</th>}
                    {card.columns_to_show.includes('assigned_profile') && <th className="pb-2">Responsável</th>}
                    {card.columns_to_show.includes('resolution_time_minutes') && (
                      <th className="pb-2">Tempo (min)</th>
                    )}
                    {card.columns_to_show.includes('created_at') && <th className="pb-2">Criado em</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {paginatedTickets.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                      {card.columns_to_show.includes('protocol') && (
                        <td className="py-2.5 font-medium">
                          <Link
                            to={`/app/chamados/${t.id}`}
                            className="inline-flex items-center gap-1 text-c3con-gold-700 hover:text-c3con-gold-800 font-semibold"
                          >
                            <span>{t.protocol}</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                          </Link>
                        </td>
                      )}
                      {card.columns_to_show.includes('requester_name') && (
                        <td className="py-2.5 text-slate-700 max-w-[130px] truncate" title={t.requester_name}>
                          {t.requester_name}
                        </td>
                      )}
                      {card.columns_to_show.includes('application') && (
                        <td className="py-2.5 text-slate-600 max-w-[120px] truncate">
                          {t.application?.name || '—'}
                        </td>
                      )}
                      {card.columns_to_show.includes('status') && (
                        <td className="py-2.5">
                          <Badge variant={t.status as any}>{t.status}</Badge>
                        </td>
                      )}
                      {card.columns_to_show.includes('priority') && (
                        <td className="py-2.5">
                          {t.priority ? <Badge variant={t.priority as any}>{t.priority}</Badge> : '—'}
                        </td>
                      )}
                      {card.columns_to_show.includes('type') && (
                        <td className="py-2.5 text-slate-600 capitalize">{t.type || '—'}</td>
                      )}
                      {card.columns_to_show.includes('assigned_profile') && (
                        <td className="py-2.5 text-slate-600 truncate max-w-[110px]">
                          {t.assigned_profile?.full_name || 'Não atribuído'}
                        </td>
                      )}
                      {card.columns_to_show.includes('resolution_time_minutes') && (
                        <td className="py-2.5 text-slate-600 font-mono">
                          {t.resolution_time_minutes ? `${t.resolution_time_minutes} min` : '—'}
                        </td>
                      )}
                      {card.columns_to_show.includes('created_at') && (
                        <td className="py-2.5 text-slate-400 whitespace-nowrap">
                          {formatDateShort(t.created_at)}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                <span>
                  Página {currentPage} de {totalPages} ({filteredTickets.length} chamados)
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-1 rounded hover:bg-slate-100 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1 rounded hover:bg-slate-100 disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : card.visualization_type === 'bar' ? (
          /* Bar Chart */
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                />
                <YAxis fontSize={10} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
                <Tooltip
                  formatter={(value: any) => [
                    `${value} ${card.chart_metric === 'count' ? 'chamados' : 'minutos'}`,
                    card.chart_metric === 'count'
                      ? 'Total'
                      : card.chart_metric === 'avg_resolution_time'
                      ? 'Média de Tempo'
                      : 'Tempo Total',
                  ]}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '11px',
                    border: 'none',
                  }}
                />
                <Bar dataKey="value" fill="#c5a960" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : card.visualization_type === 'pie' ? (
          /* Pie / Donut Chart */
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }: any) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                  fontSize={10}
                >
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [
                    `${value} ${card.chart_metric === 'count' ? 'chamados' : 'minutos'}`,
                    'Valor',
                  ]}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '11px',
                    border: 'none',
                  }}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : card.visualization_type === 'line' ? (
          /* Line Chart */
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  angle={-20}
                  textAnchor="end"
                />
                <YAxis fontSize={10} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
                <Tooltip
                  formatter={(value: any) => [
                    `${value} ${card.chart_metric === 'count' ? 'chamados' : 'minutos'}`,
                    'Valor',
                  ]}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '11px',
                    border: 'none',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#c5a960"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#c5a960' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          /* Stat / KPI Metric Card */
          <div className="py-8 px-4 flex flex-col items-center justify-center text-center">
            <div className="text-4xl font-extrabold text-slate-900 tracking-tight font-mono">
              {totalKpiValue}
              {card.chart_metric !== 'count' && <span className="text-sm font-sans text-slate-400 ml-1">min</span>}
            </div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-2">
              {card.chart_metric === 'count'
                ? 'Chamados filtrados'
                : card.chart_metric === 'avg_resolution_time'
                ? 'Tempo Médio de Resolução'
                : 'Tempo Total de Resolução'}
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-medium">
              <TrendingUp className="w-3 h-3 text-c3con-gold-600" />
              <span>Base total analisada: {filteredTickets.length} chamados</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
