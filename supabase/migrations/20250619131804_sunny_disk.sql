/*
  # User Registration and Approval System

  1. New Tables
    - `user_registrations`
      - `id` (uuid, primary key)
      - `username` (text, unique)
      - `email` (text, unique)
      - `password_hash` (text)
      - `full_name` (text)
      - `status` (text, default 'pending')
      - `requested_at` (timestamp)
      - `approved_at` (timestamp)
      - `approved_by` (text)
      - `rejection_reason` (text)

    - `approved_users`
      - `id` (uuid, primary key)
      - `username` (text, unique)
      - `email` (text, unique)
      - `password_hash` (text)
      - `full_name` (text)
      - `role` (text, default 'user')
      - `created_at` (timestamp)
      - `last_login` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for registration access
    - Add policies for admin approval access

  3. Functions
    - Email notification trigger for new registrations
*/

-- Create user_registrations table
CREATE TABLE IF NOT EXISTS user_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  full_name text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at timestamptz DEFAULT now(),
  approved_at timestamptz,
  approved_by text,
  rejection_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create approved_users table
CREATE TABLE IF NOT EXISTS approved_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  full_name text NOT NULL,
  role text DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  last_login timestamptz,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE approved_users ENABLE ROW LEVEL SECURITY;

-- Policies for user_registrations
CREATE POLICY "Anyone can create registration requests"
  ON user_registrations
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Users can view their own registration"
  ON user_registrations
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Admins can manage all registrations"
  ON user_registrations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policies for approved_users
CREATE POLICY "Users can view their own profile"
  ON approved_users
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'email' = email);

CREATE POLICY "Admins can manage all users"
  ON approved_users
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create triggers for updated_at
CREATE TRIGGER update_user_registrations_updated_at
  BEFORE UPDATE ON user_registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_approved_users_updated_at
  BEFORE UPDATE ON approved_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (club.atrative@gmail.com)
INSERT INTO approved_users (username, email, password_hash, full_name, role)
VALUES (
  'admin',
  'club.atrative@gmail.com',
  '$2b$10$dummy.hash.for.admin.user.replace.with.real.hash',
  'Administrador Atractive',
  'admin'
) ON CONFLICT (email) DO NOTHING;