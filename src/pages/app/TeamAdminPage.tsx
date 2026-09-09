import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Profile, UserRole } from '../../types/database.types';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import { Users, ShieldCheck, UserCheck, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { formatDateShort } from '../../lib/utils';

export const TeamAdminPage: React.FC = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setProfiles(data || []);
    } catch (err) {
      console.error('Erro ao carregar equipe:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const handleToggleRole = async (profile: Profile) => {
    if (profile.id === user?.id) {
      alert('Você não pode alterar seu próprio papel de administrador.');
      return;
    }

    const newRole: UserRole = profile.role === 'admin' ? 'agente' : 'admin';
    const confirmChange = confirm(
      `Deseja alterar o papel de "${profile.full_name}" para "${newRole === 'admin' ? 'Administrador' : 'Agente'}"?`
    );
    if (!confirmChange) return;

    setUpdatingId(profile.id);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', profile.id);

      if (error) throw error;

      setProfiles(
        profiles.map((p) => (p.id === profile.id ? { ...p, role: newRole } : p))
      );
    } catch (err: any) {
      alert(`Erro ao alterar papel: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleActive = async (profile: Profile) => {
    if (profile.id === user?.id) {
      alert('Você não pode desativar seu próprio acesso.');
      return;
    }

    const nextState = !profile.active;
    const confirmChange = confirm(
      `Deseja ${nextState ? 'ativar' : 'desativar'} o acesso de "${profile.full_name}"?`
    );
    if (!confirmChange) return;

    setUpdatingId(profile.id);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ active: nextState })
        .eq('id', profile.id);

      if (error) throw error;

      setProfiles(
        profiles.map((p) => (p.id === profile.id ? { ...p, active: nextState } : p))
      );
    } catch (err: any) {
      alert(`Erro ao alterar status: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Equipe &amp; Permissões
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Gerencie colaboradores internos, atribua papéis (Admin / Agente) e controle acessos
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-c3con-gold-600" />
            <CardTitle className="text-sm">Colaboradores Registrados</CardTitle>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Total: {profiles.length} membro(s)
          </span>
        </CardHeader>
        <CardBody className="p-0">
          {loading ? (
            <div className="p-8 text-center text-slate-400">
              <Clock className="w-6 h-6 animate-spin mx-auto mb-2 text-c3con-gold-500" />
              <p className="text-sm">Carregando membros da equipe...</p>
            </div>
          ) : profiles.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Nenhum colaborador registrado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-6">Colaborador</th>
                    <th className="py-3 px-6">E-mail</th>
                    <th className="py-3 px-6">Papel no Sistema</th>
                    <th className="py-3 px-6">Status da Conta</th>
                    <th className="py-3 px-6">Cadastrado em</th>
                    <th className="py-3 px-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {profiles.map((p) => {
                    const isSelf = p.id === user?.id;
                    const isUpdating = updatingId === p.id;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-c3con-dark-800 to-c3con-dark-700 text-white flex items-center justify-center font-bold text-xs">
                              {p.full_name ? p.full_name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-900 text-sm block">
                                {p.full_name}
                              </span>
                              {isSelf && (
                                <span className="text-[10px] text-c3con-gold-600 font-semibold">
                                  (Você)
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-6 text-xs text-slate-600 font-mono">
                          {p.email}
                        </td>

                        <td className="py-4 px-6">
                          {p.role === 'admin' ? (
                            <Badge className="bg-c3con-gold-100 text-c3con-gold-900 border-c3con-gold-300">
                              <ShieldCheck className="w-3 h-3 text-c3con-gold-700 mr-1" />
                              Administrador
                            </Badge>
                          ) : (
                            <Badge className="bg-slate-100 text-slate-700 border-slate-200">
                              <UserCheck className="w-3 h-3 text-slate-500 mr-1" />
                              Agente
                            </Badge>
                          )}
                        </td>

                        <td className="py-4 px-6">
                          {p.active ? (
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 mr-1" /> Ativo
                            </Badge>
                          ) : (
                            <Badge className="bg-rose-50 text-rose-700 border-rose-200">
                              <XCircle className="w-3 h-3 text-rose-500 mr-1" /> Inativo
                            </Badge>
                          )}
                        </td>

                        <td className="py-4 px-6 text-xs text-slate-500">
                          {formatDateShort(p.created_at)}
                        </td>

                        <td className="py-4 px-6 text-right space-x-2">
                          {!isSelf ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={isUpdating}
                                onClick={() => handleToggleRole(p)}
                              >
                                Mudar para {p.role === 'admin' ? 'Agente' : 'Admin'}
                              </Button>
                              <Button
                                variant={p.active ? 'danger' : 'outline'}
                                size="sm"
                                disabled={isUpdating}
                                onClick={() => handleToggleActive(p)}
                              >
                                {p.active ? 'Desativar' : 'Ativar'}
                              </Button>
                            </>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Sua sessão atual</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};
