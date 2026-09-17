import type { TicketWithDetails } from '../types/database.types';
import type {
  FilterCondition,
  FilterMatchType,
  GroupByField,
  ChartMetric,
} from '../types/dashboard.types';

/**
 * Avalia uma única condição de filtro em um chamado
 */
export function evaluateCondition(
  ticket: TicketWithDetails,
  condition: FilterCondition
): boolean {
  const { field, operator, value } = condition;

  // Obter o valor do campo no chamado
  let ticketValue: any = null;

  switch (field) {
    case 'status':
      ticketValue = ticket.status;
      break;
    case 'priority':
      ticketValue = ticket.priority;
      break;
    case 'type':
      ticketValue = ticket.type;
      break;
    case 'application_id':
      ticketValue = ticket.application_id;
      break;
    case 'assigned_to':
      ticketValue = ticket.assigned_to;
      break;
    case 'requester_name':
      ticketValue = ticket.requester_name;
      break;
    case 'resolution_time_minutes':
      ticketValue = ticket.resolution_time_minutes;
      break;
    case 'created_at':
      ticketValue = ticket.created_at;
      break;
    default:
      ticketValue = (ticket as any)[field];
  }

  // Operadores de verificação de vazio/preenchido
  if (operator === 'is_empty') {
    return ticketValue === null || ticketValue === undefined || String(ticketValue).trim() === '';
  }

  if (operator === 'is_not_empty') {
    return ticketValue !== null && ticketValue !== undefined && String(ticketValue).trim() !== '';
  }

  // Se o valor de comparação do filtro estiver vazio e não for operador de vazio, ignora ou considera nulo
  if (value === undefined || value === null || String(value).trim() === '') {
    return true;
  }

  // Comparações numéricas (ex: resolution_time_minutes)
  if (field === 'resolution_time_minutes') {
    const numTicket = Number(ticketValue) || 0;
    const numFilter = Number(value) || 0;

    switch (operator) {
      case 'equals':
        return numTicket === numFilter;
      case 'not_equals':
        return numTicket !== numFilter;
      case 'greater_than':
        return numTicket > numFilter;
      case 'less_than':
        return numTicket < numFilter;
      case 'greater_or_equal':
        return numTicket >= numFilter;
      case 'less_or_equal':
        return numTicket <= numFilter;
      default:
        return false;
    }
  }

  // Comparações de datas (ex: created_at)
  if (field === 'created_at') {
    const ticketDate = ticketValue ? new Date(ticketValue).getTime() : 0;
    const filterDate = new Date(value).getTime();

    if (isNaN(filterDate)) return true;

    // Comparação de dia inteiro se for YYYY-MM-DD
    const ticketDay = ticketValue ? String(ticketValue).slice(0, 10) : '';
    const filterDay = String(value).slice(0, 10);

    switch (operator) {
      case 'equals':
        return ticketDay === filterDay;
      case 'not_equals':
        return ticketDay !== filterDay;
      case 'greater_than':
        return ticketDate > filterDate;
      case 'less_than':
        return ticketDate < filterDate;
      case 'greater_or_equal':
        return ticketDate >= filterDate;
      case 'less_or_equal':
        return ticketDate <= filterDate;
      default:
        return false;
    }
  }

  // Comparações de texto padrão e enums
  const strTicket = String(ticketValue ?? '').toLowerCase().trim();
  const strFilter = String(value ?? '').toLowerCase().trim();

  switch (operator) {
    case 'equals':
      return strTicket === strFilter;
    case 'not_equals':
      return strTicket !== strFilter;
    case 'contains':
      return strTicket.includes(strFilter);
    default:
      return strTicket === strFilter;
  }
}

/**
 * Filtra a lista de chamados combinando condições com lógica E (AND) ou OU (OR)
 */
export function filterTickets(
  tickets: TicketWithDetails[],
  conditions: FilterCondition[],
  matchType: FilterMatchType
): TicketWithDetails[] {
  if (!conditions || conditions.length === 0) {
    return tickets;
  }

  // Filtra apenas condições válidas (que possuem campo e operador)
  const validConditions = conditions.filter(
    (c) => c.field && (c.operator === 'is_empty' || c.operator === 'is_not_empty' || String(c.value ?? '').trim() !== '')
  );

  if (validConditions.length === 0) {
    return tickets;
  }

  return tickets.filter((ticket) => {
    if (matchType === 'AND') {
      // TODAS as condições devem ser satisfeitas (E)
      return validConditions.every((cond) => evaluateCondition(ticket, cond));
    } else {
      // QUALQUER UMA das condições deve ser satisfeita (OU)
      return validConditions.some((cond) => evaluateCondition(ticket, cond));
    }
  });
}

const STATUS_LABELS: Record<string, string> = {
  novo: 'Novo',
  em_atendimento: 'Em Atendimento',
  aguardando_terceiro: 'Aguardando Terceiro',
  resolvido: 'Resolvido',
  fechado: 'Fechado',
  cancelado: 'Cancelado',
};

const PRIORITY_LABELS: Record<string, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  critica: 'Crítica',
};

const TYPE_LABELS: Record<string, string> = {
  duvida: 'Dúvida',
  problema: 'Problema',
  solicitacao: 'Solicitação',
  melhoria: 'Melhoria',
};

/**
 * Agrupa chamados e calcula a métrica selecionada para exibição em gráficos
 */
export function aggregateChartData(
  tickets: TicketWithDetails[],
  groupBy: GroupByField,
  metric: ChartMetric
): { name: string; value: number; count: number }[] {
  const groups: Record<string, { count: number; totalMinutes: number; resolvedCount: number }> = {};

  tickets.forEach((t) => {
    let groupKey = 'Não Definido';

    switch (groupBy) {
      case 'status':
        groupKey = STATUS_LABELS[t.status] || t.status || 'Sem Status';
        break;
      case 'priority':
        groupKey = t.priority ? (PRIORITY_LABELS[t.priority] || t.priority) : 'Não Priorizado';
        break;
      case 'type':
        groupKey = t.type ? (TYPE_LABELS[t.type] || t.type) : 'Não Classificado';
        break;
      case 'application_id':
        groupKey = t.application?.name || 'Aplicação Não Informada';
        break;
      case 'assigned_to':
        groupKey = t.assigned_profile?.full_name || 'Não Atribuído';
        break;
      case 'created_at':
        groupKey = t.created_at ? new Date(t.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : 'Sem Data';
        break;
    }

    if (!groups[groupKey]) {
      groups[groupKey] = { count: 0, totalMinutes: 0, resolvedCount: 0 };
    }

    groups[groupKey].count += 1;

    if (t.resolution_time_minutes !== null && t.resolution_time_minutes !== undefined && t.resolution_time_minutes > 0) {
      groups[groupKey].totalMinutes += t.resolution_time_minutes;
      groups[groupKey].resolvedCount += 1;
    }
  });

  return Object.entries(groups).map(([name, data]) => {
    let val = 0;
    if (metric === 'count') {
      val = data.count;
    } else if (metric === 'avg_resolution_time') {
      val = data.resolvedCount > 0 ? Math.round((data.totalMinutes / data.resolvedCount) * 10) / 10 : 0;
    } else if (metric === 'sum_resolution_time') {
      val = data.totalMinutes;
    }

    return {
      name,
      value: val,
      count: data.count,
    };
  });
}
