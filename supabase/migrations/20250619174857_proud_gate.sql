/*
  # Fix User Roles RLS Policies

  1. Problem
    - Current RLS policies on user_roles table cause infinite recursion
    - The policy tries to join user_roles with itself through approved_users
    - This creates a circular dependency when evaluating permissions

  2. Solution
    - Drop the problematic policies
    - Create simpler, non-recursive policies
    - Use direct user checks instead of role-based checks for role management
    - Allow authenticated users to view roles (needed for dropdowns)
    - Restrict role management to service_role only

  3. Security
    - Authenticated users can view roles (safe for UI dropdowns)
    - Only service_role can modify roles (admin operations go through service_role)
    - Remove circular dependency that caused infinite recursion
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Anyone can view roles" ON user_roles;
DROP POLICY IF EXISTS "Only admins can manage roles" ON user_roles;

-- Create new non-recursive policies
-- Allow authenticated users to view roles (needed for UI dropdowns and user management)
CREATE POLICY "Authenticated users can view roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow public to view roles (needed for registration and public interfaces)
CREATE POLICY "Public can view roles"
  ON user_roles
  FOR SELECT
  TO public
  USING (true);

-- Only service_role can manage roles (admin operations will use service_role)
CREATE POLICY "Service role can manage roles"
  ON user_roles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;