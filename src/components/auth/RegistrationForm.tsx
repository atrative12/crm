import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { supabase } from '../../lib/supabase';

interface RegistrationFormProps {
  onBackToLogin: () => void;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({ onBackToLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.username || !formData.email || !formData.password || !formData.fullName) {
      setError('Todos os campos são obrigatórios.');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem.');
      return false;
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Por favor, insira um email válido.');
      return false;
    }

    return true;
  };

  const checkExistingUser = async (username: string, email: string) => {
    // Check if username already exists in registrations
    const { data: existingUsername } = await supabase
      .from('user_registrations')
      .select('username')
      .eq('username', username)
      .limit(1);

    if (existingUsername && existingUsername.length > 0) {
      return { exists: true, field: 'username' };
    }

    // Check if email already exists in registrations
    const { data: existingEmail } = await supabase
      .from('user_registrations')
      .select('email')
      .eq('email', email)
      .limit(1);

    if (existingEmail && existingEmail.length > 0) {
      return { exists: true, field: 'email' };
    }

    // Check if username already exists in approved users
    const { data: existingApprovedUsername } = await supabase
      .from('approved_users')
      .select('username')
      .eq('username', username)
      .limit(1);

    if (existingApprovedUsername && existingApprovedUsername.length > 0) {
      return { exists: true, field: 'username' };
    }

    // Check if email already exists in approved users
    const { data: existingApprovedEmail } = await supabase
      .from('approved_users')
      .select('email')
      .eq('email', email)
      .limit(1);

    if (existingApprovedEmail && existingApprovedEmail.length > 0) {
      return { exists: true, field: 'email' };
    }

    return { exists: false };
  };

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
    
    if (!validateForm()) return;

    setIsLoading(true);
    setError('');

    try {
      console.log('🔄 Verificando usuários existentes...');
      
      // Check for existing users first to provide better error messages
      const existingCheck = await checkExistingUser(formData.username, formData.email);
      
      if (existingCheck.exists) {
        if (existingCheck.field === 'username') {
          setError('Este nome de usuário já está em uso ou já foi solicitado.');
        } else if (existingCheck.field === 'email') {
          setError('Este email já está cadastrado ou já foi solicitado.');
        }
        return;
      }

      console.log('✅ Usuário não existe, prosseguindo com cadastro...');

      // Hash the password
      const passwordHash = await hashPassword(formData.password);

      // Insert registration request
      const { data, error: insertError } = await supabase
        .from('user_registrations')
        .insert([{
          username: formData.username,
          email: formData.email,
          password_hash: passwordHash,
          full_name: formData.fullName,
          status: 'pending'
        }])
        .select()
        .single();

      if (insertError) {
        console.error('❌ Erro ao inserir solicitação:', insertError);
        
        // Handle any remaining unique constraint violations
        if (insertError.code === '23505') {
          if (insertError.message.includes('username')) {
            setError('Este nome de usuário já está em uso.');
          } else if (insertError.message.includes('email')) {
            setError('Este email já está cadastrado.');
          } else {
            setError('Usuário ou email já existem.');
          }
        } else {
          throw insertError;
        }
        return;
      }

      console.log('✅ Solicitação de cadastro criada com sucesso:', data);

      setIsSubmitted(true);

    } catch (err: any) {
      console.error('❌ Erro no cadastro:', err);
      setError('Erro ao processar solicitação. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto w-16 h-16 bg-success-100 dark:bg-success-900/20 rounded-full flex items-center justify-center mb-6"
            >
              <CheckCircle className="w-8 h-8 text-success-600 dark:text-success-400" />
            </motion.div>
            
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Solicitação Enviada!
            </h2>
            
            <div className="text-left bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                Sua solicitação de cadastro foi enviada com sucesso para análise.
              </p>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p><strong>Nome:</strong> {formData.fullName}</p>
                <p><strong>Usuário:</strong> {formData.username}</p>
                <p><strong>Email:</strong> {formData.email}</p>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Próximos passos:</strong><br />
                O administrador irá analisar sua solicitação diretamente no sistema CRM. 
                Assim que aprovada, você poderá fazer login com suas credenciais.
              </p>
            </div>

            <Button onClick={onBackToLogin} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Login
            </Button>
          </Card>
        </motion.div>
      </div>
    );
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
            <UserPlus className="w-8 h-8 text-white" />
          </motion.div>
          
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Solicitar Cadastro
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Preencha os dados para solicitar acesso ao Atractive CRM
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-left">
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nome Completo *
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                placeholder="Seu nome completo"
                required
              />
            </div>

            <div className="text-left">
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nome de Usuário *
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                placeholder="Escolha um nome de usuário"
                required
              />
            </div>

            <div className="text-left">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                placeholder="seu@email.com"
                required
              />
            </div>

            <div className="text-left">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Senha *
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                placeholder="Mínimo 6 caracteres"
                required
              />
            </div>

            <div className="text-left">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirmar Senha *
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                placeholder="Repita sua senha"
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

            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-sm text-green-800 dark:text-green-200">
                <strong>✅ Processo Simplificado:</strong> Sua solicitação será enviada diretamente para o administrador 
                no sistema CRM. Assim que aprovada, você poderá fazer login imediatamente!
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full"
            >
              {isLoading ? 'Enviando Solicitação...' : 'Solicitar Cadastro'}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={onBackToLogin}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Login
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
};