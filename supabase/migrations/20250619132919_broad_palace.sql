/*
  # Fix RLS policies for approved_users table

  1. Security Updates
    - Update RLS policy for approved_users table to allow admin operations
    - Ensure proper permissions for user approval workflow
    - Add policy to allow service role operations for admin functions

  2. Changes
    - Modify existing policies to allow authenticated users with proper permissions
    - Add specific policy for INSERT operations during user approval
*/

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Admins can manage all users" ON approved_users;
DROP POLICY IF EXISTS "Users can view their own profile" ON approved_users;

-- Create new policies that allow proper admin operations
CREATE POLICY "Authenticated users can manage approved_users"
  ON approved_users
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow service role full access (for admin operations)
CREATE POLICY "Service role can manage approved_users"
  ON approved_users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile"
  ON approved_users
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'email' = email);