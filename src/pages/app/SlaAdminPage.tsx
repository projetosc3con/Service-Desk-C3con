import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { SlaSetting, TicketPriority } from '../../types/database.types';
import { PRIORITY_CONFIG } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import {
  Clock,
  Save,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Info,
  RefreshCw,
} from 'lucide-react';

const PRIORITY_ORDER: TicketPriority[] = ['critica', 'alta', 'media', 'baixa'];

const PRIORITY_DETAILS: Record<TicketPriority, { title: string; hint: string }> = {
  critica: {
    title: 'Crítica (Emergencial)',
    hint: 'Parada total do ambiente, indisponibilidade geral ou risco severo às operações do cliente.',
  },
  alta: {
    title: 'Alta Prioridade',
    hint: 'Módulos cruciais inoperantes sem contorno imediato, afetando múltiplos colaboradores.',
  },
  media: {
    title: 'Média Prioridade',
    hint: 'Falha parcial ou inconsistência com alternativa temporária de trabalho.',
  },
  baixa: {
    title: 'Baixa Prioridade',
    hint: 'Dúvidas pontuais, solicitações de pequenas melhorias ou ajustes cosméticos.',
  },
};

export const SlaAdminPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [savingPriority, setSavingPriority] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states per priority
  const [formValues, setFormValues] = useState<
    Record<
      TicketPriority,
      { avg_time_hours: number; max_time_hours: number; description: string }
    >
  >({
    critica: { avg_time_hours: 2, max_time_hours: 4, description: '' },
    alta: { avg_time_hours: 8, max_time_hours: 16, description: '' },
    media: { avg_time_hours: 24, max_time_hours: 48, description: '' },
    baixa: { avg_time_hours: 48, max_time_hours: 72, description: '' },
  });

  const loadSlaData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const { data, error } = await supabase
        .from('sla_settings')
        .select('*');

      if (error) throw error;

      if (data) {
        const newFormValues = { ...formValues };
        data.forEach((item: SlaSetting) => {
          if (item.priority in newFormValues) {
            newFormValues[item.priority] = {
              avg_time_hours: Number(item.avg_time_hours),
              max_time_hours: Number(item.max_time_hours),
              description: item.description || '',
            };
          }
        });
        setFormValues(newFormValues);
      }
    } catch (err: any) {
      console.error('Erro ao carregar configurações de SLA:', err);
      setErrorMessage('Não foi possível carregar as configurações de SLA.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSlaData();
  }, []);

  const handleFieldChange = (
    priority: TicketPriority,
    field: 'avg_time_hours' | 'max_time_hours' | 'description',
    value: any
  ) => {
    setFormValues((prev) => ({
      ...prev,
      [priority]: {
        ...prev[priority],
        [field]: value,
      },
    }));
  };

  const handleSaveSla = async (priority: TicketPriority) => {
    const values = formValues[priority];
    if (values.avg_time_hours <= 0 || values.max_time_hours <= 0) {
      alert('Os tempos devem ser valores positivos maiores que zero.');
      return;
    }

    if (values.avg_time_hours > values.max_time_hours) {
      alert('O tempo médio não pode ser superior ao tempo máximo tolerado.');
      return;
    }

    setSavingPriority(priority);
    setSuccessNotice(null);
    try {
      const { error } = await supabase
        .from('sla_settings')
        .upsert(
          {
            priority,
            avg_time_hours: values.avg_time_hours,
            max_time_hours: values.max_time_hours,
            description: values.description.trim() || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'priority' }
        );

      if (error) throw error;

      setSuccessNotice(`SLA de criticidade "${PRIORITY_CONFIG[priority].label}" atualizado com sucesso!`);
      setTimeout(() => setSuccessNotice(null), 3500);
      await loadSlaData();
    } catch (err: any) {
      console.error('Erro ao salvar SLA:', err);
      alert(`Erro ao salvar SLA: ${err.message}`);
    } finally {
      setSavingPriority(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Gestão de SLA por Criticidade
            </h1>
            <Badge className="bg-c3con-gold-400/20 text-c3con-gold-700 border-c3con-gold-500/30">
              <ShieldCheck className="w-3 h-3 mr-1" /> Exclusivo Admin
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Configure as metas de tempo médio de atendimento e o tempo máximo tolerado para cada nível de criticidade dos chamados.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadSlaData}
            isLoading={loading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Atualizar
          </Button>
        </div>
      </div>

      {successNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Overview Info Banner */}
      <div className="p-4 rounded-xl bg-c3con-dark-900 text-slate-200 border border-c3con-dark-800 flex items-start gap-3">
        <Info className="w-5 h-5 text-c3con-gold-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-semibold text-white">Como funcionam as métricas de SLA:</p>
          <p className="text-slate-300">
            <strong>Tempo Médio:</strong> Meta operacional recomendada para a resolução do ticket pela equipe de suporte.
          </p>
          <p className="text-slate-300">
            <strong>Tempo Máximo Tolerado:</strong> Limite crítico aceitável acordado antes que o chamado seja considerado fora do prazo aceitável (estouro de SLA).
          </p>
        </div>
      </div>

      {/* SLA Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {PRIORITY_ORDER.map((priorityKey) => {
          const cfg = PRIORITY_CONFIG[priorityKey];
          const details = PRIORITY_DETAILS[priorityKey];
          const values = formValues[priorityKey];
          const isSaving = savingPriority === priorityKey;

          return (
            <Card key={priorityKey} className="overflow-hidden border-slate-200 hover:shadow-md transition-shadow">
              <CardHeader className="bg-slate-50/70 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Badge className={`${cfg.bg} ${cfg.text} ${cfg.border} font-semibold px-2.5 py-0.5`}>
                    {cfg.label}
                  </Badge>
                  <CardTitle className="text-sm font-bold text-slate-800">
                    {details.title}
                  </CardTitle>
                </div>
                <Clock className="w-4 h-4 text-slate-400" />
              </CardHeader>

              <CardBody className="space-y-4 p-5">
                <p className="text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {details.hint}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Tempo Médio */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Tempo Médio (Horas)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0.5"
                        step="0.5"
                        required
                        value={values.avg_time_hours}
                        onChange={(e) =>
                          handleFieldChange(priorityKey, 'avg_time_hours', parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-c3con-gold-400 font-mono"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium pointer-events-none">
                        h
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Ex: {values.avg_time_hours} horas (~{Math.round(values.avg_time_hours * 60)} min)
                    </p>
                  </div>

                  {/* Tempo Máximo Tolerado */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Tempo Máximo Tolerado (Horas)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        step="0.5"
                        required
                        value={values.max_time_hours}
                        onChange={(e) =>
                          handleFieldChange(priorityKey, 'max_time_hours', parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-c3con-gold-400 font-mono"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium pointer-events-none">
                        h
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Limite máximo: {values.max_time_hours} horas
                    </p>
                  </div>
                </div>

                {/* Descrição / Diretriz */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Diretriz / Critério de Enquadramento
                  </label>
                  <textarea
                    rows={2}
                    value={values.description}
                    onChange={(e) => handleFieldChange(priorityKey, 'description', e.target.value)}
                    placeholder="Instruções para a equipe de atendimento sobre este nível..."
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-c3con-gold-400 resize-none"
                  />
                </div>

                {/* Save button */}
                <div className="pt-2 flex justify-end border-t border-slate-100">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => handleSaveSla(priorityKey)}
                    isLoading={isSaving}
                    leftIcon={<Save className="w-3.5 h-3.5" />}
                  >
                    Salvar SLA {cfg.label}
                  </Button>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
