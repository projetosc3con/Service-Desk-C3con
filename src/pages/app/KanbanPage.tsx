import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type {
  KanbanColumn,
  KanbanTaskWithTicket,
  Ticket,
} from '../../types/database.types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import {
  Plus,
  ExternalLink,
  Calendar,
  Trash2,
  Edit2,
  Clock,
  Layers,
} from 'lucide-react';
import { formatDateShort } from '../../lib/utils';
import { Link } from 'react-router-dom';

export const KanbanPage: React.FC = () => {
  const { user } = useAuth();
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [tasks, setTasks] = useState<KanbanTaskWithTicket[]>([]);
  const [ticketsList, setTicketsList] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal: Add / Edit Task
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskColumnId, setTaskColumnId] = useState<string>('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskTicketId, setTaskTicketId] = useState('');
  const [savingTask, setSavingTask] = useState(false);

  // Modal: Add Column
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnColor, setNewColumnColor] = useState('#64748b');
  const [savingColumn, setSavingColumn] = useState(false);

  const loadKanbanData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // 1. Fetch user's columns
      let { data: cols, error: colsError } = await supabase
        .from('kanban_columns')
        .select('*')
        .eq('owner_id', user.id)
        .order('position', { ascending: true });

      if (colsError) throw colsError;

      // If user has no columns yet, seed the default 3 columns
      if (!cols || cols.length === 0) {
        const defaultCols = [
          { owner_id: user.id, name: 'A Fazer', position: 0, color: '#64748b' },
          { owner_id: user.id, name: 'Em Andamento', position: 1, color: '#c5a960' },
          { owner_id: user.id, name: 'Concluído', position: 2, color: '#10b981' },
        ];
        const { data: insertedCols } = await supabase
          .from('kanban_columns')
          .insert(defaultCols)
          .select();
        cols = insertedCols || [];
      }

      setColumns(cols);

      // 2. Fetch user's tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('kanban_tasks')
        .select(
          `
          *,
          ticket:tickets(id, protocol, requester_name, status, priority, application:applications(name))
        `
        )
        .eq('owner_id', user.id)
        .order('position', { ascending: true });

      if (tasksError) throw tasksError;
      setTasks((tasksData as any) || []);

      // 3. Fetch active tickets for linking
      const { data: ticketsData } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      setTicketsList(ticketsData || []);
    } catch (err) {
      console.error('Erro ao carregar dados do Kanban:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKanbanData();
  }, [user]);

  // Handle Drag & Drop
  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    // Dropped in the exact same place
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const draggedTask = tasks.find((t) => t.id === draggableId);
    if (!draggedTask) return;

    // Optimistically update local state
    const newTasks = Array.from(tasks);
    // Remove from old pos
    const [moved] = newTasks.splice(
      newTasks.findIndex((t) => t.id === draggableId),
      1
    );
    moved.column_id = destination.droppableId;
    moved.position = destination.index;

    // Insert into destination column
    newTasks.splice(destination.index, 0, moved);
    setTasks(newTasks);

    // Persist to Supabase
    try {
      await supabase
        .from('kanban_tasks')
        .update({
          column_id: destination.droppableId,
          position: destination.index,
          updated_at: new Date().toISOString(),
        })
        .eq('id', draggableId);
    } catch (err) {
      console.error('Erro ao atualizar posição da tarefa:', err);
      // Revert if error
      loadKanbanData();
    }
  };

  // Open modal for new task
  const openNewTaskModal = (columnId: string) => {
    setEditingTaskId(null);
    setTaskColumnId(columnId);
    setTaskTitle('');
    setTaskDescription('');
    setTaskDueDate('');
    setTaskTicketId('');
    setIsTaskModalOpen(true);
  };

  // Open modal to edit existing task
  const openEditTaskModal = (task: KanbanTaskWithTicket) => {
    setEditingTaskId(task.id);
    setTaskColumnId(task.column_id);
    setTaskTitle(task.title);
    setTaskDescription(task.description || '');
    setTaskDueDate(task.due_date || '');
    setTaskTicketId(task.ticket_id || '');
    setIsTaskModalOpen(true);
  };

  // Save Task (Create or Update)
  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !taskTitle.trim() || !taskColumnId) return;

    setSavingTask(true);
    try {
      if (editingTaskId) {
        // Update
        const { error } = await supabase
          .from('kanban_tasks')
          .update({
            column_id: taskColumnId,
            title: taskTitle.trim(),
            description: taskDescription.trim() || null,
            due_date: taskDueDate || null,
            ticket_id: taskTicketId || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingTaskId);

        if (error) throw error;
      } else {
        // Create
        const colTasks = tasks.filter((t) => t.column_id === taskColumnId);
        const { error } = await supabase.from('kanban_tasks').insert({
          owner_id: user.id,
          column_id: taskColumnId,
          title: taskTitle.trim(),
          description: taskDescription.trim() || null,
          due_date: taskDueDate || null,
          ticket_id: taskTicketId || null,
          position: colTasks.length,
        });

        if (error) throw error;
      }

      setIsTaskModalOpen(false);
      await loadKanbanData();
    } catch (err: any) {
      alert(`Erro ao salvar tarefa: ${err.message}`);
    } finally {
      setSavingTask(false);
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Deseja realmente remover esta tarefa do seu Kanban?')) return;

    try {
      const { error } = await supabase.from('kanban_tasks').delete().eq('id', taskId);
      if (error) throw error;
      setTasks(tasks.filter((t) => t.id !== taskId));
    } catch (err: any) {
      alert(`Erro ao excluir tarefa: ${err.message}`);
    }
  };

  // Create Column
  const handleCreateColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newColumnName.trim()) return;

    setSavingColumn(true);
    try {
      const { error } = await supabase.from('kanban_columns').insert({
        owner_id: user.id,
        name: newColumnName.trim(),
        color: newColumnColor,
        position: columns.length,
      });

      if (error) throw error;

      setIsColumnModalOpen(false);
      setNewColumnName('');
      await loadKanbanData();
    } catch (err: any) {
      alert(`Erro ao criar coluna: ${err.message}`);
    } finally {
      setSavingColumn(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Kanban Pessoal
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Organize seu fluxo de trabalho individual. Ações aqui não alteram o status ou SLA dos chamados oficiais.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsColumnModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Nova Coluna
          </Button>
        </div>
      </div>

      {/* Kanban Board Area */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <Clock className="w-8 h-8 animate-spin mx-auto mb-2 text-c3con-gold-500" />
          <p className="text-sm">Carregando seu quadro pessoal...</p>
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-5 overflow-x-auto pb-6 items-start min-h-[calc(100vh-280px)]">
            {columns.map((column) => {
              const columnTasks = tasks
                .filter((t) => t.column_id === column.id)
                .sort((a, b) => a.position - b.position);

              return (
                <div
                  key={column.id}
                  className="w-80 shrink-0 bg-slate-100/90 rounded-2xl border border-slate-200 flex flex-col max-h-[calc(100vh-240px)] shadow-sm"
                >
                  {/* Column Header */}
                  <div className="p-3.5 border-b border-slate-200/80 flex items-center justify-between bg-white/60 rounded-t-2xl">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: column.color || '#64748b' }}
                      />
                      <h3 className="font-semibold text-slate-800 text-sm">
                        {column.name}
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-600 font-medium">
                        {columnTasks.length}
                      </span>
                    </div>

                    <button
                      onClick={() => openNewTaskModal(column.id)}
                      title="Adicionar tarefa nesta coluna"
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Droppable Task List */}
                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`p-3 flex-1 overflow-y-auto space-y-2.5 min-h-[100px] transition-colors rounded-b-2xl ${
                          snapshot.isDraggingOver ? 'bg-c3con-gold-50/50' : ''
                        }`}
                      >
                        {columnTasks.map((task, index) => (
                          <Draggable
                            key={task.id}
                            draggableId={task.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm hover:shadow transition-all group ${
                                  snapshot.isDragging ? 'shadow-lg ring-2 ring-c3con-gold-400 rotate-1' : ''
                                }`}
                              >
                                {/* Header with Action Buttons */}
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="font-semibold text-slate-800 text-xs leading-snug">
                                    {task.title}
                                  </h4>
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => openEditTaskModal(task)}
                                      className="p-1 text-slate-400 hover:text-slate-600 rounded"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteTask(task.id)}
                                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>

                                {/* Description */}
                                {task.description && (
                                  <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                                    {task.description}
                                  </p>
                                )}

                                {/* Ticket Link Pill */}
                                {task.ticket && (
                                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                                    <Link
                                      to={`/app/chamados/${task.ticket.id}`}
                                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-c3con-gold-50 border border-c3con-gold-200 text-c3con-gold-800 text-[10px] font-semibold hover:bg-c3con-gold-100 transition-colors"
                                    >
                                      <Layers className="w-3 h-3 text-c3con-gold-600" />
                                      <span>{task.ticket.protocol}</span>
                                      <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                                    </Link>
                                    <span className="text-[10px] text-slate-400 truncate max-w-[100px]">
                                      {task.ticket.requester_name}
                                    </span>
                                  </div>
                                )}

                                {/* Due Date */}
                                {task.due_date && (
                                  <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                                    <Calendar className="w-3 h-3" />
                                    <span>Entrega: {formatDateShort(task.due_date)}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}

                        {columnTasks.length === 0 && (
                          <div className="p-4 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs">
                            Arraste tarefas aqui ou clique em +
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>

                  {/* Add task quick button at bottom */}
                  <div className="p-2 border-t border-slate-200/60 bg-white/40 rounded-b-2xl">
                    <button
                      onClick={() => openNewTaskModal(column.id)}
                      className="w-full py-1.5 px-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-white/80 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar Cartão
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      )}

      {/* Modal: Add or Edit Task */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title={editingTaskId ? 'Editar Tarefa do Kanban' : 'Nova Tarefa no Kanban'}
      >
        <form onSubmit={handleSaveTask} className="space-y-4">
          <Input
            label="Título da Tarefa"
            placeholder="Ex: Analisar log de erro do docpm ERP"
            required
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Coluna</label>
            <select
              value={taskColumnId}
              onChange={(e) => setTaskColumnId(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-c3con-gold-400"
            >
              {columns.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Vincular a um Chamado da Fila (Opcional)
            </label>
            <select
              value={taskTicketId}
              onChange={(e) => setTaskTicketId(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-c3con-gold-400"
            >
              <option value="">-- Sem vínculo de chamado --</option>
              {ticketsList.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.protocol} — {t.requester_name} ({t.status})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400">
              Serve apenas como referência de contexto. Movimentar a tarefa não altera o chamado.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Descrição / Notas</label>
            <textarea
              rows={3}
              placeholder="Anotações pessoais, passos a executar..."
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-c3con-gold-400 focus:border-transparent transition-colors"
            />
          </div>

          <Input
            label="Data de Vencimento / Meta"
            type="date"
            value={taskDueDate}
            onChange={(e) => setTaskDueDate(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsTaskModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={savingTask}
            >
              {editingTaskId ? 'Salvar Alterações' : 'Criar Tarefa'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Column */}
      <Modal
        isOpen={isColumnModalOpen}
        onClose={() => setIsColumnModalOpen(false)}
        title="Adicionar Nova Coluna ao Kanban"
      >
        <form onSubmit={handleCreateColumn} className="space-y-4">
          <Input
            label="Nome da Coluna"
            placeholder="Ex: Em Revisão de Código, Testes..."
            required
            value={newColumnName}
            onChange={(e) => setNewColumnName(e.target.value)}
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">Cor de Destaque</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={newColumnColor}
                onChange={(e) => setNewColumnColor(e.target.value)}
                className="w-10 h-10 p-1 border border-slate-200 rounded-lg cursor-pointer bg-white"
              />
              <span className="text-xs text-slate-500 font-mono">{newColumnColor}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsColumnModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={savingColumn}
            >
              Criar Coluna
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
