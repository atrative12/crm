import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, UserPlus } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { RegistrationForm } from './RegistrationForm';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';

interface LoginPageProps {
  onLogin: (username: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const { isDarkMode } = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);

  // Usuários hardcoded para garantir que o login funcione
  const hardcodedUsers = [
    {
      username: 'Victor',
      password: 'Club@380',
      fullName: 'Victor Administrador',
      role: 'admin'
    },
    {
      username: 'Guilherme', 
      password: 'Club@380',
      fullName: 'Guilherme Administrador',
      role: 'admin'
    }
  ];

  const hashPassword = async (password: string): Promise<string> => {
    // Simple hash for demo - in production, use proper bcrypt
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Primeiro, verificar usuários hardcoded
      const hardcodedUser = hardcodedUsers.find(
        user => user.username === username && user.password === password
      );

      if (hardcodedUser) {
        console.log('✅ Login bem-sucedido com usuário hardcoded:', hardcodedUser.username);
        onLogin(hardcodedUser.username);
        return;
      }

      // Se não encontrou nos hardcoded, tentar no Supabase
      console.log('🔍 Tentando login no Supabase...');
      const passwordHash = await hashPassword(password);
      
      const { data: user, error: dbError } = await supabase
        .from('approved_users')
        .select('*')
        .eq('username', username)
        .eq('password_hash', passwordHash)
        .eq('is_active', true)
        .single();

      if (!dbError && user) {
        console.log('✅ Login bem-sucedido no Supabase:', user.username);
        
        // Update last login
        await supabase
          .from('approved_users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', user.id);

        onLogin(user.username);
        return;
      }

      // Se chegou aqui, login falhou
      console.log('❌ Login falhou');
      setError('Login ou senha inválidos.');

    } catch (err) {
      console.error('Erro no login:', err);
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (showRegistration) {
    return <RegistrationForm onBackToLogin={() => setShowRegistration(false)} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mb-6"
          >
            <LogIn className="w-8 h-8 text-white" />
          </motion.div>
          
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Bem-vindo
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Entre na sua conta do Atractive CRM
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-left">
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Utilizador
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                placeholder="Digite seu usuário"
                required
              />
            </div>

            <div className="text-left">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Senha
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                placeholder="Digite sua senha"
                required
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-danger-500 text-sm"
              >
                {error}
              </motion.p>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Não tem uma conta?
            </p>
            <Button
              variant="ghost"
              onClick={() => setShowRegistration(true)}
              className="w-full flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Solicitar Cadastro
            </Button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              🔑 Credenciais de Administrador
            </h4>
            <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <p><strong>Usuário:</strong> Victor ou Guilherme</p>
              <p><strong>Senha:</strong> Club@380</p>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};