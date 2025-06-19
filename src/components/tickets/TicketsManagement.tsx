import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Flag, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  MessageSquare,
  Edit,
  Trash2
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { TicketForm } from './TicketForm';
import { TicketDetails } from './TicketDetails';
import { supabase } from '../../lib/supabase';
import { Ticket, ApprovedUser } from '../../types';

interface TicketsManagementProps {
  currentUser: string;
}

export const TicketsManagement: React.FC<TicketsManagementProps> = ({ currentUser }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<ApprovedUser[]>([]);
  const [currentUserData, setCurrentUserData] = useState<ApprovedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Load current user data
      const { data: userData, error: userError } = await supabase
        .from('approved_users')
        .select(`
          *,
          user_roles (
            id,
            name,
            display_name,
            level,
            permissions
          )
        `)
        .eq('username', currentUser)
        .single();

      if (userError) throw userError;

      const transformedCurrentUser: ApprovedUser = {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        fullName: userData.full_name,
        role: userData.role,
        roleId: userData.role_id,
        userRole: userData.user_roles ? {
          id: userData.user_roles.id,
          name: userData.user_roles.name,
          displayName: userData.user_roles.display_name,
          level: userData.user_roles.level,
          permissions: userData.user_roles.permissions || [],
          createdAt: ''
        } : undefined,
        isActive: userData.is_active,
        createdAt: userData.created_at,
        lastLogin: userData.last_login
      };

      setCurrentUserData(transformedCurrentUser);

      // Load all users for assignment
      const { data: usersData, error: usersError } = await supabase
        .from('approved_users')
        .select(`
          *,
          user_roles (
            id,
            name,
            display_name,
            level
          )
        `)
        .eq('is_active', true)
        .order('full_name');

      if (usersError) throw usersError;

      const transformedUsers: ApprovedUser[] = (usersData || []).map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        roleId: user.role_id,
        userRole: user.user_roles ? {
          id: user.user_roles.id,
          name: user.user_roles.name,
          displayName: user.user_roles.display_name,
          level: user.user_roles.level,
          permissions: [],
          createdAt: ''
        } : undefined,
        isActive: user.is_active,
        createdAt: user.created_at
      }));

      setUsers(transformedUsers);

      // Load tickets based on user role
      let ticketsQuery = supabase
        .from('tickets')
        .select(`
          *,
          assigned_to_user:assigned_to (
            id,
            username,
            full_name,
            user_roles (display_name)
          ),
          assigned_by_user:assigned_by (
            id,
            username,
            full_name,
            user_roles (display_name)
          )
        `)
        .order('created_at', { ascending: false });

      // If user is not admin/manager, only show their tickets
      if (transformedCurrentUser.userRole?.level && transformedCurrentUser.userRole.level < 2) {
        ticketsQuery = ticketsQuery.eq('assigned_to', transformedCurrentUser.id);
      }

      const { data: ticketsData, error: ticketsError } = await ticketsQuery;

      if (ticketsError) throw ticketsError;

      const transformedTickets: Ticket[] = (ticketsData || []).map(ticket => ({
        id: ticket.id,
        title: ticket.title,
        description: ticket.description,
        type: ticket.type,
        priority: ticket.priority,
        status: ticket.status,
        assignedTo: ticket.assigned_to,
        assignedBy: ticket.assigned_by,
        assignedToUser: ticket.assigned_to_user ? {
          id: ticket.assigned_to_user.id,
          username: ticket.assigned_to_user.username,
          fullName: ticket.assigned_to_user.full_name,
          email: '',
          role: 'user',
          isActive: true,
          createdAt: '',
          userRole: ticket.assigned_to_user.user_roles ? {
            displayName: ticket.assigned_to_user.user_roles.display_name,
            id: '',
            name: '',
            level: 1,
            permissions: [],
            createdAt: ''
          } : undefined
        } : undefined,
        assignedByUser: ticket.assigned_by_user ? {
          id: ticket.assigned_by_user.id,
          username: ticket.assigned_by_user.username,
          fullName: ticket.assigned_by_user.full_name,
          email: '',
          role: 'user',
          isActive: true,
          createdAt: '',
          userRole: ticket.assigned_by_user.user_roles ? {
            displayName: ticket.assigned_by_user.user_roles.display_name,
            id: '',
            name: '',
            level: 1,
            permissions: [],
            createdAt: ''
          } : undefined
        } : undefined,
        dueDate: ticket.due_date,
        dueTime: ticket.due_time,
        completionNotes: ticket.completion_notes,
        completedAt: ticket.completed_at,
        createdAt: ticket.created_at,
        updatedAt: ticket.updated_at
      }));

      setTickets(transformedTickets);

    } catch (error) {
      console.error('Error loading tickets data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTicket = () => {
    setSelectedTicket(null);
    setIsTicketModalOpen(true);
  };

  const handleEditTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsTicketModalOpen(true);
  };

  const handleViewTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsDetailsModalOpen(true);
  };

  const handleSaveTicket = async (formData: any) => {
    try {
      if (selectedTicket) {
        // Update existing ticket
        const { error } = await supabase
          .from('tickets')
          .update({
            title: formData.title,
            description: formData.description,
            type: formData.type,
            priority: formData.priority,
            status: formData.status,
            assigned_to: formData.assignedTo || null,
            due_date: formData.dueDate || null,
            due_time: formData.dueTime || null,
            completion_notes: formData.completionNotes || null,
            completed_at: formData.status === 'completed' ? new Date().toISOString() : null
          })
          .eq('id', selectedTicket.id);

        if (error) throw error;
      } else {
        // Create new ticket
        const { error } = await supabase
          .from('tickets')
          .insert([{
            title: formData.title,
            description: formData.description,
            type: formData.type,
            priority: formData.priority,
            status: formData.status,
            assigned_to: formData.assignedTo || null,
            assigned_by: currentUserData?.id,
            due_date: formData.dueDate || null,
            due_time: formData.dueTime || null
          }]);

        if (error) throw error;
      }

      await loadData();
      setIsTicketModalOpen(false);
    } catch (error) {
      console.error('Error saving ticket:', error);
      alert('Erro ao salvar chamado. Tente novamente.');
    }
  };

  const canManageTickets = () => {
    return currentUserData?.userRole?.level && currentUserData.userRole.level >= 2;
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-400';
      case 'in_progress': return 'bg-warning-100 text-warning-800 dark:bg-warning-900/20 dark:text-warning-400';
      case 'cancelled': return 'bg-danger-100 text-danger-800 dark:bg-danger-900/20 dark:text-danger-400';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default: return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'in_progress': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'task': return 'Tarefa';
      case 'objective': return 'Objetivo';
      case 'training': return 'Treinamento';
      case 'meeting': return 'Reunião';
      default: return type;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Aberto';
      case 'in_progress': return 'Em Andamento';
      case 'completed': return 'Concluído';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Urgente';
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      case 'low': return 'Baixa';
      default: return priority;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Chamados e Atividades
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {canManageTickets() 
              ? 'Gerencie atividades e objetivos para sua equipe'
              : 'Suas atividades e objetivos atribuídos'
            }
          </p>
          <div className="mt-2 text-sm text-blue-600 dark:text-blue-400">
            👤 {currentUserData?.fullName} ({currentUserData?.userRole?.displayName}) | 
            📊 Total: <strong>{tickets.length}</strong> chamados
          </div>
        </div>
        {canManageTickets() && (
          <Button onClick={handleAddTicket} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Novo Chamado
          </Button>
        )}
      </motion.div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar chamados..."
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
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">Todos os Status</option>
              <option value="open">Aberto</option>
              <option value="in_progress">Em Andamento</option>
              <option value="completed">Concluído</option>
              <option value="cancelled">Cancelado</option>
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">Todas as Prioridades</option>
              <option value="urgent">Urgente</option>
              <option value="high">Alta</option>
              <option value="medium">Média</option>
              <option value="low">Baixa</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Tickets List */}
      <AnimatePresence>
        {filteredTickets.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Nenhum chamado encontrado
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchTerm || filterStatus !== 'all' || filterPriority !== 'all'
                  ? 'Tente ajustar os filtros de busca'
                  : canManageTickets() 
                    ? 'Comece criando o primeiro chamado para sua equipe'
                    : 'Nenhuma atividade foi atribuída a você ainda'
                }
              </p>
              {canManageTickets() && (
                <Button onClick={handleAddTicket}>
                  Criar Primeiro Chamado
                </Button>
              )}
            </Card>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredTickets.map((ticket, index) => (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card hover className="p-6 cursor-pointer" onClick={() => handleViewTicket(ticket)}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 truncate">
                        {ticket.title}
                      </h3>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(ticket.status)}`}>
                          {getStatusIcon(ticket.status)}
                          {getStatusLabel(ticket.status)}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(ticket.priority)}`}>
                          <Flag className="w-3 h-3 mr-1" />
                          {getPriorityLabel(ticket.priority)}
                        </span>
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                          {getTypeLabel(ticket.type)}
                        </span>
                      </div>
                    </div>
                    {canManageTickets() && (
                      <div className="flex gap-1 ml-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTicket(ticket);
                          }}
                          className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {ticket.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                      {ticket.description}
                    </p>
                  )}

                  <div className="space-y-3">
                    {ticket.assignedToUser && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <User className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">
                          {ticket.assignedToUser.fullName}
                          {ticket.assignedToUser.userRole && (
                            <span className="text-xs text-gray-500 ml-1">
                              ({ticket.assignedToUser.userRole.displayName})
                            </span>
                          )}
                        </span>
                      </div>
                    )}

                    {ticket.dueDate && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span>
                          Prazo: {new Date(ticket.dueDate).toLocaleDateString('pt-BR')}
                          {ticket.dueTime && ` às ${ticket.dueTime}`}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Criado em {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                      {ticket.assignedByUser && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          por {ticket.assignedByUser.fullName}
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <Modal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        title={selectedTicket ? "Editar Chamado" : "Novo Chamado"}
        size="lg"
      >
        <TicketForm
          ticket={selectedTicket}
          users={users}
          currentUser={currentUserData}
          onClose={() => setIsTicketModalOpen(false)}
          onSave={handleSaveTicket}
        />
      </Modal>

      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        title="Detalhes do Chamado"
        size="lg"
      >
        {selectedTicket && (
          <TicketDetails
            ticket={selectedTicket}
            currentUser={currentUserData}
            onClose={() => setIsDetailsModalOpen(false)}
            onUpdate={loadData}
          />
        )}
      </Modal>
    </div>
  );
};