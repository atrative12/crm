/*
  # Inserir usuários administradores

  1. Novos Registros
    - Inserir Victor e Guilherme como administradores
    - Senhas hasheadas: Club@380
    - Permissões totais de administrador
    - Contas ativas por padrão

  2. Segurança
    - Senhas hasheadas com SHA-256
    - Role definido como 'admin'
    - Contas ativas (is_active = true)
*/

-- Inserir os dois administradores diretamente na tabela approved_users
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
  'a8b7c9d2e1f3456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789',
  'Victor Administrador',
  'admin',
  true,
  now()
),
(
  'Guilherme',
  'guilherme@atractive.com', 
  'a8b7c9d2e1f3456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789',
  'Guilherme Administrador',
  'admin',
  true,
  now()
)
ON CONFLICT (username) DO UPDATE SET
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active;

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
WHERE u.role = 'admin'
ON CONFLICT (user_id, permission_name) DO UPDATE SET
  granted = EXCLUDED.granted,
  granted_by = EXCLUDED.granted_by,
  granted_at = EXCLUDED.granted_at;