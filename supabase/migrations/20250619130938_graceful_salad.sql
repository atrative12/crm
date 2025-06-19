/*
  # Create opportunities table

  1. New Tables
    - `opportunities`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `client_name` (text, not null)
      - `value` (numeric, default 0)
      - `status` (text, default 'novo-lead')
      - `next_action` (text)
      - `description` (text)
      - `expected_close_date` (date)
      - `created_at` (timestamp with time zone, default now())
      - `updated_at` (timestamp with time zone, default now())

  2. Security
    - Enable RLS on `opportunities` table
    - Add policy for authenticated users to manage opportunities
*/

CREATE TABLE IF NOT EXISTS opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  client_name text NOT NULL,
  value numeric DEFAULT 0,
  status text DEFAULT 'novo-lead',
  next_action text,
  description text,
  expected_close_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage opportunities"
  ON opportunities
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create trigger for opportunities table
CREATE TRIGGER update_opportunities_updated_at
  BEFORE UPDATE ON opportunities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();