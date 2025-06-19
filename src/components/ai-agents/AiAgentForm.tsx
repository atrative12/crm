import React, { useState } from 'react';
import { Button } from '../ui/Button';

interface AiAgentFormData {
  name: string;
  description: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  isActive: boolean;
  triggerEvents: string[];
}

interface AiAgentFormProps {
  agent?: any;
  onClose: () => void;
  onSave: (data: AiAgentFormData) => void;
}

export const AiAgentForm: React.FC<AiAgentFormProps> = ({ agent, onClose, onSave }) => {
  const [formData, setFormData] = useState<AiAgentFormData>({
    name: agent?.name || '',
    description: agent?.description || '',
    model: agent?.model || 'gpt-3.5-turbo',
    temperature: agent?.temperature || 0.7,
    maxTokens: agent?.maxTokens || 1000,
    systemPrompt: agent?.systemPrompt || '',
    isActive: agent?.isActive || false,
    triggerEvents: agent?.triggerEvents || []
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (name === 'temperature' || name === 'maxTokens') {
      setFormData(prev => ({
        ...prev,
        [name]: Number(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleTriggerEventChange = (event: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      triggerEvents: checked 
        ? [...prev.triggerEvents, event]
        : prev.triggerEvents.filter(e => e !== event)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const modelOptions = [
    { value: 'gpt-4', label: 'GPT-4' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    { value: 'claude-3', label: 'Claude 3' },
    { value: 'gemini-pro', label: 'Gemini Pro' }
  ];

  const triggerEventOptions = [
    'Nova mensagem WhatsApp',
    'Cliente criado',
    'Oportunidade movida',
    'Tarefa vencida',
    'Horário comercial',
    'Fora do horário'
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nome do Agente *
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

        <div className="md:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Descrição
          </label>
          <textarea
            name="description"
            id="description"
            value={formData.description}
            onChange={handleChange}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="model" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Modelo de IA
          </label>
          <select
            name="model"
            id="model"
            value={formData.model}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {modelOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="temperature" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Temperatura (0-1)
          </label>
          <input
            type="number"
            name="temperature"
            id="temperature"
            value={formData.temperature}
            onChange={handleChange}
            min="0"
            max="1"
            step="0.1"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="maxTokens" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Max Tokens
          </label>
          <input
            type="number"
            name="maxTokens"
            id="maxTokens"
            value={formData.maxTokens}
            onChange={handleChange}
            min="100"
            max="4000"
            step="100"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="systemPrompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Prompt do Sistema
          </label>
          <textarea
            name="systemPrompt"
            id="systemPrompt"
            value={formData.systemPrompt}
            onChange={handleChange}
            rows={4}
            placeholder="Defina como o agente deve se comportar..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Eventos de Ativação
          </label>
          <div className="grid grid-cols-2 gap-2">
            {triggerEventOptions.map(event => (
              <label key={event} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.triggerEvents.includes(event)}
                  onChange={(e) => handleTriggerEventChange(event, e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{event}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Ativar agente imediatamente
            </span>
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary">
          {agent ? 'Atualizar' : 'Criar'} Agente
        </Button>
      </div>
    </form>
  );
};