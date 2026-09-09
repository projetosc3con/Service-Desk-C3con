import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { TicketStatus, TicketPriority, TicketType, UserRole } from '../types/database.types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const STATUS_CONFIG: Record<
  TicketStatus,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  novo: {
    label: 'Novo',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  assinado: {
    label: 'Assinado',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    dot: 'bg-purple-500',
  },
  em_andamento: {
    label: 'Em Andamento',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  aguardando_cliente: {
    label: 'Aguardando Cliente',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    dot: 'bg-orange-500',
  },
  resolvido: {
    label: 'Resolvido',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  fechado: {
    label: 'Fechado',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  },
};

export const PRIORITY_CONFIG: Record<
  TicketPriority,
  { label: string; bg: string; text: string; border: string }
> = {
  baixa: {
    label: 'Baixa',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
  },
  media: {
    label: 'Média',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  alta: {
    label: 'Alta',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
  },
  critica: {
    label: 'Crítica',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
  },
};

export const TYPE_CONFIG: Record<
  TicketType,
  { label: string; bg: string; text: string; border: string }
> = {
  correcao: {
    label: 'Correção de Erro',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
  },
  melhoria: {
    label: 'Melhoria',
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    border: 'border-teal-200',
  },
};

export const ROLE_CONFIG: Record<
  UserRole,
  { label: string; bg: string; text: string }
> = {
  admin: {
    label: 'Administrador',
    bg: 'bg-c3con-gold-100 text-c3con-gold-900 border-c3con-gold-300',
    text: 'text-c3con-gold-800',
  },
  agente: {
    label: 'Agente de Suporte',
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    text: 'text-slate-600',
  },
};

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatDateShort(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  // Directly parse YYYY-MM-DD to avoid timezone offset shifts (fixes D-1 issue)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  }
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function formatMinutesToDuration(minutes: number | null | undefined): string {
  if (minutes == null || isNaN(minutes)) return '-';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours < 24) {
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}

export function timeAgo(dateString: string | null | undefined): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'agora mesmo';
  if (diffInSeconds < 3600) return `há ${Math.floor(diffInSeconds / 60)} min`;
  if (diffInSeconds < 86400) return `há ${Math.floor(diffInSeconds / 3600)} h`;
  if (diffInSeconds < 604800) return `há ${Math.floor(diffInSeconds / 86400)} d`;
  return formatDateShort(dateString);
}
