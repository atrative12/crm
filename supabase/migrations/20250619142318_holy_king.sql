-- Criar função RPC para aprovar usuários
-- Esta função vai contornar as políticas RLS

CREATE OR REPLACE FUNCTION approve_user_registration(
  p_username TEXT,
  p_email TEXT,
  p_password_hash TEXT,
  p_full_name TEXT,
  p_registration_id UUID,
  p_approved_by TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com privilégios do proprietário da função
AS $$
DECLARE
  new_user_id UUID;
  result JSON;
BEGIN
  -- Inserir o usuário na tabela approved_users
  INSERT INTO approved_users (
    username,
    email,
    password_hash,
    full_name,
    role,
    is_active
  ) VALUES (
    p_username,
    p_email,
    p_password_hash,
    p_full_name,
    'user',
    true
  ) RETURNING id INTO new_user_id;
  
  -- Atualizar o status da registration
  UPDATE user_registrations 
  SET 
    status = 'approved',
    approved_at = now(),
    approved_by = p_approved_by
  WHERE id = p_registration_id;
  
  -- Retornar resultado
  result := json_build_object(
    'success', true,
    'user_id', new_user_id,
    'message', 'Usuário aprovado com sucesso'
  );
  
  RETURN result;
  
EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object(
      'success', false,
      'error', 'duplicate',
      'message', 'Usuário já existe'
    );
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'unknown',
      'message', SQLERRM
    );
END;
$$;

-- Dar permissões para a função
GRANT EXECUTE ON FUNCTION approve_user_registration TO authenticated;
GRANT EXECUTE ON FUNCTION approve_user_registration TO anon;