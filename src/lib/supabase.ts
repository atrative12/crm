import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string;
          nome_completo: string;
          email: string | null;
          telefone: string | null;
          origem: string | null;
          status: string;
          valor_potencial: number;
          observacoes: string | null;
          cidade: string | null;
          estado: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nome_completo: string;
          email?: string | null;
          telefone?: string | null;
          origem?: string | null;
          status?: string;
          valor_potencial?: number;
          observacoes?: string | null;
          cidade?: string | null;
          estado?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nome_completo?: string;
          email?: string | null;
          telefone?: string | null;
          origem?: string | null;
          status?: string;
          valor_potencial?: number;
          observacoes?: string | null;
          cidade?: string | null;
          estado?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      opportunities: {
        Row: {
          id: string;
          name: string;
          client_name: string;
          value: number;
          status: string;
          next_action: string | null;
          description: string | null;
          expected_close_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          client_name: string;
          value?: number;
          status?: string;
          next_action?: string | null;
          description?: string | null;
          expected_close_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          client_name?: string;
          value?: number;
          status?: string;
          next_action?: string | null;
          description?: string | null;
          expected_close_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      meetings: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          client_name: string | null;
          meeting_date: string;
          meeting_time: string | null;
          duration_minutes: number;
          location: string | null;
          meeting_type: string;
          status: string;
          attendees: string[] | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          client_name?: string | null;
          meeting_date: string;
          meeting_time?: string | null;
          duration_minutes?: number;
          location?: string | null;
          meeting_type?: string;
          status?: string;
          attendees?: string[] | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          client_name?: string | null;
          meeting_date?: string;
          meeting_time?: string | null;
          duration_minutes?: number;
          location?: string | null;
          meeting_type?: string;
          status?: string;
          attendees?: string[] | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          due_date: string;
          due_time: string | null;
          priority: string;
          status: string;
          assigned_to: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          due_date: string;
          due_time?: string | null;
          priority?: string;
          status?: string;
          assigned_to?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          due_date?: string;
          due_time?: string | null;
          priority?: string;
          status?: string;
          assigned_to?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}