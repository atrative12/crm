import React, { useState, useEffect, useMemo } from 'react';
import { Client } from '../../types';
import { Button } from '../ui/Button';
import citiesData from '../../utils/brazil-cities.json';

// Objeto para mapear o código da UF para a sigla
const codigoUfParaSigla: { [key: number]: string } = {
    11: 'RO', 12: 'AC', 13: 'AM', 14: 'RR', 15: 'PA', 16: 'AP', 17: 'TO',
    21: 'MA', 22: 'PI', 23: 'CE', 24: 'RN', 25: 'PB', 26: 'PE', 27: 'AL', 28: 'SE', 29: 'BA',
    31: 'MG', 32: 'ES', 33: 'RJ', 35: 'SP',
    41: 'PR', 42: 'SC', 43: 'RS',
    50: 'MS', 51: 'MT', 52: 'GO', 53: 'DF'
};

interface ClientFormProps {
  client: Client | null;
  onClose: () => void;
  onSave: (data: Omit<Client, 'id' | 'createdAt' | 'createdBy'>) => void;
  isLoading?: boolean;
}

export const ClientForm: React.FC<ClientFormProps> = ({ client, onClose, onSave, isLoading = false }) => {
  const [formData, setFormData] = useState({
    nomeCompleto: client?.nomeCompleto || '',
    email: client?.email || '',
    telefone: client?.telefone || '',
    origem: client?.origem || '',
    status: client?.status || 'Novo',
    valorPotencial: client?.valorPotencial || 0,
    observacoes: client?.observacoes || '',
    cidade: client?.cidade || '',
    estado: client?.estado || '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const states = useMemo(() => {
    return Object.values(codigoUfParaSigla).sort();
  }, []);

  const [availableCities, setAvailableCities] = useState<string[]>([]);

  useEffect(() => {
    if (client) {
        setFormData({
            nomeCompleto: client.nomeCompleto || '',
            email: client.email || '',
            telefone: client.telefone || '',
            origem: client.origem || '',
            status: client.status || 'Novo',
            valorPotencial: client.valorPotencial || 0,
            observacoes: client.observacoes || '',
            cidade: client.cidade || '',
            estado: client.estado || '',
        });
    }
  }, [client]);

  useEffect(() => {
    if (formData.estado) {
      const ufCode = Object.keys(codigoUfParaSigla).find(key => codigoUfParaSigla[parseInt(key)] === formData.estado);
      
      if (ufCode) {
        const citiesInState = citiesData
          .filter(city => city.codigo_uf === parseInt(ufCode))
          .map(city => city.nome)
          .sort();
        setAvailableCities(citiesInState);
      }
    } else {
      setAvailableCities([]);
    }
  }, [formData.estado]);
  
  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newState = e.target.value;
    setFormData(prev => ({
      ...prev,
      estado: newState,
      cidade: ''
    }));
    // Clear city error when state changes
    if (errors.cidade) {
      setErrors(prev => ({ ...prev, cidade: '' }));
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'valorPotencial' ? parseFloat(value) || 0 : value 
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.nomeCompleto.trim()) {
      newErrors.nomeCompleto = 'Nome completo é obrigatório';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (formData.telefone && formData.telefone.length < 10) {
      newErrors.telefone = 'Telefone deve ter pelo menos 10 dígitos';
    }

    if (formData.valorPotencial < 0) {
      newErrors.valorPotencial = 'Valor não pode ser negativo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    console.log('📝 Enviando dados do formulário:', formData);
    onSave(formData);
  };

  const statusOptions = ['Novo', 'Em Contato', 'Qualificado', 'Proposta Enviada', 'Negociação', 'Fechado (Ganhou)', 'Fechado (Perdeu)', 'Inativo'];
  const originOptions = ['Indicação', 'Anúncio Online', 'Mídias Sociais', 'Evento', 'Site', 'Prospecção Ativa', 'Outros'];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="nomeCompleto" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Nome Completo *
        </label>
        <input 
          type="text" 
          name="nomeCompleto" 
          id="nomeCompleto"
          value={formData.nomeCompleto} 
          onChange={handleChange} 
          required 
          disabled={isLoading}
          className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${
            errors.nomeCompleto ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
          }`}
        />
        {errors.nomeCompleto && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.nomeCompleto}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Email
          </label>
          <input 
            type="email" 
            name="email" 
            id="email"
            value={formData.email} 
            onChange={handleChange} 
            disabled={isLoading}
            className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${
              errors.email ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
            }`}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
          )}
        </div>
        <div>
          <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Telefone
          </label>
          <input 
            type="tel" 
            name="telefone" 
            id="telefone"
            value={formData.telefone} 
            onChange={handleChange} 
            disabled={isLoading}
            placeholder="(11) 99999-9999"
            className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${
              errors.telefone ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
            }`}
          />
          {errors.telefone && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.telefone}</p>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="estado" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Estado
          </label>
          <select 
            name="estado" 
            id="estado"
            value={formData.estado} 
            onChange={handleStateChange} 
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">Selecione um estado</option>
            {states.map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="cidade" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Cidade
          </label>
          <select 
            name="cidade" 
            id="cidade"
            value={formData.cidade} 
            onChange={handleChange} 
            disabled={!formData.estado || isLoading}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">{formData.estado ? 'Selecione uma cidade' : 'Selecione um estado primeiro'}</option>
            {availableCities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="origem" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Origem
          </label>
          <select 
            name="origem" 
            id="origem"
            value={formData.origem} 
            onChange={handleChange} 
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">Selecione</option>
            {originOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="valorPotencial" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Valor Potencial (R$)
          </label>
          <input 
            type="number" 
            name="valorPotencial" 
            id="valorPotencial"
            value={formData.valorPotencial} 
            onChange={handleChange} 
            min="0" 
            step="0.01" 
            disabled={isLoading}
            className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${
              errors.valorPotencial ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'
            }`}
          />
          {errors.valorPotencial && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.valorPotencial}</p>
          )}
        </div>
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
          disabled={isLoading}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {statusOptions.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>
      
      <div>
        <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Observações
        </label>
        <textarea 
          name="observacoes" 
          id="observacoes"
          value={formData.observacoes} 
          onChange={handleChange} 
          rows={3} 
          disabled={isLoading}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {isLoading && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Salvando cliente... Por favor, aguarde.
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button 
          variant="ghost" 
          onClick={onClose}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          variant="primary"
          disabled={isLoading}
          isLoading={isLoading}
        >
          {isLoading ? 'Salvando...' : (client ? 'Atualizar' : 'Criar')} Cliente
        </Button>
      </div>
    </form>
  );
};