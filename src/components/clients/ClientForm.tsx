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

// CORREÇÃO: Adicionado tipo para a propriedade client
interface ClientFormProps {
  client: Client | null;
  onClose: () => void;
  onSave: (data: Omit<Client, 'id' | 'createdAt' | 'createdBy'>) => void;
}

export const ClientForm: React.FC<ClientFormProps> = ({ client, onClose, onSave }) => {
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
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'valorPotencial' ? parseFloat(value) : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const statusOptions = ['Novo', 'Em Contato', 'Qualificado', 'Proposta Enviada', 'Negociação', 'Fechado (Ganhou)', 'Fechado (Perdeu)', 'Inativo'];
  const originOptions = ['Indicação', 'Anúncio Online', 'Mídias Sociais', 'Evento', 'Site', 'Prospecção Ativa', 'Outros'];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
          <label htmlFor="nomeCompleto" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nome Completo *</label>
          <input type="text" name="nomeCompleto" value={formData.nomeCompleto} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
        </div>
        <div>
          <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Telefone</label>
          <input type="tel" name="telefone" value={formData.telefone} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="estado" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Estado</label>
          <select name="estado" value={formData.estado} onChange={handleStateChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent">
            <option value="">Selecione um estado</option>
            {states.map(state => (<option key={state} value={state}>{state}</option>))}
          </select>
        </div>
        <div>
          <label htmlFor="cidade" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cidade</label>
          <select name="cidade" value={formData.cidade} onChange={handleChange} disabled={!formData.estado} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-200 dark:disabled:bg-gray-800">
            <option value="">{formData.estado ? 'Selecione uma cidade' : 'Selecione um estado primeiro'}</option>
            {availableCities.map(city => (<option key={city} value={city}>{city}</option>))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="origem" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Origem</label>
          <select name="origem" value={formData.origem} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent">
            <option value="">Selecione</option>
            {originOptions.map(option => (<option key={option} value={option}>{option}</option>))}
          </select>
        </div>
        <div>
          <label htmlFor="valorPotencial" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Valor Potencial (R$)</label>
          <input type="number" name="valorPotencial" value={formData.valorPotencial} onChange={handleChange} min="0" step="0.01" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
        </div>
      </div>
      
      <div>
        <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Observações</label>
        <textarea name="observacoes" value={formData.observacoes} onChange={handleChange} rows={3} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button type="submit" variant="primary">{client ? 'Atualizar' : 'Criar'} Cliente</Button>
      </div>
    </form>
  );
};