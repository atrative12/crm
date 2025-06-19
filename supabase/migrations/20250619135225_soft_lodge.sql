-- Verificar e corrigir os usuários administradores
-- Primeiro, vamos limpar qualquer dado existente
DELETE FROM user_permissions WHERE user_id IN (
  SELECT id FROM approved_users WHERE username IN ('Victor', 'Guilherme')
);

DELETE FROM approved_users WHERE username IN ('Victor', 'Guilherme');

-- Inserir os administradores com dados corretos
-- Senha: Club@380
-- Hash SHA-256: 849be1240c07af739060374ae3319f17d209a0746470bd8b56146aaeeab103fe
INSERT INTO approved_users (
  id,
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
  gen_random_uuid(),
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
  gen_random_uuid(),
  'Guilherme',
  'guilherme@atractive.com', 
  '849be1240c07af739060374ae3319f17d209a0746470bd8b56146aaeeab103fe',
  'Guilherme Administrador',
  'admin',
  true,
  now(),
  now()
);

-- Verificar se os usuários foram criados corretamente
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM approved_users WHERE username = 'Victor') THEN
    RAISE EXCEPTION 'Usuário Victor não foi criado';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM approved_users WHERE username = 'Guilherme') THEN
    RAISE EXCEPTION 'Usuário Guilherme não foi criado';
  END IF;
  
  RAISE NOTICE 'Usuários administradores criados com sucesso';
END $$;

-- Inserir todas as permissões para os administradores
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