/*
  # Desabilitar RLS e corrigir sistema de usuários

  1. Alterações de Segurança
    - Desabilitar RLS na tabela `approved_users`
    - Manter políticas existentes para compatibilidade

  2. Correções no Sistema
    - Verificar e corrigir dados de usuários aprovados
    - Garantir que usuários aprovados possam fazer login
    - Sincronizar dados entre tabelas de registro e aprovação

  3. Melhorias
    - Adicionar índices para melhor performance
    - Corrigir possíveis inconsistências de dados
*/

-- Desabilitar RLS na tabela approved_users
ALTER TABLE approved_users DISABLE ROW LEVEL SECURITY;

-- Verificar se existem usuários na tabela user_registrations que foram aprovados mas não estão em approved_users
DO $$
DECLARE
    reg_record RECORD;
    existing_user_id UUID;
BEGIN
    -- Buscar registros aprovados que não estão na tabela approved_users
    FOR reg_record IN 
        SELECT ur.* 
        FROM user_registrations ur 
        WHERE ur.status = 'approved' 
        AND NOT EXISTS (
            SELECT 1 FROM approved_users au 
            WHERE au.username = ur.username OR au.email = ur.email
        )
    LOOP
        -- Inserir usuário aprovado na tabela approved_users se não existir
        INSERT INTO approved_users (
            username,
            email,
            password_hash,
            full_name,
            role,
            is_active,
            created_at
        ) VALUES (
            reg_record.username,
            reg_record.email,
            reg_record.password_hash,
            reg_record.full_name,
            'user',
            true,
            reg_record.created_at
        )
        ON CONFLICT (username) DO NOTHING;
        
        RAISE NOTICE 'Usuário sincronizado: %', reg_record.username;
    END LOOP;
END $$;

-- Garantir que todos os usuários aprovados tenham role_id definido
DO $$
DECLARE
    user_role_id UUID;
BEGIN
    -- Buscar o ID do role 'vendedor' (level 1)
    SELECT id INTO user_role_id 
    FROM user_roles 
    WHERE name = 'vendedor' OR level = 1 
    LIMIT 1;
    
    -- Se não encontrar, criar o role vendedor
    IF user_role_id IS NULL THEN
        INSERT INTO user_roles (name, display_name, description, level, permissions)
        VALUES ('vendedor', 'Vendedor', 'Vendedor com acesso básico ao sistema', 1, ARRAY['view_dashboard', 'manage_clients', 'manage_opportunities', 'view_tickets'])
        RETURNING id INTO user_role_id;
        
        RAISE NOTICE 'Role vendedor criado com ID: %', user_role_id;
    END IF;
    
    -- Atualizar usuários sem role_id
    UPDATE approved_users 
    SET role_id = user_role_id 
    WHERE role_id IS NULL AND role = 'user';
    
    RAISE NOTICE 'Usuários atualizados com role_id: %', user_role_id;
END $$;

-- Criar índices para melhor performance se não existirem
CREATE INDEX IF NOT EXISTS idx_approved_users_username_active 
ON approved_users(username) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_approved_users_email_active 
ON approved_users(email) WHERE is_active = true;

-- Verificar e corrigir dados inconsistentes
UPDATE approved_users 
SET is_active = true 
WHERE is_active IS NULL;

UPDATE approved_users 
SET role = 'user' 
WHERE role IS NULL;

-- Adicionar constraint para garantir que username não seja nulo
ALTER TABLE approved_users 
ALTER COLUMN username SET NOT NULL;

-- Adicionar constraint para garantir que full_name não seja nulo
ALTER TABLE approved_users 
ALTER COLUMN full_name SET NOT NULL;

-- Verificar se há duplicatas e remover se necessário
WITH duplicates AS (
    SELECT username, email, 
           ROW_NUMBER() OVER (PARTITION BY username ORDER BY created_at DESC) as rn
    FROM approved_users
)
DELETE FROM approved_users 
WHERE id IN (
    SELECT au.id 
    FROM approved_users au
    JOIN duplicates d ON au.username = d.username 
    WHERE d.rn > 1
);

-- Log final
DO $$
DECLARE
    total_approved INTEGER;
    total_registrations INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_approved FROM approved_users WHERE is_active = true;
    SELECT COUNT(*) INTO total_registrations FROM user_registrations WHERE status = 'approved';
    
    RAISE NOTICE 'Total de usuários aprovados ativos: %', total_approved;
    RAISE NOTICE 'Total de registros aprovados: %', total_registrations;
    RAISE NOTICE 'RLS desabilitado na tabela approved_users';
END $$;