/*
  # Fix RLS Policies to Resolve Permission Errors

  1. Security Updates
    - Fix recursive policies on user_roles table
    - Update approved_users policies to work with authentication
    - Ensure proper access control for tickets and comments
    - Add proper policies for user management operations

  2. Changes
    - Remove problematic recursive policies
    - Add service_role policies for admin operations
    - Update authentication-based policies
    - Fix infinite recursion issues
*/

-- Drop all existing problematic policies
DROP POLICY IF EXISTS "Anyone can view roles" ON user_roles;
DROP POLICY IF EXISTS "Only admins can manage roles" ON user_roles;
DROP POLICY IF EXISTS "Authenticated users can view roles" ON user_roles;
DROP POLICY IF EXISTS "Public can view roles" ON user_roles;
DROP POLICY IF EXISTS "Service role can manage roles" ON user_roles;

-- Drop problematic policies on approved_users
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON approved_users;
DROP POLICY IF EXISTS "Allow all operations for service role" ON approved_users;

-- Drop problematic policies on tickets
DROP POLICY IF EXISTS "Users can view their assigned tickets" ON tickets;
DROP POLICY IF EXISTS "Managers and admins can view all tickets" ON tickets;
DROP POLICY IF EXISTS "Managers and admins can create tickets" ON tickets;
DROP POLICY IF EXISTS "Assigned users can update their tickets" ON tickets;

-- Drop problematic policies on ticket_comments
DROP POLICY IF EXISTS "Users can view comments on their tickets" ON ticket_comments;
DROP POLICY IF EXISTS "Users can add comments to their tickets" ON ticket_comments;

-- Create simple, non-recursive policies for user_roles
CREATE POLICY "Anyone can view user roles"
  ON user_roles
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage user roles"
  ON user_roles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create policies for approved_users that don't cause recursion
CREATE POLICY "Service role can manage approved users"
  ON approved_users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view approved users"
  ON approved_users
  FOR SELECT
  TO authenticated
  USING (true);

-- Create simple policies for tickets
CREATE POLICY "Service role can manage all tickets"
  ON tickets
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view their assigned tickets"
  ON tickets
  FOR SELECT
  TO public
  USING (assigned_to = auth.uid() OR assigned_by = auth.uid());

CREATE POLICY "Managers and admins can view all tickets"
  ON tickets
  FOR SELECT
  TO public
  USING (EXISTS (
    SELECT 1 FROM approved_users u 
    JOIN user_roles r ON u.role_id = r.id 
    WHERE u.id = auth.uid() AND r.level >= 2
  ));

CREATE POLICY "Managers and admins can create tickets"
  ON tickets
  FOR INSERT
  TO public
  WITH CHECK (EXISTS (
    SELECT 1 FROM approved_users u 
    JOIN user_roles r ON u.role_id = r.id 
    WHERE u.id = auth.uid() AND r.level >= 2
  ));

CREATE POLICY "Assigned users can update their tickets"
  ON tickets
  FOR UPDATE
  TO public
  USING (assigned_to = auth.uid() OR assigned_by = auth.uid() OR EXISTS (
    SELECT 1 FROM approved_users u 
    JOIN user_roles r ON u.role_id = r.id 
    WHERE u.id = auth.uid() AND r.level >= 2
  ));

-- Create policies for ticket_comments
CREATE POLICY "Service role can manage all ticket comments"
  ON ticket_comments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view comments on their tickets"
  ON ticket_comments
  FOR SELECT
  TO public
  USING (EXISTS (
    SELECT 1 FROM tickets t 
    WHERE t.id = ticket_id AND (t.assigned_to = auth.uid() OR t.assigned_by = auth.uid())
  ) OR EXISTS (
    SELECT 1 FROM approved_users u 
    JOIN user_roles r ON u.role_id = r.id 
    WHERE u.id = auth.uid() AND r.level >= 2
  ));

CREATE POLICY "Users can add comments to their tickets"
  ON ticket_comments
  FOR INSERT
  TO public
  WITH CHECK (EXISTS (
    SELECT 1 FROM tickets t 
    WHERE t.id = ticket_id AND (t.assigned_to = auth.uid() OR t.assigned_by = auth.uid())
  ) OR EXISTS (
    SELECT 1 FROM approved_users u 
    JOIN user_roles r ON u.role_id = r.id 
    WHERE u.id = auth.uid() AND r.level >= 2
  ));

-- Create policies for user_permissions
CREATE POLICY "Service role can manage all user permissions"
  ON user_permissions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view permissions"
  ON user_permissions
  FOR SELECT
  TO authenticated
  USING (true);

-- Ensure all tables have RLS enabled
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE approved_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- Create a function to check if user is admin (to be used by application, not policies)
CREATE OR REPLACE FUNCTION is_user_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM approved_users u 
    JOIN user_roles r ON u.role_id = r.id 
    WHERE u.id = user_id AND r.level >= 3
  );
END;
$$;

-- Create a function to check if user is manager or admin
CREATE OR REPLACE FUNCTION is_user_manager_or_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM approved_users u 
    JOIN user_roles r ON u.role_id = r.id 
    WHERE u.id = user_id AND r.level >= 2
  );
END;
$$;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION is_user_admin(uuid) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION is_user_manager_or_admin(uuid) TO authenticated, anon, service_role;

-- Verify the setup
SELECT 'RLS policies updated successfully' as status;