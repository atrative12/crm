import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, Edit, Trash2, Phone, Mail, RefreshCw } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { ClientForm } from './ClientForm';
import { ClientDetails } from './ClientDetails';
import { useData } from '../../contexts/DataContext';
import { Client } from '../../types';

interface ClientsListProps {
  currentUser: string;
}

export const ClientsList: React.FC<ClientsListProps> = ({ currentUser }) => {
  const { clients, addClient, updateClient, deleteClient, addOpportunity, isLoading, error, refreshData } = useData();
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [detailedClient, setDetailedClient] = useState<Client | null>(null);

  // Refresh data when component mounts or currentUser changes
  useEffect(() => {
    console.log('🔄 ClientsList: Usuário mudou para:', currentUser);
    refreshData();
  }, [currentUser, refreshData]);

  const handleAddClient = () => {
    setSelectedClient(null);
    setIsClientModalOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setIsClientModalOpen(true);
  };

  const handleDeleteClient = (client: Client) => {
    setClientToDelete(client);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (clientToDelete) {
      try {
        await deleteClient(clientToDelete.id);
        setClientToDelete(null);
        setIsDeleteConfirmOpen(false);
      } catch (error) {
        console.error('Erro ao excluir cliente:', error);
      }
    }
  };

  const handleSaveClient = async (formData: Omit<Client, 'id' | 'createdAt' | 'createdBy'>) => {
    try {
      if (selectedClient) {
        // Update existing client
        await updateClient({
          ...selectedClient,
          ...formData,
        });
      } else {
        // Create new client
        const clientDataWithCreator = { ...formData, createdBy: currentUser };
        await addClient(clientDataWithCreator);

        // Create opportunity for new client
        const newOpportunityData = {
          name: `Oportunidade - ${formData.nomeCompleto}`,
          clientName: formData.nomeCompleto,
          value: formData.valorPotencial || 0,
          status: 'novo-lead',
          nextAction: "Realizar primeiro contato",
          description: `Oportunidade gerada do cadastro do cliente por ${currentUser}.`,
        };
        await addOpportunity(newOpportunityData);
      }
      
      setIsClientModalOpen(false);
      setSelectedClient(null);
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
    }
  };

  const handleRefresh = () => {
    refreshData();
  };

  const filteredClients = clients.filter(client => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = client.nomeCompleto.toLowerCase().includes(searchLower) ||
                         (client.email && client.email.toLowerCase().includes(searchLower));
    const matchesFilter = filterStatus === 'all' || client.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const statusOptions = ['Novo', 'Em Contato', 'Qualificado', 'Proposta Enviada', 'Negociação', 'Fechado (Ganhou)', 'Fechado (Perdeu)', 'Inativo'];

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'Fechado (Ganhou)': 'bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-400',
      'Fechado (Perdeu)': 'bg-danger-100 text-danger-800 dark:bg-danger-900/20 dark:text-danger-400',
      'Novo': 'bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-400',
      'Negociação': 'bg-warning-100 text-warning-800 dark:bg-warning-900/20 dark:text-warning-400',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  if (detailedClient) {
    return <ClientDetails client={detailedClient} onBack={() => setDetailedClient(null)} />;
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">Clientes</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerencie seus clientes e leads
          </p>
          <div className="mt-2 text-sm text-blue-600 dark:text-blue-400">
            👤 Usuário: <strong>{currentUser}</strong> | 📊 Total: <strong>{clients.length}</strong> clientes
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleRefresh} 
            variant="ghost" 
            className="flex items-center gap-2"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button onClick={handleAddClient} className="flex items-center gap-2 w-full sm:w-auto">
            <Plus className="w-4 h-4" />
            Novo Cliente
          </Button>
        </div>
      </motion.div>

      {error && (
        <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg p-4">
          <p className="text-danger-800 dark:text-danger-200 text-sm">
            ⚠️ {error}
          </p>
        </div>
      )}

      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Buscar clientes..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)} 
              className="w-full md:w-auto px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">Todos os Status</option>
              {statusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Carregando clientes...</span>
        </div>
      ) : (
        <AnimatePresence>
          {filteredClients.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Card className="text-center py-12">
                <Plus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Nenhum cliente encontrado
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {searchTerm || filterStatus !== 'all' 
                    ? 'Tente ajustar os filtros de busca' 
                    : 'Comece adicionando seu primeiro cliente'
                  }
                </p>
                <Button onClick={handleAddClient}>
                  Adicionar Primeiro Cliente
                </Button>
              </Card>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
              {filteredClients.map((client, index) => (
                <motion.div 
                  key={client.id} 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -20 }} 
                  transition={{ duration: 0.2, delay: index * 0.05 }} 
                  onClick={() => setDetailedClient(client)}
                >
                  <Card hover className="p-6 cursor-pointer">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1 truncate">
                          {client.nomeCompleto}
                        </h3>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(client.status)}`}>
                          {client.status}
                        </span>
                        {client.createdBy && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Criado por: {client.createdBy}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-shrink-0 gap-1">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleEditClient(client); }} 
                          className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteClient(client); }} 
                          className="p-2 text-gray-400 hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Mail className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{client.email || 'Não informado'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        <span>{client.telefone || 'Não informado'}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Valor Potencial</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          R$ {client.valorPotencial?.toLocaleString() || '0'}
                        </span>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      )}

      <Modal isOpen={isClientModalOpen} onClose={() => setIsClientModalOpen(false)} title={selectedClient ? "Editar Cliente" : "Novo Cliente"}>
        <ClientForm client={selectedClient} onClose={() => setIsClientModalOpen(false)} onSave={handleSaveClient} />
      </Modal>

      <Modal isOpen={isDeleteConfirmOpen} onClose={() => setIsDeleteConfirmOpen(false)} title="Confirmar Exclusão" size="sm">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-danger-100 dark:bg-danger-900/20 mb-4">
            <Trash2 className="h-6 w-6 text-danger-600 dark:text-danger-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Excluir Cliente
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Tem certeza que deseja excluir o cliente "{clientToDelete?.nomeCompleto}"? 
            Esta ação não pode ser desfeita.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="ghost" onClick={() => setIsDeleteConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete}>
              Excluir
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};