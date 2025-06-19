/*
  # Função RPC para aprovação de usuários

  1. Nova Função
    - `approve_user_registration` - Função para aprovar usuários de forma segura
    - Contorna limitações de RLS
    - Valida permissões do administrador
    - Cria usuário aprovado e atualiza status da solicitação

  2. Segurança
    - Verifica se quem está aprovando é administrador
    - Previne duplicação de usuários
    - Transação atômica para consistência
*/

-- Função para aprovar usuário
CREATE OR REPLACE FUNCTION approve_user_registration(
  p_registration_id uuid,
  p_approved_by text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_registration record;
  v_admin_check record;
  v_existing_user record;
  v_default_role_id uuid;
  v_new_user_id uuid;
  v_result json;
BEGIN
  -- Verificar se quem está aprovando é administrador
  SELECT * INTO v_admin_check
  FROM admin_users 
  WHERE username = p_approved_by AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuário não tem permissões de administrador'
    );
  END IF;

  -- Buscar a solicitação de registro
  SELECT * INTO v_registration
  FROM user_registrations 
  WHERE id = p_registration_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Solicitação não encontrada ou já processada'
    );
  END IF;

  -- Verificar se usuário já existe em approved_users
  SELECT * INTO v_existing_user
  FROM approved_users 
  WHERE username = v_registration.username OR email = v_registration.email;
  
  IF FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuário já existe na base de usuários aprovados'
    );
  END IF;

  -- Buscar cargo padrão de vendedor
  SELECT id INTO v_default_role_id
  FROM user_roles 
  WHERE name = 'salesperson';
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Cargo padrão não encontrado'
    );
  END IF;

  -- Iniciar transação para operações atômicas
  BEGIN
    -- Inserir usuário aprovado
    INSERT INTO approved_users (
      username,
      email,
      password_hash,
      full_name,
      role,
      role_id,
      is_active
    ) VALUES (
      v_registration.username,
      v_registration.email,
      v_registration.password_hash,
      v_registration.full_name,
      'user',
      v_default_role_id,
      true
    ) RETURNING id INTO v_new_user_id;

    -- Atualizar status da solicitação
    UPDATE user_registrations 
    SET 
      status = 'approved',
      approved_at = now(),
      approved_by = p_approved_by,
      updated_at = now()
    WHERE id = p_registration_id;

    -- Retornar sucesso
    v_result := json_build_object(
      'success', true,
      'message', 'Usuário aprovado com sucesso',
      'user_id', v_new_user_id,
      'username', v_registration.username
    );

  EXCEPTION WHEN OTHERS THEN
    -- Em caso de erro, retornar detalhes
    v_result := json_build_object(
      'success', false,
      'error', 'Erro ao processar aprovação: ' || SQLERRM
    );
  END;

  RETURN v_result;
END;
$$;

-- Função para rejeitar usuário
CREATE OR REPLACE FUNCTION reject_user_registration(
  p_registration_id uuid,
  p_rejected_by text,
  p_rejection_reason text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_check record;
  v_registration record;
  v_result json;
BEGIN
  -- Verificar se quem está rejeitando é administrador
  SELECT * INTO v_admin_check
  FROM admin_users 
  WHERE username = p_rejected_by AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuário não tem permissões de administrador'
    );
  END IF;

  -- Buscar a solicitação de registro
  SELECT * INTO v_registration
  FROM user_registrations 
  WHERE id = p_registration_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Solicitação não encontrada ou já processada'
    );
  END IF;

  -- Atualizar status da solicitação
  UPDATE user_registrations 
  SET 
    status = 'rejected',
    rejection_reason = p_rejection_reason,
    updated_at = now()
  WHERE id = p_registration_id;

  -- Retornar sucesso
  v_result := json_build_object(
    'success', true,
    'message', 'Usuário rejeitado com sucesso',
    'username', v_registration.username
  );

  RETURN v_result;
END;
$$;

-- Conceder permissões para executar as funções
GRANT EXECUTE ON FUNCTION approve_user_registration(uuid, text) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION reject_user_registration(uuid, text, text) TO authenticated, anon, service_role;

-- Verificar se as funções foram criadas
SELECT 'Funções RPC criadas com sucesso' as status;