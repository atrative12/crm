import React from 'react';
import { Client } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ArrowLeft, Mail, Phone, MapPin, DollarSign, Edit, Trash2 } from 'lucide-react';

interface ClientDetailsProps {
  client: Client;
  onBack: () => void;
}

export const ClientDetails: React.FC<ClientDetailsProps> = ({ client, onBack }) => {
  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'Fechado (Ganhou)': 'bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-400',
      'Fechado (Perdeu)': 'bg-danger-100 text-danger-800 dark:bg-danger-900/20 dark:text-danger-400',
      'Novo': 'bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-400',
      'Negociação': 'bg-warning-100 text-warning-800 dark:bg-warning-900/20 dark:text-warning-400',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <Button onClick={onBack} variant="ghost" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para a lista de clientes
        </Button>
        <div className="flex justify-between items-start">
            <div>
                <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">{client.nomeCompleto}</h2>
                <span className={`mt-2 inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(client.status)}`}>
                    {client.status}
                </span>
            </div>
            <div className="flex gap-2">
                 {/* Botões de ação podem ser adicionados aqui no futuro */}
            </div>
        </div>
      </div>
      
      <Card>
        <div className="border-t border-gray-200 dark:border-gray-700">
          <dl>
            <div className="bg-gray-50 dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Nome completo</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 sm:mt-0 sm:col-span-2">{client.nomeCompleto}</dd>
            </div>
            <div className="bg-white dark:bg-gray-800/50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 sm:mt-0 sm:col-span-2">{client.email}</dd>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Telefone</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 sm:mt-0 sm:col-span-2">{client.telefone}</dd>
            </div>

            {/* CAMPO DE CIDADE ADICIONADO */}
            <div className="bg-white dark:bg-gray-800/50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Cidade</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 sm:mt-0 sm:col-span-2">{client.cidade || 'Não informado'}</dd>
            </div>

            {/* CAMPO DE ESTADO ADICIONADO */}
            <div className="bg-gray-50 dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Estado</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 sm:mt-0 sm:col-span-2">{client.estado || 'Não informado'}</dd>
            </div>

            <div className="bg-white dark:bg-gray-800/50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Origem</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 sm:mt-0 sm:col-span-2">{client.origem}</dd>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Valor Potencial</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 sm:mt-0 sm:col-span-2">R$ {client.valorPotencial?.toLocaleString() || '0'}</dd>
            </div>
            <div className="bg-white dark:bg-gray-800/50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Observações</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 sm:mt-0 sm:col-span-2 whitespace-pre-wrap">{client.observacoes || 'Nenhuma'}</dd>
            </div>
          </dl>
        </div>
      </Card>
    </div>
  );
};