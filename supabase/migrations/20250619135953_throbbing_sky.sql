/*
  # Criar usuários administradores diretamente

  1. Limpar dados existentes
  2. Inserir usuários Victor e Guilherme
  3. Verificar se foram criados corretamente
  4. Inserir permissões
*/

-- Limpar dados existentes
DELETE FROM user_permissions WHERE user_id IN (
  SELECT id FROM approved_users WHERE username IN ('Victor', 'Guilherme')
);

DELETE FROM approved_users WHERE username IN ('Victor', 'Guilherme');

-- Inserir os usuários administradores
-- Senha: Club@380
-- Hash SHA-256: 849be1240c07af739060374ae3319f17d209a0746470bd8b56146aaeeab103fe
INSERT INTO approved_users (
  username,
  email,
  password_hash,
  full_name,
  role,
  is_active
) VALUES 
(
  'Victor',
  'victor@atractive.com',
  '849be1240c07af739060374ae3319f17d209a0746470bd8b56146aaeeab103fe',
  'Victor Administrador',
  'admin',
  true
),
(
  'Guilherme',
  'guilherme@atractive.com', 
  '849be1240c07af739060374ae3319f17d209a0746470bd8b56146aaeeab103fe',
  'Guilherme Administrador',
  'admin',
  true
);