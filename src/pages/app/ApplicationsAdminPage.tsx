import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Application } from '../../types/database.types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import { Plus, Edit2, Layers, CheckCircle2, XCircle, Clock } from 'lucide-react';

export const ApplicationsAdminPage: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal create/edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppId, setEditingAppId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setApplications(data || []);
    } catch (err) {
      console.error('Erro ao carregar aplicações:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const openNewAppModal = () => {
    setEditingAppId(null);
    setName('');
    setSlug('');
    setDescription('');
    setActive(true);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditAppModal = (app: Application) => {
    setEditingAppId(app.id);
    setName(app.name);
    setSlug(app.slug);
    setDescription(app.description || '');
    setActive(app.active);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const generateSlug = (value: string) => {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingAppId) {
      setSlug(generateSlug(val));
    }
  };

  const handleSaveApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;

    setErrorMsg(null);
    setSaving(true);

    try {
      if (editingAppId) {
        const { error } = await supabase
          .from('applications')
          .update({
            name: name.trim(),
            slug: slug.trim(),
            description: description.trim() || null,
            active,
          })
          .eq('id', editingAppId);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('applications').insert({
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() || null,
          active,
        });

        if (error) throw error;
      }

      setIsModalOpen(false);
      await loadApplications();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar aplicação. Verifique se o slug é único.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (app: Application) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ active: !app.active })
        .eq('id', app.id);

      if (error) throw error;
      setApplications(
        applications.map((a) => (a.id === app.id ? { ...a, active: !a.active } : a))
      );
    } catch (err: any) {
      alert(`Erro ao alterar status da aplicação: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Aplicações &amp; Soluções
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Cadastre as soluções da empresa para recebimento de solicitações no formulário público
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={openNewAppModal}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Nova Aplicação
        </Button>
      </div>

      <Card>
        <CardHeader className="bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-c3con-gold-600" />
            <CardTitle className="text-sm">Aplicações Cadastradas</CardTitle>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Total: {applications.length}
          </span>
        </CardHeader>
        <CardBody className="p-0">
          {loading ? (
            <div className="p-8 text-center text-slate-400">
              <Clock className="w-6 h-6 animate-spin mx-auto mb-2 text-c3con-gold-500" />
              <p className="text-sm">Carregando aplicações...</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Nenhuma aplicação cadastrada ainda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-6">Nome</th>
                    <th className="py-3 px-6">Slug</th>
                    <th className="py-3 px-6">Descrição</th>
                    <th className="py-3 px-6">Status Público</th>
                    <th className="py-3 px-6 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-6 font-semibold text-slate-900 text-sm">
                        {app.name}
                      </td>
                      <td className="py-4 px-6 font-mono text-xs text-slate-500">
                        {app.slug}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-600 max-w-xs truncate">
                        {app.description || '-'}
                      </td>
                      <td className="py-4 px-6">
                        <button
                          onClick={() => handleToggleActive(app)}
                          className="inline-flex items-center gap-1.5 focus:outline-none"
                        >
                          {app.active ? (
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 cursor-pointer">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Ativo
                            </Badge>
                          ) : (
                            <Badge className="bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200 cursor-pointer">
                              <XCircle className="w-3 h-3 text-slate-400" /> Inativo
                            </Badge>
                          )}
                        </button>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditAppModal(app)}
                          leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                        >
                          Editar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Modal create / edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAppId ? 'Editar Aplicação' : 'Cadastrar Nova Aplicação'}
      >
        <form onSubmit={handleSaveApp} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
              {errorMsg}
            </div>
          )}

          <Input
            label="Nome da Solução"
            placeholder="Ex: docpm ERP, AltoMaster Locação..."
            required
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
          />

          <Input
            label="Identificador Único (Slug)"
            placeholder="ex: docpm-erp"
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            helperText="Usado como chave identificadora única no sistema."
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Descrição</label>
            <textarea
              rows={3}
              placeholder="Breve descrição da aplicação ou módulo..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-c3con-gold-400 focus:border-transparent transition-colors resize-y"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="app-active"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="w-4 h-4 rounded text-c3con-gold-500 focus:ring-c3con-gold-400"
            />
            <label htmlFor="app-active" className="text-xs font-medium text-slate-700 select-none">
              Ativo para abertura de chamados pelo público
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={saving}
            >
              {editingAppId ? 'Salvar Alterações' : 'Cadastrar Aplicação'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
