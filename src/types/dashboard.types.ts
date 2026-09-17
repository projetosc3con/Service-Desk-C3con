export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'greater_than'
  | 'less_than'
  | 'greater_or_equal'
  | 'less_or_equal'
  | 'is_empty'
  | 'is_not_empty';

export type FilterField =
  | 'status'
  | 'priority'
  | 'type'
  | 'application_id'
  | 'assigned_to'
  | 'requester_name'
  | 'resolution_time_minutes'
  | 'created_at';

export interface FilterCondition {
  id: string;
  field: FilterField;
  operator: FilterOperator;
  value: string;
}

export type FilterMatchType = 'AND' | 'OR';

export type VisualizationType = 'table' | 'bar' | 'pie' | 'line' | 'stat';

export type ChartMetric = 'count' | 'avg_resolution_time' | 'sum_resolution_time';

export type GroupByField =
  | 'status'
  | 'priority'
  | 'type'
  | 'application_id'
  | 'assigned_to'
  | 'created_at';

export interface DashboardCard {
  id: string;
  user_id?: string;
  title: string;
  min_col_span: number; // 1 to 12
  max_col_span: number; // 1 to 12
  col_span: number;     // 1 to 12
  position: number;
  visualization_type: VisualizationType;
  chart_metric: ChartMetric;
  group_by_field: GroupByField;
  columns_to_show: string[];
  filter_match_type: FilterMatchType;
  filter_conditions: FilterCondition[];
  created_at?: string;
  updated_at?: string;
}

export const AVAILABLE_TABLE_COLUMNS: { id: string; label: string }[] = [
  { id: 'protocol', label: 'Protocolo' },
  { id: 'requester_name', label: 'Solicitante' },
  { id: 'application', label: 'Aplicação' },
  { id: 'status', label: 'Status' },
  { id: 'priority', label: 'Prioridade' },
  { id: 'type', label: 'Tipo' },
  { id: 'assigned_profile', label: 'Responsável' },
  { id: 'resolution_time_minutes', label: 'Tempo Resolução (min)' },
  { id: 'created_at', label: 'Criado em' },
];

export const FILTER_FIELD_OPTIONS: { id: FilterField; label: string; type: 'select' | 'text' | 'number' | 'date' }[] = [
  { id: 'status', label: 'Status', type: 'select' },
  { id: 'priority', label: 'Prioridade', type: 'select' },
  { id: 'type', label: 'Tipo', type: 'select' },
  { id: 'application_id', label: 'Aplicação', type: 'select' },
  { id: 'assigned_to', label: 'Atribuído Para', type: 'select' },
  { id: 'requester_name', label: 'Nome do Solicitante', type: 'text' },
  { id: 'resolution_time_minutes', label: 'Tempo de Resolução (min)', type: 'number' },
  { id: 'created_at', label: 'Data de Abertura', type: 'date' },
];

export const OPERATOR_LABELS: Record<FilterOperator, string> = {
  equals: 'É igual a',
  not_equals: 'É diferente de',
  contains: 'Contém o texto',
  greater_than: 'Maior que',
  less_than: 'Menor que',
  greater_or_equal: 'Maior ou igual a',
  less_or_equal: 'Menor ou igual a',
  is_empty: 'Está vazio (Não preenchido)',
  is_not_empty: 'Não está vazio (Preenchido)',
};
