-- Migração final para criar os usuários administradores
-- Esta migração vai garantir que os usuários sejam criados corretamente

-- Primeiro, vamos verificar e limpar qualquer dado existente
DO $$
BEGIN
  -- Deletar permissões existentes
  DELETE FROM user_permissions WHERE user_id IN (
    SELECT id FROM approved_users WHERE username IN ('Victor', 'Guilherme')
  );
  
  -- Deletar usuários existentes
  DELETE FROM approved_users WHERE username IN ('Victor', 'Guilherme');
  
  RAISE NOTICE 'Dados existentes limpos';
END $$;

-- Inserir os usuários administradores
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

-- Verificar se os usuários foram criados
DO $$
DECLARE
  victor_record RECORD;
  guilherme_record RECORD;
BEGIN
  -- Buscar Victor
  SELECT * INTO victor_record FROM approved_users WHERE username = 'Victor';
  IF victor_record IS NULL THEN
    RAISE EXCEPTION 'ERRO: Usuário Victor não foi criado!';
  ELSE
    RAISE NOTICE 'SUCCESS: Usuário Victor criado - ID: %, Email: %, Hash: %', 
      victor_record.id, victor_record.email, victor_record.password_hash;
  END IF;
  
  -- Buscar Guilherme
  SELECT * INTO guilherme_record FROM approved_users WHERE username = 'Guilherme';
  IF guilherme_record IS NULL THEN
    RAISE EXCEPTION 'ERRO: Usuário Guilherme não foi criado!';
  ELSE
    RAISE NOTICE 'SUCCESS: Usuário Guilherme criado - ID: %, Email: %, Hash: %', 
      guilherme_record.id, guilherme_record.email, guilherme_record.password_hash;
  END IF;
END $$;

-- Inserir permissões para os administradores
INSERT INTO user_permissions (
  user_id,
  permission_name,
  granted,
  granted_by,
  granted_at,
  created_at,
  updated_at
)
SELECT 
  u.id,
  p.permission_name,
  true,
  'system',
  now(),
  now(),
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

-- Verificar permissões criadas
DO $$
DECLARE
  permissions_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO permissions_count 
  FROM user_permissions up
  JOIN approved_users au ON up.user_id = au.id
  WHERE au.username IN ('Victor', 'Guilherme');
  
  RAISE NOTICE 'Permissões criadas: %', permissions_count;
  
  IF permissions_count = 0 THEN
    RAISE WARNING 'Nenhuma permissão foi criada para os administradores';
  END IF;
END $$;

-- Mostrar resultado final
SELECT 
  'RESULTADO FINAL' as status,
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