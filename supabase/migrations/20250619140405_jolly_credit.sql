-- MIGRAÇÃO DEFINITIVA PARA CRIAR USUÁRIOS ADMINISTRADORES
-- Esta migração vai funcionar SIM OU SIM!

-- Primeiro, vamos garantir que as tabelas existem
CREATE TABLE IF NOT EXISTS approved_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  full_name text NOT NULL,
  role text DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  last_login timestamptz,
  updated_at timestamptz DEFAULT now()
);

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

-- Habilitar RLS
ALTER TABLE approved_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- Políticas básicas
DROP POLICY IF EXISTS "Service role full access" ON approved_users;
CREATE POLICY "Service role full access" ON approved_users FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own profile" ON approved_users;
CREATE POLICY "Users can view own profile" ON approved_users FOR SELECT TO authenticated USING (email = (jwt() ->> 'email'::text));

-- LIMPAR DADOS EXISTENTES
DELETE FROM user_permissions WHERE user_id IN (
  SELECT id FROM approved_users WHERE username IN ('Victor', 'Guilherme')
);

DELETE FROM approved_users WHERE username IN ('Victor', 'Guilherme');

-- INSERIR OS USUÁRIOS ADMINISTRADORES
-- Senha: Club@380
-- Hash SHA-256: 849be1240c07af739060374ae3319f17d209a0746470bd8b56146aaeeab103fe
INSERT INTO approved_users (
  username,
  email,
  password_hash,
  full_name,
  role,
  is_active,
  created_at,
  updated_at
) VALUES 
(
  'Victor',
  'victor@atractive.com',
  '849be1240c07af739060374ae3319f17d209a0746470bd8b56146aaeeab103fe',
  'Victor Administrador',
  'admin',
  true,
  now(),
  now()
),
(
  'Guilherme',
  'guilherme@atractive.com', 
  '849be1240c07af739060374ae3319f17d209a0746470bd8b56146aaeeab103fe',
  'Guilherme Administrador',
  'admin',
  true,
  now(),
  now()
);

-- VERIFICAR SE OS USUÁRIOS FORAM CRIADOS
DO $$
DECLARE
  victor_count INTEGER;
  guilherme_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO victor_count FROM approved_users WHERE username = 'Victor';
  SELECT COUNT(*) INTO guilherme_count FROM approved_users WHERE username = 'Guilherme';
  
  IF victor_count = 0 THEN
    RAISE EXCEPTION 'FALHA: Usuário Victor não foi criado!';
  END IF;
  
  IF guilherme_count = 0 THEN
    RAISE EXCEPTION 'FALHA: Usuário Guilherme não foi criado!';
  END IF;
  
  RAISE NOTICE 'SUCESSO: Usuários criados - Victor: %, Guilherme: %', victor_count, guilherme_count;
END $$;

-- INSERIR PERMISSÕES PARA OS ADMINISTRADORES
INSERT INTO user_permissions (
  user_id,
  permission_name,
  granted,
  granted_by,
  granted_at
)
SELECT 
  u.id,
  p.permission_name,
  true,
  'system',
  now()
FROM approved_users u
CROSS JOIN (
  VALUES 
    ('view_dashboard'),
    ('manage_clients'),
    ('manage_opportunities'),
    ('manage_tasks'),
    ('manage_meetings'),
    ('view_whatsapp'),
    ('manage_ai_agents'),
    ('view_reports'),
    ('export_data')
) AS p(permission_name)
WHERE u.role = 'admin' AND u.username IN ('Victor', 'Guilherme');

-- MOSTRAR RESULTADO FINAL
SELECT 
  'USUÁRIOS CRIADOS COM SUCESSO!' as status,
  username, 
  email, 
  password_hash, 
  full_name, 
  role, 
  is_active,
  created_at
FROM approved_users 
WHERE username IN ('Victor', 'Guilherme')
ORDER BY username;