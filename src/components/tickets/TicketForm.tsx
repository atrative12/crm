import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { ApprovedUser, Ticket } from '../../types';

interface TicketFormData {
  title: string;
  description: string;
  type: 'task' | 'objective' | 'training' | 'meeting';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo: string;
  dueDate: string;
  dueTime: string;
  completionNotes: string;
}

interface TicketFormProps {
  ticket?: Ticket | null;
  users: ApprovedUser[];
  currentUser: ApprovedUser | null;
  onClose: () => void;
  onSave: (data: TicketFormData) => void;
}

export const TicketForm: React.FC<TicketFormProps> = ({ 
  ticket, 
  users, 
  currentUser, 
  onClose, 
  onSave 
}) => {
  const [formData, setFormData] = useState<TicketFormData>({
    title: ticket?.title || '',
    description: ticket?.description || '',
    type: ticket?.type || 'task',
    priority: ticket?.priority || 'medium',
    status: ticket?.status || 'open',
    assignedTo: ticket?.assignedTo || '',
    dueDate: ticket?.dueDate || '',
    dueTime: ticket?.dueTime || '',
    completionNotes: ticket?.completionNotes || ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const typeOptions = [
    { value: 'task', label: 'Tarefa' },
    { value: 'objective', label: 'Objetivo' },
    { value: 'training', label: 'Treinamento' },
    { value: 'meeting', label: 'Reunião' }
  ];

  const priorityOptions = [
    { value: 'low', label: 'Baixa' },
    { value: 'medium', label: 'Média' },
    { value: 'high', label: 'Alta' },
    { value: 'urgent', label: 'Urgente' }
  ];

  const statusOptions = [
    { value: 'open', label: 'Aberto' },
    { value: 'in_progress', label: 'Em Andamento' },
    { value: 'completed', label: 'Concluído' },
    { value: 'cancelled', label: 'Cancelado' }
  ];

  // Filter users to show only salespeople for assignment (level 1)
  const availableUsers = users.filter(user => 
    user.userRole?.level === 1 || user.id === ticket?.assignedTo
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Título *
        </label>
        <input
          type="text"
          name="title"
          id="title"
          value={formData.title}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Descrição
        </label>
        <textarea
          name="description"
          id="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tipo
          </label>
          <select
            name="type"
            id="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {typeOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Prioridade
          </label>
          <select
            name="priority"
            id="priority"
            value={formData.priority}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {priorityOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Status
          </label>
          <select
            name="status"
            id="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Atribuir para
        </label>
        <select
          name="assignedTo"
          id="assignedTo"
          value={formData.assignedTo}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="">Selecione um usuário</option>
          {availableUsers.map(user => (
            <option key={user.id} value={user.id}>
              {user.fullName} ({user.userRole?.displayName || 'Usuário'})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Data de Prazo
          </label>
          <input
            type="date"
            name="dueDate"
            id="dueDate"
            value={formData.dueDate}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="dueTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Horário do Prazo
          </label>
          <input
            type="time"
            name="dueTime"
            id="dueTime"
            value={formData.dueTime}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {(formData.status === 'completed' || ticket?.status === 'completed') && (
        <div>
          <label htmlFor="completionNotes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Observações de Conclusão
          </label>
          <textarea
            name="completionNotes"
            id="completionNotes"
            value={formData.completionNotes}
            onChange={handleChange}
            rows={3}
            placeholder="Descreva como a atividade foi concluída..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      )}

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          💡 Dicas para Chamados Eficazes
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• <strong>Tarefa:</strong> Atividades específicas a serem executadas</li>
          <li>• <strong>Objetivo:</strong> Metas de vendas ou performance a alcançar</li>
          <li>• <strong>Treinamento:</strong> Capacitação ou desenvolvimento de habilidades</li>
          <li>• <strong>Reunião:</strong> Encontros de equipe ou com clientes</li>
        </ul>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary">
          {ticket ? 'Atualizar' : 'Criar'} Chamado
        </Button>
      </div>
    </form>
  );
};