/*
  # Sistema de Cargos e Chamados

  1. Novas Tabelas
    - `user_roles` - Define os cargos disponíveis no sistema
    - `tickets` - Sistema de chamados/atividades para o time

  2. Modificações
    - Adicionar campo `role_id` na tabela `approved_users`
    - Criar relacionamentos entre usuários e cargos

  3. Segurança
    - Habilitar RLS em todas as novas tabelas
    - Criar políticas de acesso baseadas em cargos
*/

-- Criar tabela de cargos
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  description text,
  level integer NOT NULL DEFAULT 1, -- 1=vendedor, 2=gerente, 3=admin
  permissions text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Inserir cargos padrão
INSERT INTO user_roles (name, display_name, description, level, permissions) VALUES
('admin', 'Administrador', 'Acesso total ao sistema', 3, ARRAY[
  'view_dashboard', 'manage_clients', 'manage_opportunities', 'manage_tasks', 
  'manage_meetings', 'view_whatsapp', 'manage_ai_agents', 'view_reports', 
  'export_data', 'manage_users', 'manage_tickets', 'assign_tickets'
]),
('manager', 'Gerente', 'Gerencia equipes e pode criar chamados', 2, ARRAY[
  'view_dashboard', 'manage_clients', 'manage_opportunities', 'manage_tasks',
  'manage_meetings', 'view_whatsapp', 'view_reports', 'export_data',
  'manage_tickets', 'assign_tickets'
]),
('salesperson', 'Vendedor', 'Foco em vendas e atendimento', 1, ARRAY[
  'view_dashboard', 'manage_clients', 'manage_opportunities', 'manage_tasks',
  'manage_meetings', 'view_whatsapp', 'view_tickets'
]);

-- Adicionar coluna role_id na tabela approved_users se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'approved_users' AND column_name = 'role_id'
  ) THEN
    ALTER TABLE approved_users ADD COLUMN role_id uuid REFERENCES user_roles(id);
  END IF;
END $$;

-- Atualizar usuários existentes com cargo de admin
UPDATE approved_users 
SET role_id = (SELECT id FROM user_roles WHERE name = 'admin')
WHERE role = 'admin';

-- Atualizar usuários existentes com cargo de vendedor (padrão)
UPDATE approved_users 
SET role_id = (SELECT id FROM user_roles WHERE name = 'salesperson')
WHERE role_id IS NULL;

-- Criar tabela de chamados/tickets
CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'task' CHECK (type IN ('task', 'objective', 'training', 'meeting')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  assigned_to uuid REFERENCES approved_users(id) ON DELETE SET NULL,
  assigned_by uuid REFERENCES approved_users(id) ON DELETE SET NULL,
  due_date date,
  due_time time,
  completion_notes text,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de comentários dos tickets
CREATE TABLE IF NOT EXISTS ticket_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES tickets(id) ON DELETE CASCADE,
  user_id uuid REFERENCES approved_users(id) ON DELETE CASCADE,
  comment text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;

-- Políticas para user_roles
CREATE POLICY "Anyone can view roles" ON user_roles FOR SELECT USING (true);
CREATE POLICY "Only admins can manage roles" ON user_roles FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM approved_users u 
    JOIN user_roles r ON u.role_id = r.id 
    WHERE u.id = auth.uid() AND r.level >= 3
  ));

-- Políticas para tickets
CREATE POLICY "Users can view their assigned tickets" ON tickets FOR SELECT 
  USING (assigned_to = auth.uid() OR assigned_by = auth.uid());

CREATE POLICY "Managers and admins can view all tickets" ON tickets FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM approved_users u 
    JOIN user_roles r ON u.role_id = r.id 
    WHERE u.id = auth.uid() AND r.level >= 2
  ));

CREATE POLICY "Managers and admins can create tickets" ON tickets FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM approved_users u 
    JOIN user_roles r ON u.role_id = r.id 
    WHERE u.id = auth.uid() AND r.level >= 2
  ));

CREATE POLICY "Assigned users can update their tickets" ON tickets FOR UPDATE 
  USING (assigned_to = auth.uid() OR assigned_by = auth.uid() OR EXISTS (
    SELECT 1 FROM approved_users u 
    JOIN user_roles r ON u.role_id = r.id 
    WHERE u.id = auth.uid() AND r.level >= 2
  ));

-- Políticas para ticket_comments
CREATE POLICY "Users can view comments on their tickets" ON ticket_comments FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM tickets t 
    WHERE t.id = ticket_id AND (t.assigned_to = auth.uid() OR t.assigned_by = auth.uid())
  ) OR EXISTS (
    SELECT 1 FROM approved_users u 
    JOIN user_roles r ON u.role_id = r.id 
    WHERE u.id = auth.uid() AND r.level >= 2
  ));

CREATE POLICY "Users can add comments to their tickets" ON ticket_comments FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM tickets t 
    WHERE t.id = ticket_id AND (t.assigned_to = auth.uid() OR t.assigned_by = auth.uid())
  ) OR EXISTS (
    SELECT 1 FROM approved_users u 
    JOIN user_roles r ON u.role_id = r.id 
    WHERE u.id = auth.uid() AND r.level >= 2
  ));

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON user_roles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verificar se tudo foi criado corretamente
SELECT 'Cargos criados:' as info, count(*) as total FROM user_roles;
SELECT 'Tabelas criadas com sucesso!' as status;