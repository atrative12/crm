import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, Edit, Save, X } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { supabase } from '../../lib/supabase';
import { ApprovedUser, UserRole } from '../../types';

interface UserRoleManagementProps {
  user: ApprovedUser;
  onClose: () => void;
  onUpdate: () => void;
}

export const UserRoleManagement: React.FC<UserRoleManagementProps> = ({ 
  user, 
  onClose, 
  onUpdate 
}) => {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>(user.roleId || '');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('level', { ascending: false });

      if (error) throw error;

      const transformedRoles: UserRole[] = (data || []).map(role => ({
        id: role.id,
        name: role.name,
        displayName: role.display_name,
        description: role.description,
        level: role.level,
        permissions: role.permissions || [],
        createdAt: role.created_at
      }));

      setRoles(transformedRoles);
    } catch (error) {
      console.error('Error loading roles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveRole = async () => {
    if (!selectedRoleId) return;

    try {
      setIsSaving(true);

      // Use the RPC function to change user role
      const { data, error } = await supabase.rpc('change_user_role', {
        p_user_id: user.id,
        p_new_role_id: selectedRoleId,
        p_changed_by: 'admin' // You can get this from auth context
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Erro desconhecido');
      }

      alert(`✅ ${data.message}`);
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Erro ao atualizar cargo do usuário.');
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleColor = (level: number) => {
    switch (level) {
      case 3: return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 2: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 1: return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getLevelName = (level: number) => {
    switch (level) {
      case 3: return 'Administrador';
      case 2: return 'Gerente';
      case 1: return 'Vendedor';
      default: return 'Usuário';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Info */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
          <Users className="w-6 h-6 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            {user.fullName}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {user.username} • {user.email}
          </p>
        </div>
      </div>

      {/* Current Role */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          Cargo Atual
        </h4>
        <p className="text-sm text-blue-800 dark:text-blue-200">
          {user.userRole ? user.userRole.displayName : 'Nenhum cargo definido'}
        </p>
      </div>

      {/* Role Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Selecionar Novo Cargo:
        </label>
        <div className="space-y-3">
          {roles.map((role) => (
            <motion.div
              key={role.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedRoleId === role.id
                  ? 'border-primary-300 bg-primary-50 dark:border-primary-700 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              onClick={() => setSelectedRoleId(role.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h5 className="font-medium text-gray-900 dark:text-gray-100">
                      {role.displayName}
                    </h5>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(role.level)}`}>
                      {getLevelName(role.level)}
                    </span>
                  </div>
                  {role.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {role.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.slice(0, 3).map((permission, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                      >
                        {permission.replace('_', ' ')}
                      </span>
                    ))}
                    {role.permissions.length > 3 && (
                      <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                        +{role.permissions.length - 3} mais
                      </span>
                    )}
                  </div>
                </div>
                <div className="ml-4">
                  <input
                    type="radio"
                    name="role"
                    value={role.id}
                    checked={selectedRoleId === role.id}
                    onChange={() => setSelectedRoleId(role.id)}
                    className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Warning */}
      {selectedRoleId !== user.roleId && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h5 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">
            ⚠️ Atenção
          </h5>
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            Alterar o cargo do usuário modificará suas permissões e acesso ao sistema. 
            Esta ação entrará em vigor imediatamente.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          onClick={handleSaveRole}
          disabled={!selectedRoleId || selectedRoleId === user.roleId || isSaving}
          isLoading={isSaving}
          className="flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Salvando...' : 'Salvar Cargo'}
        </Button>
      </div>
    </div>
  );
};