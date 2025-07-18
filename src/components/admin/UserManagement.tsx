import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserCheck, UserX, Clock, Mail, CheckCircle, XCircle, Eye, Settings, Shield, Trash2, Edit } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { UserPermissions } from './UserPermissions';
import { UserRoleManagement } from './UserRoleManagement';
import { supabase } from '../../lib/supabase';
import { UserRegistration, ApprovedUser } from '../../types';

interface UserManagementProps {
  currentUser: string;
}

export const UserManagement: React.FC<UserManagementProps> = ({ currentUser }) => {
  const [registrations, setRegistrations] = useState<UserRegistration[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<ApprovedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRegistration, setSelectedRegistration] = useState<UserRegistration | null>(null);
  const [selectedUser, setSelectedUser] = useState<ApprovedUser | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isDeleteRegistrationModalOpen, setIsDeleteRegistrationModalOpen] = useState(false);
  const [registrationToDelete, setRegistrationToDelete] = useState<UserRegistration | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);

      console.log('🔄 Carregando dados de usuários...');

      // Load pending registrations
      const { data: registrationsData, error: regError } = await supabase
        .from('user_registrations')
        .select('*')
        .order('requested_at', { ascending: false });

      if (regError) {
        console.error('❌ Erro ao carregar registrations:', regError);
        throw regError;
      }

      console.log('✅ Registrations carregadas:', registrationsData?.length || 0);

      const transformedRegistrations: UserRegistration[] = (registrationsData || []).map(reg => ({
        id: reg.id,
        username: reg.username,
        email: reg.email,
        fullName: reg.full_name,
        passwordHash: reg.password_hash,
        status: reg.status,
        requestedAt: reg.requested_at,
        approvedAt: reg.approved_at,
        approvedBy: reg.approved_by,
        rejectionReason: reg.rejection_reason
      }));

      setRegistrations(transformedRegistrations);

      // Load approved users with their roles
      const { data: usersData, error: usersError } = await supabase
        .from('approved_users')
        .select(`
          *,
          user_roles (
            id,
            name,
            display_name,
            description,
            level,
            permissions
          )
        `)
        .order('created_at', { ascending: false });

      if (usersError) {
        console.error('❌ Erro ao carregar approved_users:', usersError);
        throw usersError;
      }

      console.log('✅ Approved users carregados:', usersData?.length || 0);

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
          description: user.user_roles.description,
          level: user.user_roles.level,
          permissions: user.user_roles.permissions || [],
          createdAt: ''
        } : undefined,
        isActive: user.is_active,
        createdAt: user.created_at,
        lastLogin: user.last_login
      }));

      setApprovedUsers(transformedUsers);

    } catch (error: any) {
      console.error('❌ Erro geral ao carregar dados:', error);
      alert(`Erro ao carregar dados: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveUser = async (registration: UserRegistration) => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      console.log('🔄 Iniciando aprovação via RPC:', registration.username);
      console.log('👤 Administrador logado:', currentUser);

      // Usar a função RPC para aprovar o usuário
      const { data, error } = await supabase.rpc('approve_user_registration', {
        p_registration_id: registration.id,
        p_approved_by: currentUser
      });

      if (error) {
        console.error('❌ Erro na função RPC:', error);
        throw new Error(`Erro na aprovação: ${error.message}`);
      }

      console.log('📋 Resultado da função RPC:', data);

      if (!data.success) {
        throw new Error(data.error || 'Erro desconhecido na aprovação');
      }

      console.log('✅ Aprovação concluída com sucesso via RPC');

      // Recarregar dados
      await loadData();
      setIsApprovalModalOpen(false);
      setSelectedRegistration(null);

      alert(`✅ ${data.message}`);

    } catch (error: any) {
      console.error('❌ Erro geral na aprovação:', error);
      alert(`❌ Erro ao aprovar usuário: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectUser = async (registration: UserRegistration, reason: string) => {
    if (isProcessing) return;
    
    try {
      setIsProcessing(true);
      console.log('🔄 Rejeitando usuário via RPC:', registration.username);

      // Usar a função RPC para rejeitar o usuário
      const { data, error } = await supabase.rpc('reject_user_registration', {
        p_registration_id: registration.id,
        p_rejected_by: currentUser,
        p_rejection_reason: reason
      });

      if (error) {
        console.error('❌ Erro na função RPC de rejeição:', error);
        throw new Error(`Erro na rejeição: ${error.message}`);
      }

      console.log('📋 Resultado da rejeição RPC:', data);

      if (!data.success) {
        throw new Error(data.error || 'Erro desconhecido na rejeição');
      }

      console.log('✅ Rejeição concluída com sucesso via RPC');

      await loadData();
      setIsApprovalModalOpen(false);
      setSelectedRegistration(null);
      setRejectionReason('');

      alert(`✅ ${data.message}`);

    } catch (error: any) {
      console.error('❌ Erro ao rejeitar usuário:', error);
      alert(`❌ Erro ao rejeitar usuário: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteRegistration = (registration: UserRegistration) => {
    setRegistrationToDelete(registration);
    setIsDeleteRegistrationModalOpen(true);
  };

  const handleConfirmDeleteRegistration = async () => {
    if (!registrationToDelete || isProcessing) return;

    try {
      setIsProcessing(true);
      console.log('🔄 Excluindo solicitação de cadastro:', registrationToDelete.username);

      const { error } = await supabase
        .from('user_registrations')
        .delete()
        .eq('id', registrationToDelete.id);

      if (error) {
        console.error('❌ Erro ao excluir solicitação:', error);
        throw error;
      }

      console.log('✅ Solicitação excluída com sucesso');

      await loadData();
      setIsDeleteRegistrationModalOpen(false);
      setRegistrationToDelete(null);

      alert('✅ Solicitação de cadastro excluída com sucesso!');

    } catch (error: any) {
      console.error('❌ Erro ao excluir solicitação:', error);
      alert(`❌ Erro ao excluir solicitação: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleUserStatus = async (user: ApprovedUser) => {
    try {
      const { error } = await supabase
        .from('approved_users')
        .update({ is_active: !user.isActive })
        .eq('id', user.id);

      if (error) throw error;

      await loadData();
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  const handleManagePermissions = (user: ApprovedUser) => {
    setSelectedUser(user);
    setIsPermissionsModalOpen(true);
  };

  const handleManageRole = (user: ApprovedUser) => {
    setSelectedUser(user);
    setIsRoleModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning-100 text-warning-800 dark:bg-warning-900/20 dark:text-warning-400';
      case 'approved': return 'bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-400';
      case 'rejected': return 'bg-danger-100 text-danger-800 dark:bg-danger-900/20 dark:text-danger-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getRoleColor = (level?: number) => {
    switch (level) {
      case 3: return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 2: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 1: return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const pendingRegistrations = registrations.filter(r => r.status === 'pending');
  const processedRegistrations = registrations.filter(r => r.status !== 'pending');

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
            Gerenciamento de Usuários
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerencie solicitações de cadastro, usuários aprovados, cargos e permissões
          </p>
          <div className="mt-2 text-sm text-blue-600 dark:text-blue-400">
            👤 Logado como: <strong>{currentUser}</strong>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Solicitações Pendentes
              </p>
              <p className="text-2xl font-bold text-warning-600 dark:text-warning-400">
                {pendingRegistrations.length}
              </p>
            </div>
            <div className="p-3 bg-warning-100 dark:bg-warning-900/20 rounded-lg">
              <Clock className="w-6 h-6 text-warning-600 dark:text-warning-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Usuários Aprovados
              </p>
              <p className="text-2xl font-bold text-success-600 dark:text-success-400">
                {approvedUsers.length}
              </p>
            </div>
            <div className="p-3 bg-success-100 dark:bg-success-900/20 rounded-lg">
              <UserCheck className="w-6 h-6 text-success-600 dark:text-success-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total de Solicitações
              </p>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                {registrations.length}
              </p>
            </div>
            <div className="p-3 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
              <Users className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'pending'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          Solicitações Pendentes ({pendingRegistrations.length})
        </button>
        <button
          onClick={() => setActiveTab('approved')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'approved'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          Usuários Aprovados ({approvedUsers.length})
        </button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'pending' ? (
          <motion.div
            key="pending"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            {pendingRegistrations.length === 0 ? (
              <Card className="text-center py-12">
                <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Nenhuma solicitação pendente
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Todas as solicitações foram processadas
                </p>
              </Card>
            ) : (
              pendingRegistrations.map((registration, index) => (
                <motion.div
                  key={registration.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card hover className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {registration.fullName}
                          </h3>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(registration.status)}`}>
                            {getStatusIcon(registration.status)}
                            {registration.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div>
                            <p><strong>Usuário:</strong> {registration.username}</p>
                            <p><strong>Email:</strong> {registration.email}</p>
                          </div>
                          <div>
                            <p><strong>Solicitado em:</strong> {new Date(registration.requestedAt).toLocaleString('pt-BR')}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedRegistration(registration);
                            setIsDetailModalOpen(true);
                          }}
                          disabled={isProcessing}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => {
                            setSelectedRegistration(registration);
                            setIsApprovalModalOpen(true);
                          }}
                          disabled={isProcessing}
                          isLoading={isProcessing && selectedRegistration?.id === registration.id}
                        >
                          <UserCheck className="w-4 h-4 mr-1" />
                          {isProcessing && selectedRegistration?.id === registration.id ? 'Processando...' : 'Aprovar'}
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}

            {/* Processed Registrations */}
            {processedRegistrations.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Solicitações Processadas
                </h3>
                <div className="space-y-3">
                  {processedRegistrations.map((registration) => (
                    <Card key={registration.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {registration.fullName}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            ({registration.username})
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(registration.status)}`}>
                            {getStatusIcon(registration.status)}
                            {registration.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {registration.approvedAt && new Date(registration.approvedAt).toLocaleDateString('pt-BR')}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRegistration(registration)}
                            className="text-danger-600 hover:text-danger-700 hover:bg-danger-50 dark:hover:bg-danger-900/20"
                            disabled={isProcessing}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      {registration.rejectionReason && (
                        <div className="mt-2 p-2 bg-danger-50 dark:bg-danger-900/20 rounded text-sm text-danger-700 dark:text-danger-400">
                          <strong>Motivo da rejeição:</strong> {registration.rejectionReason}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="approved"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {approvedUsers.length === 0 ? (
              <Card className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Nenhum usuário aprovado
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Aprove algumas solicitações para ver usuários aqui
                </p>
              </Card>
            ) : (
              approvedUsers.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card hover className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {user.fullName}
                          </h3>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            user.isActive 
                              ? 'bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {user.isActive ? 'Ativo' : 'Inativo'}
                          </span>
                          {user.userRole && (
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.userRole.level)}`}>
                              {user.userRole.displayName}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div>
                            <p><strong>Usuário:</strong> {user.username}</p>
                            <p><strong>Email:</strong> {user.email}</p>
                          </div>
                          <div>
                            <p><strong>Criado em:</strong> {new Date(user.createdAt).toLocaleDateString('pt-BR')}</p>
                            {user.lastLogin && (
                              <p><strong>Último login:</strong> {new Date(user.lastLogin).toLocaleDateString('pt-BR')}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleManageRole(user)}
                          className="flex items-center gap-1"
                        >
                          <Edit className="w-4 h-4" />
                          Cargo
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleManagePermissions(user)}
                          className="flex items-center gap-1"
                        >
                          <Shield className="w-4 h-4" />
                          Permissões
                        </Button>
                        <Button
                          variant={user.isActive ? "warning" : "success"}
                          size="sm"
                          onClick={() => handleToggleUserStatus(user)}
                        >
                          {user.isActive ? 'Desativar' : 'Ativar'}
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Detalhes da Solicitação"
        size="md"
      >
        {selectedRegistration && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nome Completo
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {selectedRegistration.fullName}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nome de Usuário
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {selectedRegistration.username}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {selectedRegistration.email}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status
                </label>
                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedRegistration.status)}`}>
                  {getStatusIcon(selectedRegistration.status)}
                  {selectedRegistration.status}
                </span>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Data da Solicitação
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {new Date(selectedRegistration.requestedAt).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isApprovalModalOpen}
        onClose={() => !isProcessing && setIsApprovalModalOpen(false)}
        title="Processar Solicitação"
        size="md"
      >
        {selectedRegistration && (
          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                {selectedRegistration.fullName}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Usuário: {selectedRegistration.username} | Email: {selectedRegistration.email}
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h5 className="font-medium text-green-900 dark:text-green-100 mb-2">
                ✅ Sistema Aprimorado
              </h5>
              <p className="text-sm text-green-800 dark:text-green-200">
                Agora usando função RPC (Remote Procedure Call) para aprovação mais robusta e segura. 
                O usuário será criado com cargo de <strong>Vendedor</strong> e poderá fazer login imediatamente.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="success"
                onClick={() => handleApproveUser(selectedRegistration)}
                disabled={isProcessing}
                isLoading={isProcessing}
                className="flex-1"
              >
                <UserCheck className="w-4 h-4 mr-2" />
                {isProcessing ? 'Aprovando...' : 'Aprovar Usuário'}
              </Button>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ou rejeitar com motivo:
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Digite o motivo da rejeição..."
                rows={3}
                disabled={isProcessing}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50"
              />
              <Button
                variant="danger"
                onClick={() => handleRejectUser(selectedRegistration, rejectionReason)}
                disabled={!rejectionReason.trim() || isProcessing}
                isLoading={isProcessing}
                className="mt-3 w-full"
              >
                <UserX className="w-4 h-4 mr-2" />
                {isProcessing ? 'Rejeitando...' : 'Rejeitar Solicitação'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isDeleteRegistrationModalOpen}
        onClose={() => !isProcessing && setIsDeleteRegistrationModalOpen(false)}
        title="Confirmar Exclusão"
        size="sm"
      >
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-danger-100 dark:bg-danger-900/20 mb-4">
            <Trash2 className="h-6 w-6 text-danger-600 dark:text-danger-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Excluir Solicitação de Cadastro
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Tem certeza que deseja excluir permanentemente a solicitação de cadastro de "{registrationToDelete?.fullName}"? 
            Esta ação não pode ser desfeita e removerá todos os dados da solicitação do banco de dados.
          </p>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-6">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Atenção:</strong> Esta ação é irreversível. O usuário precisará fazer uma nova solicitação se quiser se cadastrar novamente.
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button
              variant="ghost"
              onClick={() => setIsDeleteRegistrationModalOpen(false)}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmDeleteRegistration}
              disabled={isProcessing}
              isLoading={isProcessing}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isProcessing ? 'Excluindo...' : 'Excluir Permanentemente'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        title="Gerenciar Cargo"
        size="lg"
      >
        {selectedUser && (
          <UserRoleManagement
            user={selectedUser}
            onClose={() => setIsRoleModalOpen(false)}
            onUpdate={loadData}
          />
        )}
      </Modal>

      <Modal
        isOpen={isPermissionsModalOpen}
        onClose={() => setIsPermissionsModalOpen(false)}
        title="Gerenciar Permissões"
        size="lg"
      >
        {selectedUser && (
          <UserPermissions
            user={selectedUser}
            currentUser={currentUser}
            onClose={() => setIsPermissionsModalOpen(false)}
          />
        )}
      </Modal>
    </div>
  );
};