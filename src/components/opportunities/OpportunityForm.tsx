import React, { useState } from 'react';
import { Button } from '../ui/Button';

interface OpportunityFormData {
  name: string;
  clientName: string;
  value: number;
  status: string;
  nextAction: string;
  description: string;
  expectedCloseDate?: string;
}

interface OpportunityFormProps {
  opportunity?: any;
  onClose: () => void;
  onSave: (data: OpportunityFormData) => void;
}

export const OpportunityForm: React.FC<OpportunityFormProps> = ({ opportunity, onClose, onSave }) => {
  const [formData, setFormData] = useState<OpportunityFormData>({
    name: opportunity?.name || '',
    clientName: opportunity?.clientName || '',
    value: opportunity?.value || 0,
    status: opportunity?.status || 'novo-lead',
    nextAction: opportunity?.nextAction || '',
    description: opportunity?.description || '',
    expectedCloseDate: opportunity?.expectedCloseDate || ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'value' ? Number(value) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const statusOptions = [
    { value: 'novo-lead', label: 'Novo Lead' },
    { value: 'contato-inicial', label: 'Contato Inicial' },
    { value: 'qualificacao', label: 'Qualificação' },
    { value: 'proposta', label: 'Proposta' },
    { value: 'negociacao', label: 'Negociação' },
    { value: 'fechado-ganhou', label: 'Fechado (Ganhou)' },
    { value: 'fechado-perdeu', label: 'Fechado (Perdeu)' }
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nome da Oportunidade *
          </label>
          <input
            type="text"
            name="name"
            id="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nome do Cliente *
          </label>
          <input
            type="text"
            name="clientName"
            id="clientName"
            value={formData.clientName}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="value" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Valor (R$) *
          </label>
          <input
            type="number"
            name="value"
            id="value"
            value={formData.value}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
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

        <div>
          <label htmlFor="expectedCloseDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Data Prevista de Fechamento
          </label>
          <input
            type="date"
            name="expectedCloseDate"
            id="expectedCloseDate"
            value={formData.expectedCloseDate}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="nextAction" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Próxima Ação
          </label>
          <input
            type="text"
            name="nextAction"
            id="nextAction"
            value={formData.nextAction}
            onChange={handleChange}
            placeholder="Ex: Enviar proposta, Agendar reunião..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Descrição
          </label>
          <textarea
            name="description"
            id="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary">
          {opportunity ? 'Atualizar' : 'Criar'} Oportunidade
        </Button>
      </div>
    </form>
  );
};