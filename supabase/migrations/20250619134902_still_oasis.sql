/*
  # Criar usuários administradores

  1. Usuários Administradores
    - Victor (username: Victor, senha: Club@380)
    - Guilherme (username: Guilherme, senha: Club@380)
  
  2. Permissões
    - Ambos terão role 'admin' e todas as permissões
    - Contas ativas por padrão
  
  3. Hash da Senha
    - Usando SHA-256 para a senha "Club@380"
*/

-- Primeiro, vamos deletar qualquer registro existente desses usuários
DELETE FROM user_permissions WHERE user_id IN (
  SELECT id FROM approved_users WHERE username IN ('Victor', 'Guilherme')
);

DELETE FROM approved_users WHERE username IN ('Victor', 'Guilherme');

-- Inserir os dois administradores com o hash correto da senha "Club@380"
-- Hash SHA-256 de "Club@380" = 849be1240c07af739060374ae3319f17d209a0746470bd8b56146aaeeab103fe
INSERT INTO approved_users (
  username,
  email,
  password_hash,
  full_name,
  role,
  is_active,
  created_at
) VALUES 
(
  'Victor',
  'victor@atractive.com',
  '849be1240c07af739060374ae3319f17d209a0746470bd8b56146aaeeab103fe',
  'Victor Administrador',
  'admin',
  true,
  now()
),
(
  'Guilherme',
  'guilherme@atractive.com', 
  '849be1240c07af739060374ae3319f17d209a0746470bd8b56146aaeeab103fe',
  'Guilherme Administrador',
  'admin',
  true,
  now()
);

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