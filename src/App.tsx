import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ClipboardList, AlertCircle, CheckCircle2, Clock, FileText, ChevronUp, Zap, Activity, PencilLine, Save, X, AlignLeft, Plus } from 'lucide-react';
import { supabase } from './lib/supabase';
import type { Task } from './types/task';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [noteText, setNoteText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    task: '',
    description: '',
    priority: '1',
    trigger: '',
    status: 'Pendente'
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    try {
      const { data, error } = await supabase
        .from('task_tech')
        .select('*')
        .order('priority', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Erro ao buscar tarefas:', error);
    } finally {
      setLoading(false);
    }
  }

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    try {
      const highestPriority = Math.max(
        ...tasks.map(task => parseInt(task.priority || '0')),
        0
      );
      
      const taskWithPriority = {
        ...newTask,
        priority: (highestPriority + 1).toString()
      };

      const { data, error } = await supabase
        .from('task_tech')
        .insert([taskWithPriority])
        .select();

      if (error) throw error;

      setTasks([...(data || []), ...tasks]);
      setIsModalOpen(false);
      setNewTask({
        task: '',
        description: '',
        priority: '1',
        trigger: '',
        status: 'Pendente'
      });
      await fetchTasks();
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
    }
  }

  async function updateNotes(taskId: number) {
    try {
      const { error } = await supabase
        .from('task_tech')
        .update({ notes: noteText })
        .eq('id', taskId);

      if (error) throw error;

      setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, notes: noteText } : task
      ));
      setEditingNoteId(null);
      setNoteText('');
    } catch (error) {
      console.error('Erro ao atualizar notas:', error);
    }
  }

  function startEditing(task: Task) {
    setEditingNoteId(task.id);
    setNoteText(task.notes || '');
  }

  function cancelEditing() {
    setEditingNoteId(null);
    setNoteText('');
  }

  function getPriorityColor(priority: string | null) {
    const priorityNum = parseInt(priority || '0');
    if (priorityNum >= 7) {
      return 'bg-red-500/20 text-red-400';
    } else if (priorityNum >= 4) {
      return 'bg-primary/20 text-primary';
    } else {
      return 'bg-green-500/20 text-green-400';
    }
  }

  function getStatusColor(status: string | null) {
    switch (status?.toLowerCase()) {
      case 'concluído':
        return 'text-green-400';
      case 'em andamento':
        return 'text-primary';
      case 'pendente':
        return 'text-red-400';
      default:
        return 'text-text-secondary';
    }
  }

  function getStatusIcon(status: string | null) {
    const iconClass = "w-5 h-5";
    switch (status?.toLowerCase()) {
      case 'concluído':
        return <CheckCircle2 className={`${iconClass} text-green-400`} />;
      case 'em andamento':
        return <Clock className={`${iconClass} text-primary`} />;
      case 'pendente':
        return <AlertCircle className={`${iconClass} text-red-400`} />;
      default:
        return <FileText className={`${iconClass} text-text-secondary`} />;
    }
  }

  return (
    <div className="min-h-screen bg-surface text-text">
      <header className="glass-card border-b border-white/10 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img 
                src="https://izmzxqzcsnaykofpcjjh.supabase.co/storage/v1/object/public/alpha//Logomarca%20da%20Alpha.png" 
                alt="Logo Alpha" 
                className="h-12 w-auto"
              />
              <h1 className="text-3xl font-bold highlight-glow">Gestão de Tarefas</h1>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Nova Demanda</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div key={task.id} className="glass-card p-6 transition-all duration-300 hover:shadow-glow">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(task.status)}
                      <h2 className="text-xl font-medium text-text">
                        {task.task}
                      </h2>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(task.priority)}`}>
                        #{task.priority}
                      </span>
                    </div>
                    
                    {task.description && (
                      <div className="mt-3 flex items-start space-x-2 text-text-secondary">
                        <AlignLeft className="w-4 h-4 mt-1 flex-shrink-0" />
                        <p className="text-sm leading-relaxed">{task.description}</p>
                      </div>
                    )}

                    <div className="mt-4">
                      {editingNoteId === task.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            className="w-full px-3 py-2 bg-surface-light bg-opacity-50 backdrop-blur-sm border border-white/10 rounded-lg text-text resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                            rows={3}
                            placeholder="Adicione suas anotações aqui..."
                          />
                          <div className="flex space-x-2">
                            <button
                              onClick={() => updateNotes(task.id)}
                              className="flex items-center space-x-1 px-3 py-1 bg-primary/20 text-primary rounded-md hover:bg-primary/30 transition-colors"
                            >
                              <Save className="w-4 h-4" />
                              <span>Salvar</span>
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="flex items-center space-x-1 px-3 py-1 bg-red-500/20 text-red-400 rounded-md hover:bg-red-500/30 transition-colors"
                            >
                              <X className="w-4 h-4" />
                              <span>Cancelar</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="group relative">
                          <p className="text-text-secondary">
                            {task.notes || 'Nenhuma anotação adicionada'}
                          </p>
                          <button
                            onClick={() => startEditing(task)}
                            className="absolute -right-2 -top-2 p-1 bg-surface-light bg-opacity-50 backdrop-blur-sm border border-white/10 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <PencilLine className="w-4 h-4 text-primary" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Zap className="w-4 h-4 text-primary" />
                        <span className="text-sm text-text-secondary">Gatilho:</span>
                        <span className="text-sm font-medium">{task.trigger || 'N/A'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Activity className="w-4 h-4 text-primary" />
                        <span className="text-sm text-text-secondary">Status:</span>
                        <span className={`text-sm font-medium ${getStatusColor(task.status)}`}>
                          {task.status || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-card w-full max-w-lg p-6 m-4">
            <h2 className="text-2xl font-bold mb-4">Criar Nova Demanda</h2>
            <form onSubmit={createTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Título da Tarefa
                </label>
                <input
                  type="text"
                  value={newTask.task}
                  onChange={(e) => setNewTask({ ...newTask, task: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-light bg-opacity-50 backdrop-blur-sm border border-white/10 rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Descrição
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-light bg-opacity-50 backdrop-blur-sm border border-white/10 rounded-lg text-text resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Status
                </label>
                <select
                  value={newTask.status}
                  onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-light bg-opacity-50 backdrop-blur-sm border border-white/10 rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="Pendente">Pendente</option>
                  <option value="Em Andamento">Em Andamento</option>
                  <option value="Concluído">Concluído</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Gatilho
                </label>
                <input
                  type="text"
                  value={newTask.trigger}
                  onChange={(e) => setNewTask({ ...newTask, trigger: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-light bg-opacity-50 backdrop-blur-sm border border-white/10 rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-surface-light bg-opacity-50 text-text-secondary rounded-lg hover:bg-surface-light hover:bg-opacity-70 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors"
                >
                  Criar Demanda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;