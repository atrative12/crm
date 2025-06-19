/*
  # Criar tabela específica para administradores

  1. Nova Tabela
    - `admin_users`
      - `id` (uuid, primary key)
      - `username` (text, unique)
      - `password_hash` (text)
      - `full_name` (text)
      - `email` (text)
      - `is_active` (boolean)
      - `created_at` (timestamp)
      - `last_login` (timestamp)

  2. Dados Iniciais
    - Inserir Victor e Guilherme como administradores

  3. Sem RLS
    - Tabela simples sem políticas complexas
*/

-- Criar tabela específica para administradores
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  last_login timestamptz,
  updated_at timestamptz DEFAULT now()
);

-- Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger para updated_at
DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Limpar dados existentes
DELETE FROM admin_users WHERE username IN ('Victor', 'Guilherme');

-- Inserir os administradores
-- Senha: Club@380
-- Hash SHA-256: 849be1240c07af739060374ae3319f17d209a0746470bd8b56146aaeeab103fe
INSERT INTO admin_users (
  username,
  password_hash,
  full_name,
  email,
  is_active
) VALUES 
(
  'Victor',
  '849be1240c07af739060374ae3319f17d209a0746470bd8b56146aaeeab103fe',
  'Victor Administrador',
  'victor@atractive.com',
  true
),
(
  'Guilherme',
  '849be1240c07af739060374ae3319f17d209a0746470bd8b56146aaeeab103fe',
  'Guilherme Administrador',
  'guilherme@atractive.com',
  true
);

-- Verificar se os usuários foram criados
DO $$
DECLARE
  victor_count INTEGER;
  guilherme_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO victor_count FROM admin_users WHERE username = 'Victor';
  SELECT COUNT(*) INTO guilherme_count FROM admin_users WHERE username = 'Guilherme';
  
  IF victor_count = 0 THEN
    RAISE EXCEPTION 'FALHA: Usuário Victor não foi criado!';
  END IF;
  
  IF guilherme_count = 0 THEN
    RAISE EXCEPTION 'FALHA: Usuário Guilherme não foi criado!';
  END IF;
  
  RAISE NOTICE 'SUCESSO: Administradores criados - Victor: %, Guilherme: %', victor_count, guilherme_count;
END $$;

-- Mostrar resultado
SELECT 
  'ADMINISTRADORES CRIADOS' as status,
  username, 
  email, 
  full_name, 
  is_active,
  created_at
FROM admin_users 
WHERE username IN ('Victor', 'Guilherme')
ORDER BY username;