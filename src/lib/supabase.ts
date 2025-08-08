import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const SUPABASE_AVAILABLE = Boolean(supabaseUrl && supabaseAnonKey);

// Utilidades para mock local (browser)
function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function nowIso() {
  return new Date().toISOString();
}

// Cliente Supabase Mock compatível com os usos do DataContext
function createMockSupabase() {
  const STORAGE_KEYS = {
    clients: 'mock_clients',
    opportunities: 'mock_opportunities',
  } as const;

  type ClientRow = {
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

  type OpportunityRow = {
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

  const db = {
    clients: loadFromStorage<ClientRow[]>(STORAGE_KEYS.clients, []),
    opportunities: loadFromStorage<OpportunityRow[]>(STORAGE_KEYS.opportunities, []),
  };

  function persist() {
    saveToStorage(STORAGE_KEYS.clients, db.clients);
    saveToStorage(STORAGE_KEYS.opportunities, db.opportunities);
  }

  function tableApi(table: 'clients' | 'opportunities') {
    return {
      select() {
        const api = {
          order(_col: string, opts?: { ascending?: boolean }) {
            const ascending = opts?.ascending ?? false;
            const data = [...db[table]].sort((a: any, b: any) => {
              const va = a.created_at || '';
              const vb = b.created_at || '';
              return ascending ? va.localeCompare(vb) : vb.localeCompare(va);
            });
            return Promise.resolve({ data, error: null });
          },
        };
        return api;
      },
      insert(rows: any[]) {
        const inserted = rows.map((row) => {
          const id = uid(table.slice(0, 3));
          const created_at = nowIso();
          const updated_at = created_at;
          const full = { id, created_at, updated_at, ...row };
          (db as any)[table].unshift(full);
          return full;
        });
        persist();
        return {
          select() {
            return {
              single() {
                return Promise.resolve({ data: inserted[0], error: null });
              },
            };
          },
        };
      },
      update(patch: any) {
        return {
          eq(column: string, value: any) {
            const list: any[] = (db as any)[table];
            const idx = list.findIndex((r) => r[column] === value);
            if (idx >= 0) {
              list[idx] = { ...list[idx], ...patch, updated_at: nowIso() };
              persist();
            }
            return Promise.resolve({ error: null });
          },
        };
      },
      delete() {
        return {
          eq(column: string, value: any) {
            const list: any[] = (db as any)[table];
            const filtered = list.filter((r) => r[column] !== value);
            (db as any)[table] = filtered;
            persist();
            return Promise.resolve({ error: null });
          },
        };
      },
    };
  }

  const mock = {
    from(tableName: string) {
      if (tableName !== 'clients' && tableName !== 'opportunities') {
        console.warn(`[MockSupabase] Tabela não suportada: ${tableName}`);
      }
      return tableApi(tableName as 'clients' | 'opportunities');
    },
  };

  console.warn('[MockSupabase] Rodando em modo DEMO sem credenciais do Supabase. Os dados ficam apenas no navegador.');
  return mock;
}

export const supabase: any = SUPABASE_AVAILABLE
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      db: { schema: 'public' },
      global: { headers: { 'x-application-name': 'atractive-crm' } },
    })
  : createMockSupabase();

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