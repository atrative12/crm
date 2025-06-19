import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserCheck, UserX, Clock, Mail, CheckCircle, XCircle, Eye, Settings, Shield } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { UserPermissions } from './UserPermissions';
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
  const [rejectionReason, setRejectionReason] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Load pending registrations
      const { data: registrationsData, error: regError } = await supabase
        .from('user_registrations')
        .select('*')
        .order('requested_at', { ascending: false });

      if (regError) throw regError;

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

      // Load approved users
      const { data: usersData, error: usersError } = await supabase
        .from('approved_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      const transformedUsers: ApprovedUser[] = (usersData || []).map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        isActive: user.is_active,
        createdAt: user.created_at,
        lastLogin: user.last_login
      }));

      setApprovedUsers(transformedUsers);

    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveUser = async (registration: UserRegistration) => {
    try {
      // Insert into approved_users
      const { error: insertError } = await supabase
        .from('approved_users')
        .insert([{
          username: registration.username,
          email: registration.email,
          password_hash: registration.passwordHash,
          full_name: registration.fullName,
          role: 'user'
        }]);

      if (insertError) throw insertError;

      // Update registration status
      const { error: updateError } = await supabase
        .from('user_registrations')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: currentUser
        })
        .eq('id', registration.id);

      if (updateError) throw updateError;

      // Reload data
      await loadData();
      setIsApprovalModalOpen(false);
      setSelectedRegistration(null);

    } catch (error) {
      console.error('Error approving user:', error);
      alert('Erro ao aprovar usuário. Verifique se você tem permissões de administrador.');
    }
  };

  const handleRejectUser = async (registration: UserRegistration, reason: string) => {
    try {
      const { error } = await supabase
        .from('user_registrations')
        .update({
          status: 'rejected',
          rejection_reason: reason
        })
        .eq('id', registration.id);

      if (error) throw error;

      await loadData();
      setIsApprovalModalOpen(false);
      setSelectedRegistration(null);
      setRejectionReason('');

    } catch (error) {
      console.error('Error rejecting user:', error);
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
            Gerencie solicitações de cadastro, usuários aprovados e permissões
          </p>
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
                        >
                          <UserCheck className="w-4 h-4 mr-1" />
                          Aprovar
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
                        <div className="flex items-center gap-3">
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
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {registration.approvedAt && new Date(registration.approvedAt).toLocaleDateString('pt-BR')}
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
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            user.role === 'admin'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                          }`}>
                            {user.role === 'admin' ? 'Admin' : 'Usuário'}
                          </span>
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
        onClose={() => setIsApprovalModalOpen(false)}
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

            <div className="flex gap-3">
              <Button
                variant="success"
                onClick={() => handleApproveUser(selectedRegistration)}
                className="flex-1"
              >
                <UserCheck className="w-4 h-4 mr-2" />
                Aprovar Usuário
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <Button
                variant="danger"
                onClick={() => handleRejectUser(selectedRegistration, rejectionReason)}
                disabled={!rejectionReason.trim()}
                className="mt-3 w-full"
              >
                <UserX className="w-4 h-4 mr-2" />
                Rejeitar Solicitação
              </Button>
            </div>
          </div>
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