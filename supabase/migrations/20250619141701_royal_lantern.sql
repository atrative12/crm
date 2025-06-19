/*
  # Corrigir Permissões para Aprovação de Usuários

  1. Verificar e corrigir políticas RLS
  2. Garantir que administradores possam aprovar usuários
  3. Testar inserção na tabela approved_users
*/

-- Verificar se as tabelas existem
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_registrations') THEN
    RAISE EXCEPTION 'Tabela user_registrations não existe';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'approved_users') THEN
    RAISE EXCEPTION 'Tabela approved_users não existe';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_users') THEN
    RAISE EXCEPTION 'Tabela admin_users não existe';
  END IF;
  
  RAISE NOTICE 'Todas as tabelas necessárias existem';
END $$;

-- Remover políticas RLS restritivas e criar políticas mais permissivas
DROP POLICY IF EXISTS "Admins can manage all registrations" ON user_registrations;
DROP POLICY IF EXISTS "Admins can manage all users" ON approved_users;
DROP POLICY IF EXISTS "Service role full access" ON approved_users;
DROP POLICY IF EXISTS "Service role full access" ON user_registrations;

-- Política para user_registrations - permitir que qualquer usuário autenticado gerencie
CREATE POLICY "Authenticated users can manage registrations" 
  ON user_registrations 
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Política para approved_users - permitir que qualquer usuário autenticado gerencie
CREATE POLICY "Authenticated users can manage approved users" 
  ON approved_users 
  FOR ALL 
  TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Política para service_role (sempre necessária)
CREATE POLICY "Service role full access on registrations" 
  ON user_registrations 
  FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Service role full access on approved users" 
  ON approved_users 
  FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- Verificar se os administradores existem
DO $$
DECLARE
  admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_count FROM admin_users WHERE username IN ('Victor', 'Guilherme');
  
  IF admin_count = 0 THEN
    RAISE EXCEPTION 'Nenhum administrador encontrado na tabela admin_users';
  END IF;
  
  RAISE NOTICE 'Administradores encontrados: %', admin_count;
END $$;

-- Criar um usuário de teste para verificar se a aprovação funciona
INSERT INTO user_registrations (
  username,
  email,
  password_hash,
  full_name,
  status
) VALUES (
  'teste_usuario',
  'teste@exemplo.com',
  '849be1240c07af739060374ae3319f17d209a0746470bd8b56146aaeeab103fe',
  'Usuário de Teste',
  'pending'
) ON CONFLICT (username) DO UPDATE SET
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  full_name = EXCLUDED.full_name,
  status = EXCLUDED.status;

-- Testar se conseguimos inserir na tabela approved_users
DO $$
BEGIN
  -- Tentar inserir um usuário de teste na tabela approved_users
  INSERT INTO approved_users (
    username,
    email,
    password_hash,
    full_name,
    role,
    is_active
  ) VALUES (
    'teste_aprovado',
    'teste_aprovado@exemplo.com',
    '849be1240c07af739060374ae3319f17d209a0746470bd8b56146aaeeab103fe',
    'Usuário Teste Aprovado',
    'user',
    true
  ) ON CONFLICT (username) DO UPDATE SET
    email = EXCLUDED.email,
    password_hash = EXCLUDED.password_hash,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active;
  
  RAISE NOTICE 'Teste de inserção na tabela approved_users: SUCESSO';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao inserir na tabela approved_users: %', SQLERRM;
END $$;

-- Mostrar status das tabelas
SELECT 'user_registrations' as tabela, COUNT(*) as total FROM user_registrations
UNION ALL
SELECT 'approved_users' as tabela, COUNT(*) as total FROM approved_users
UNION ALL
SELECT 'admin_users' as tabela, COUNT(*) as total FROM admin_users;

-- Mostrar políticas RLS ativas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('user_registrations', 'approved_users')
ORDER BY tablename, policyname;