/*
  # Debug e criação dos administradores

  1. Verificação da estrutura da tabela
  2. Limpeza completa dos dados
  3. Criação dos usuários administradores
  4. Verificação dos dados criados
*/

-- Primeiro, vamos verificar se a tabela existe e sua estrutura
DO $$
BEGIN
  -- Verificar se a tabela approved_users existe
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'approved_users') THEN
    RAISE EXCEPTION 'Tabela approved_users não existe';
  END IF;
  
  RAISE NOTICE 'Tabela approved_users existe';
END $$;

-- Limpar dados existentes completamente
TRUNCATE TABLE user_permissions CASCADE;
TRUNCATE TABLE approved_users CASCADE;

-- Inserir os administradores de forma simples e direta
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

-- Verificar se os dados foram inseridos
DO $$
DECLARE
  victor_count INTEGER;
  guilherme_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO victor_count FROM approved_users WHERE username = 'Victor';
  SELECT COUNT(*) INTO guilherme_count FROM approved_users WHERE username = 'Guilherme';
  
  RAISE NOTICE 'Usuários criados - Victor: %, Guilherme: %', victor_count, guilherme_count;
  
  IF victor_count = 0 THEN
    RAISE EXCEPTION 'Falha ao criar usuário Victor';
  END IF;
  
  IF guilherme_count = 0 THEN
    RAISE EXCEPTION 'Falha ao criar usuário Guilherme';
  END IF;
END $$;

-- Mostrar os dados criados para verificação
SELECT 
  username, 
  email, 
  password_hash, 
  full_name, 
  role, 
  is_active,
  created_at
FROM approved_users 
WHERE username IN ('Victor', 'Guilherme');