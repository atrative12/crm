/*
  # Create tasks table

  1. New Tables
    - `tasks`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `description` (text)
      - `due_date` (date, not null)
      - `due_time` (time)
      - `priority` (text, default 'Média')
      - `status` (text, default 'Pendente')
      - `assigned_to` (text)
      - `created_by` (text)
      - `created_at` (timestamp with time zone, default now())
      - `updated_at` (timestamp with time zone, default now())

  2. Security
    - Enable RLS on `tasks` table
    - Add policy for authenticated users to manage tasks
*/

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  due_date date NOT NULL,
  due_time time,
  priority text DEFAULT 'Média',
  status text DEFAULT 'Pendente',
  assigned_to text,
  created_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage tasks"
  ON tasks
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create trigger for tasks table
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();