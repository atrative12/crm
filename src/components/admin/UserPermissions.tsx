import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Save, User, CheckCircle, XCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { ApprovedUser, UserPermission, AVAILABLE_PERMISSIONS } from '../../types';

interface UserPermissionsProps {
  user: ApprovedUser;
  onClose: () => void;
  currentUser: string;
}

export const UserPermissions: React.FC<UserPermissionsProps> = ({ user, onClose, currentUser }) => {
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [changes, setChanges] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    loadUserPermissions();
  }, [user.id]);

  const loadUserPermissions = async () => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const transformedPermissions: UserPermission[] = (data || []).map(perm => ({
        id: perm.id,
        userId: perm.user_id,
        permissionName: perm.permission_name,
        granted: perm.granted,
        grantedBy: perm.granted_by,
        grantedAt: perm.granted_at,
        createdAt: perm.created_at
      }));

      setPermissions(transformedPermissions);
    } catch (error) {
      console.error('Error loading permissions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePermissionChange = (permissionName: string, granted: boolean) => {
    setChanges(prev => ({
      ...prev,
      [permissionName]: granted
    }));
  };

  const savePermissions = async () => {
    try {
      setIsSaving(true);

      for (const [permissionName, granted] of Object.entries(changes)) {
        const existingPermission = permissions.find(p => p.permissionName === permissionName);

        if (existingPermission) {
          // Update existing permission
          const { error } = await supabase
            .from('user_permissions')
            .update({
              granted,
              granted_by: currentUser,
              granted_at: new Date().toISOString()
            })
            .eq('id', existingPermission.id);

          if (error) throw error;
        } else {
          // Create new permission
          const { error } = await supabase
            .from('user_permissions')
            .insert([{
              user_id: user.id,
              permission_name: permissionName,
              granted,
              granted_by: currentUser
            }]);

          if (error) throw error;
        }
      }

      await loadUserPermissions();
      setChanges({});
      
    } catch (error) {
      console.error('Error saving permissions:', error);
      alert('Erro ao salvar permissões. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const getPermissionStatus = (permissionName: string) => {
    if (changes.hasOwnProperty(permissionName)) {
      return changes[permissionName];
    }
    
    const permission = permissions.find(p => p.permissionName === permissionName);
    return permission?.granted || false;
  };

  const hasChanges = Object.keys(changes).length > 0;

  // Group permissions by category
  const permissionsByCategory = AVAILABLE_PERMISSIONS.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as { [key: string]: typeof AVAILABLE_PERMISSIONS });

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
          <User className="w-6 h-6 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            {user.fullName}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {user.username} • {user.email}
          </p>
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
            user.role === 'admin'
              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
          }`}>
            {user.role === 'admin' ? 'Administrador' : 'Usuário'}
          </span>
        </div>
      </div>

      {/* Admin Notice */}
      {user.role === 'admin' && (
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <p className="text-sm text-purple-800 dark:text-purple-200">
              <strong>Administrador:</strong> Este usuário tem acesso total ao sistema por padrão.
            </p>
          </div>
        </div>
      )}

      {/* Permissions by Category */}
      <div className="space-y-6">
        {Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => (
          <Card key={category} className="p-6">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              {category}
            </h4>
            
            <div className="space-y-4">
              {categoryPermissions.map((permission) => {
                const isGranted = getPermissionStatus(permission.name);
                const hasChange = changes.hasOwnProperty(permission.name);
                
                return (
                  <motion.div
                    key={permission.name}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`flex items-start justify-between p-4 border rounded-lg transition-colors ${
                      hasChange 
                        ? 'border-primary-300 bg-primary-50 dark:border-primary-700 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h5 className="font-medium text-gray-900 dark:text-gray-100">
                          {permission.label}
                        </h5>
                        {isGranted ? (
                          <CheckCircle className="w-5 h-5 text-success-600 dark:text-success-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-gray-400" />
                        )}
                        {hasChange && (
                          <span className="px-2 py-1 text-xs bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-400 rounded-full">
                            Alterado
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {permission.description}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isGranted}
                          onChange={(e) => handlePermissionChange(permission.name, e.target.checked)}
                          disabled={user.role === 'admin'}
                          className="sr-only"
                        />
                        <div className={`relative w-11 h-6 rounded-full transition-colors ${
                          isGranted 
                            ? 'bg-success-600' 
                            : 'bg-gray-300 dark:bg-gray-600'
                        } ${user.role === 'admin' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                          <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                            isGranted ? 'translate-x-5' : 'translate-x-0'
                          }`} />
                        </div>
                      </label>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          onClick={savePermissions}
          disabled={!hasChanges || isSaving || user.role === 'admin'}
          isLoading={isSaving}
          className="flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Salvando...' : 'Salvar Permissões'}
        </Button>
      </div>
    </div>
  );
};