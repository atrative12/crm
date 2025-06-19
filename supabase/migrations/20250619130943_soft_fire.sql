/*
  # Create meetings table

  1. New Tables
    - `meetings`
      - `id` (uuid, primary key)
      - `title` (text, not null)
      - `description` (text)
      - `client_name` (text)
      - `meeting_date` (date, not null)
      - `meeting_time` (time)
      - `duration_minutes` (integer, default 60)
      - `location` (text)
      - `meeting_type` (text, default 'presencial')
      - `status` (text, default 'agendada')
      - `attendees` (text[])
      - `notes` (text)
      - `created_by` (text)
      - `created_at` (timestamp with time zone, default now())
      - `updated_at` (timestamp with time zone, default now())

  2. Security
    - Enable RLS on `meetings` table
    - Add policy for authenticated users to manage meetings
*/

CREATE TABLE IF NOT EXISTS meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  client_name text,
  meeting_date date NOT NULL,
  meeting_time time,
  duration_minutes integer DEFAULT 60,
  location text,
  meeting_type text DEFAULT 'presencial',
  status text DEFAULT 'agendada',
  attendees text[],
  notes text,
  created_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage meetings"
  ON meetings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create trigger for meetings table
CREATE TRIGGER update_meetings_updated_at
  BEFORE UPDATE ON meetings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();