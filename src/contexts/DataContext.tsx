import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { Client, Opportunity } from '../types';
import { supabase } from '../lib/supabase';

interface DataContextType {
  clients: Client[];
  opportunities: Opportunity[];
  addClient: (clientData: Omit<Client, 'id' | 'createdAt'>) => Promise<void>;
  updateClient: (updatedClient: Client) => Promise<void>;
  deleteClient: (clientId: string) => Promise<void>;
  addOpportunity: (opportunityData: Omit<Opportunity, 'id' | 'createdAt'>) => Promise<void>;
  updateOpportunity: (updatedOpportunity: Opportunity) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data from Supabase on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (clientsError) throw clientsError;

      // Transform database format to app format
      const transformedClients: Client[] = (clientsData || []).map(client => ({
        id: client.id,
        nomeCompleto: client.nome_completo,
        email: client.email || '',
        telefone: client.telefone || '',
        origem: client.origem || '',
        status: client.status,
        valorPotencial: client.valor_potencial,
        observacoes: client.observacoes || '',
        cidade: client.cidade || '',
        estado: client.estado || '',
        createdAt: client.created_at,
        createdBy: client.created_by || ''
      }));

      setClients(transformedClients);

      // Load opportunities
      const { data: opportunitiesData, error: opportunitiesError } = await supabase
        .from('opportunities')
        .select('*')
        .order('created_at', { ascending: false });

      if (opportunitiesError) throw opportunitiesError;

      // Transform database format to app format
      const transformedOpportunities: Opportunity[] = (opportunitiesData || []).map(opp => ({
        id: opp.id,
        name: opp.name,
        clientName: opp.client_name,
        value: opp.value,
        status: opp.status,
        nextAction: opp.next_action || '',
        description: opp.description || '',
        expectedCloseDate: opp.expected_close_date || '',
        createdAt: opp.created_at
      }));

      setOpportunities(transformedOpportunities);

    } catch (err) {
      console.error('Error loading data:', err);
      setError('Erro ao carregar dados. Usando dados locais como fallback.');
      
      // Fallback to localStorage
      try {
        const savedClients = localStorage.getItem('crm_clients');
        if (savedClients) setClients(JSON.parse(savedClients));

        const savedOpportunities = localStorage.getItem('crm_opportunities');
        if (savedOpportunities) setOpportunities(JSON.parse(savedOpportunities));
      } catch (localError) {
        console.error("Failed to parse data from localStorage", localError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const addClient = useCallback(async (clientData: Omit<Client, 'id' | 'createdAt'>) => {
    try {
      setError(null);
      
      // Transform app format to database format
      const dbClient = {
        nome_completo: clientData.nomeCompleto,
        email: clientData.email,
        telefone: clientData.telefone,
        origem: clientData.origem,
        status: clientData.status || 'Novo',
        valor_potencial: clientData.valorPotencial || 0,
        observacoes: clientData.observacoes,
        cidade: clientData.cidade,
        estado: clientData.estado,
        created_by: clientData.createdBy
      };

      const { data, error } = await supabase
        .from('clients')
        .insert([dbClient])
        .select()
        .single();

      if (error) throw error;

      // Transform back to app format
      const newClient: Client = {
        id: data.id,
        nomeCompleto: data.nome_completo,
        email: data.email || '',
        telefone: data.telefone || '',
        origem: data.origem || '',
        status: data.status,
        valorPotencial: data.valor_potencial,
        observacoes: data.observacoes || '',
        cidade: data.cidade || '',
        estado: data.estado || '',
        createdAt: data.created_at,
        createdBy: data.created_by || ''
      };

      setClients(prev => [newClient, ...prev]);
      
      // Also save to localStorage as backup
      const updated = [newClient, ...clients];
      localStorage.setItem('crm_clients', JSON.stringify(updated));

    } catch (err) {
      console.error('Error adding client:', err);
      setError('Erro ao adicionar cliente. Salvando localmente.');
      
      // Fallback to localStorage
      const newClient: Client = {
        ...clientData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        status: clientData.status || 'Novo',
      };
      
      setClients(prev => {
        const updated = [newClient, ...prev];
        localStorage.setItem('crm_clients', JSON.stringify(updated));
        return updated;
      });
    }
  }, [clients]);

  const updateClient = useCallback(async (updatedClient: Client) => {
    try {
      setError(null);
      
      // Transform app format to database format
      const dbClient = {
        nome_completo: updatedClient.nomeCompleto,
        email: updatedClient.email,
        telefone: updatedClient.telefone,
        origem: updatedClient.origem,
        status: updatedClient.status,
        valor_potencial: updatedClient.valorPotencial,
        observacoes: updatedClient.observacoes,
        cidade: updatedClient.cidade,
        estado: updatedClient.estado,
        created_by: updatedClient.createdBy
      };

      const { error } = await supabase
        .from('clients')
        .update(dbClient)
        .eq('id', updatedClient.id);

      if (error) throw error;

      setClients(prev => {
        const updated = prev.map(c => c.id === updatedClient.id ? updatedClient : c);
        localStorage.setItem('crm_clients', JSON.stringify(updated));
        return updated;
      });

    } catch (err) {
      console.error('Error updating client:', err);
      setError('Erro ao atualizar cliente. Salvando localmente.');
      
      // Fallback to localStorage
      setClients(prev => {
        const updated = prev.map(c => c.id === updatedClient.id ? updatedClient : c);
        localStorage.setItem('crm_clients', JSON.stringify(updated));
        return updated;
      });
    }
  }, []);

  const deleteClient = useCallback(async (clientId: string) => {
    try {
      setError(null);
      
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (error) throw error;

      setClients(prev => {
        const updated = prev.filter(c => c.id !== clientId);
        localStorage.setItem('crm_clients', JSON.stringify(updated));
        return updated;
      });

    } catch (err) {
      console.error('Error deleting client:', err);
      setError('Erro ao excluir cliente. Removendo localmente.');
      
      // Fallback to localStorage
      setClients(prev => {
        const updated = prev.filter(c => c.id !== clientId);
        localStorage.setItem('crm_clients', JSON.stringify(updated));
        return updated;
      });
    }
  }, []);

  const addOpportunity = useCallback(async (opportunityData: Omit<Opportunity, 'id' | 'createdAt'>) => {
    try {
      setError(null);
      
      // Transform app format to database format
      const dbOpportunity = {
        name: opportunityData.name,
        client_name: opportunityData.clientName,
        value: opportunityData.value || 0,
        status: opportunityData.status || 'novo-lead',
        next_action: opportunityData.nextAction,
        description: opportunityData.description,
        expected_close_date: opportunityData.expectedCloseDate || null
      };

      const { data, error } = await supabase
        .from('opportunities')
        .insert([dbOpportunity])
        .select()
        .single();

      if (error) throw error;

      // Transform back to app format
      const newOpportunity: Opportunity = {
        id: data.id,
        name: data.name,
        clientName: data.client_name,
        value: data.value,
        status: data.status,
        nextAction: data.next_action || '',
        description: data.description || '',
        expectedCloseDate: data.expected_close_date || '',
        createdAt: data.created_at
      };

      setOpportunities(prev => [newOpportunity, ...prev]);
      
      // Also save to localStorage as backup
      const updated = [newOpportunity, ...opportunities];
      localStorage.setItem('crm_opportunities', JSON.stringify(updated));

    } catch (err) {
      console.error('Error adding opportunity:', err);
      setError('Erro ao adicionar oportunidade. Salvando localmente.');
      
      // Fallback to localStorage
      const newOpportunity: Opportunity = {
        ...opportunityData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      
      setOpportunities(prev => {
        const updated = [newOpportunity, ...prev];
        localStorage.setItem('crm_opportunities', JSON.stringify(updated));
        return updated;
      });
    }
  }, [opportunities]);

  const updateOpportunity = useCallback(async (updatedOpportunity: Opportunity) => {
    try {
      setError(null);
      
      // Transform app format to database format
      const dbOpportunity = {
        name: updatedOpportunity.name,
        client_name: updatedOpportunity.clientName,
        value: updatedOpportunity.value,
        status: updatedOpportunity.status,
        next_action: updatedOpportunity.nextAction,
        description: updatedOpportunity.description,
        expected_close_date: updatedOpportunity.expectedCloseDate || null
      };

      const { error } = await supabase
        .from('opportunities')
        .update(dbOpportunity)
        .eq('id', updatedOpportunity.id);

      if (error) throw error;

      setOpportunities(prev => {
        const updated = prev.map(o => o.id === updatedOpportunity.id ? updatedOpportunity : o);
        localStorage.setItem('crm_opportunities', JSON.stringify(updated));
        return updated;
      });

    } catch (err) {
      console.error('Error updating opportunity:', err);
      setError('Erro ao atualizar oportunidade. Salvando localmente.');
      
      // Fallback to localStorage
      setOpportunities(prev => {
        const updated = prev.map(o => o.id === updatedOpportunity.id ? updatedOpportunity : o);
        localStorage.setItem('crm_opportunities', JSON.stringify(updated));
        return updated;
      });
    }
  }, []);

  // Optimize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    clients,
    opportunities,
    addClient,
    updateClient,
    deleteClient,
    addOpportunity,
    updateOpportunity,
    isLoading,
    error
  }), [clients, opportunities, addClient, updateClient, deleteClient, addOpportunity, updateOpportunity, isLoading, error]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};