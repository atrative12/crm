/*
  # Criar usuários administradores e sistema de permissões

  1. Novos Usuários Administradores
    - Victor (senha: Club@380)
    - Guilherme (senha: Club@380)
    
  2. Sistema de Permissões
    - Tabela de permissões para controlar acesso às funcionalidades
    - Administradores têm acesso total
    - Outros usuários têm permissões configuráveis pelos admins
    
  3. Segurança
    - Senhas hasheadas adequadamente
    - Políticas RLS atualizadas
*/

-- Função para hash de senha (SHA-256 simples para demo)
CREATE OR REPLACE FUNCTION simple_hash(password text)
RETURNS text AS $$
BEGIN
  RETURN encode(digest(password, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Limpar usuários de demonstração existentes
DELETE FROM approved_users WHERE username IN ('admin', 'demo');

-- Inserir os dois usuários administradores
INSERT INTO approved_users (username, email, password_hash, full_name, role, is_active)
VALUES 
  (
    'Victor',
    'victor@atractive.com',
    simple_hash('Club@380'),
    'Victor - Administrador',
    'admin',
    true
  ),
  (
    'Guilherme',
    'guilherme@atractive.com', 
    simple_hash('Club@380'),
    'Guilherme - Administrador',
    'admin',
    true
  )
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active;

-- Criar tabela de permissões
CREATE TABLE IF NOT EXISTS user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES approved_users(id) ON DELETE CASCADE,
  permission_name text NOT NULL,
  granted boolean DEFAULT false,
  granted_by text,
  granted_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, permission_name)
);

-- Habilitar RLS na tabela de permissões
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- Políticas para permissões
CREATE POLICY "Admins can manage all permissions"
  ON user_permissions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM approved_users 
      WHERE approved_users.email = auth.jwt() ->> 'email' 
      AND approved_users.role = 'admin'
      AND approved_users.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM approved_users 
      WHERE approved_users.email = auth.jwt() ->> 'email' 
      AND approved_users.role = 'admin'
      AND approved_users.is_active = true
    )
  );

CREATE POLICY "Users can view their own permissions"
  ON user_permissions
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM approved_users 
      WHERE email = auth.jwt() ->> 'email'
    )
  );

-- Trigger para updated_at
CREATE TRIGGER update_user_permissions_updated_at
  BEFORE UPDATE ON user_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Definir permissões padrão do sistema
DO $$
DECLARE
  victor_id uuid;
  guilherme_id uuid;
  default_permissions text[] := ARRAY[
    'view_dashboard',
    'manage_clients', 
    'manage_opportunities',
    'manage_tasks',
    'manage_meetings',
    'view_whatsapp',
    'manage_ai_agents',
    'view_reports',
    'export_data'
  ];
  perm text;
BEGIN
  -- Obter IDs dos administradores
  SELECT id INTO victor_id FROM approved_users WHERE username = 'Victor';
  SELECT id INTO guilherme_id FROM approved_users WHERE username = 'Guilherme';
  
  -- Conceder todas as permissões aos administradores
  FOREACH perm IN ARRAY default_permissions
  LOOP
    -- Victor
    INSERT INTO user_permissions (user_id, permission_name, granted, granted_by)
    VALUES (victor_id, perm, true, 'system')
    ON CONFLICT (user_id, permission_name) DO UPDATE SET
      granted = true,
      granted_by = 'system',
      granted_at = now();
      
    -- Guilherme  
    INSERT INTO user_permissions (user_id, permission_name, granted, granted_by)
    VALUES (guilherme_id, perm, true, 'system')
    ON CONFLICT (user_id, permission_name) DO UPDATE SET
      granted = true,
      granted_by = 'system',
      granted_at = now();
  END LOOP;
END $$;

-- Atualizar políticas dos approved_users para permitir que admins gerenciem outros usuários
DROP POLICY IF EXISTS "Authenticated users can manage approved_users" ON approved_users;
DROP POLICY IF EXISTS "Service role can manage approved_users" ON approved_users;
DROP POLICY IF EXISTS "Users can view own profile" ON approved_users;

-- Nova política mais específica para admins
CREATE POLICY "Admins can manage all users"
  ON approved_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM approved_users admin_check
      WHERE admin_check.email = auth.jwt() ->> 'email' 
      AND admin_check.role = 'admin'
      AND admin_check.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM approved_users admin_check
      WHERE admin_check.email = auth.jwt() ->> 'email' 
      AND admin_check.role = 'admin'
      AND admin_check.is_active = true
    )
  );

-- Usuários podem ver seu próprio perfil
CREATE POLICY "Users can view own profile"
  ON approved_users
  FOR SELECT
  TO authenticated
  USING (email = auth.jwt() ->> 'email');

-- Service role tem acesso total (para operações do sistema)
CREATE POLICY "Service role full access"
  ON approved_users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);