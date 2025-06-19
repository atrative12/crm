import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { Client, Opportunity } from '../types';
import { supabase } from '../lib/supabase';

interface DataContextType {
  clients: Client[];
  opportunities: Opportunity[];
  addClient: (clientData: Omit<Client, 'id' | 'createdAt'>) => Promise<Client>;
  updateClient: (updatedClient: Client) => Promise<void>;
  deleteClient: (clientId: string) => Promise<void>;
  addOpportunity: (opportunityData: Omit<Opportunity, 'id' | 'createdAt'>) => Promise<void>;
  updateOpportunity: (updatedOpportunity: Opportunity) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
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
      console.log('🔄 Carregando dados do Supabase...');

      // Load clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (clientsError) {
        console.error('❌ Erro ao carregar clientes:', clientsError);
        throw clientsError;
      }

      console.log('✅ Clientes carregados:', clientsData?.length || 0);

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

      if (opportunitiesError) {
        console.error('❌ Erro ao carregar oportunidades:', opportunitiesError);
        throw opportunitiesError;
      }

      console.log('✅ Oportunidades carregadas:', opportunitiesData?.length || 0);

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

    } catch (err: any) {
      console.error('❌ Erro ao carregar dados:', err);
      setError(`Erro ao carregar dados: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = useCallback(async () => {
    await loadData();
  }, []);

  const addClient = useCallback(async (clientData: Omit<Client, 'id' | 'createdAt'>): Promise<Client> => {
    try {
      setError(null);
      console.log('🔄 Adicionando cliente:', clientData.nomeCompleto);
      
      // Validate required fields
      if (!clientData.nomeCompleto?.trim()) {
        throw new Error('Nome completo é obrigatório');
      }
      
      // Transform app format to database format
      const dbClient = {
        nome_completo: clientData.nomeCompleto.trim(),
        email: clientData.email?.trim() || null,
        telefone: clientData.telefone?.trim() || null,
        origem: clientData.origem?.trim() || null,
        status: clientData.status || 'Novo',
        valor_potencial: clientData.valorPotencial || 0,
        observacoes: clientData.observacoes?.trim() || null,
        cidade: clientData.cidade?.trim() || null,
        estado: clientData.estado?.trim() || null,
        created_by: clientData.createdBy?.trim() || null
      };

      console.log('📤 Enviando dados para Supabase:', dbClient);

      const { data, error } = await supabase
        .from('clients')
        .insert([dbClient])
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao inserir cliente:', error);
        
        // Handle specific errors
        if (error.code === '23505') {
          throw new Error('Cliente com este email já existe');
        } else if (error.message.includes('permission') || error.message.includes('policy')) {
          throw new Error('Você não tem permissão para criar clientes');
        } else {
          throw new Error(`Erro do banco de dados: ${error.message}`);
        }
      }

      if (!data) {
        throw new Error('Nenhum dado retornado após inserção');
      }

      console.log('✅ Cliente inserido com sucesso:', data);

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

      // Atualizar estado local
      setClients(prev => [newClient, ...prev]);

      return newClient;

    } catch (err: any) {
      console.error('❌ Erro ao adicionar cliente:', err);
      const errorMessage = err.message || 'Erro desconhecido ao adicionar cliente';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const updateClient = useCallback(async (updatedClient: Client) => {
    try {
      setError(null);
      console.log('🔄 Atualizando cliente:', updatedClient.nomeCompleto);
      
      // Validate required fields
      if (!updatedClient.nomeCompleto?.trim()) {
        throw new Error('Nome completo é obrigatório');
      }
      
      // Transform app format to database format
      const dbClient = {
        nome_completo: updatedClient.nomeCompleto.trim(),
        email: updatedClient.email?.trim() || null,
        telefone: updatedClient.telefone?.trim() || null,
        origem: updatedClient.origem?.trim() || null,
        status: updatedClient.status,
        valor_potencial: updatedClient.valorPotencial,
        observacoes: updatedClient.observacoes?.trim() || null,
        cidade: updatedClient.cidade?.trim() || null,
        estado: updatedClient.estado?.trim() || null,
        created_by: updatedClient.createdBy?.trim() || null
      };

      const { error } = await supabase
        .from('clients')
        .update(dbClient)
        .eq('id', updatedClient.id);

      if (error) {
        console.error('❌ Erro ao atualizar cliente:', error);
        
        if (error.message.includes('permission') || error.message.includes('policy')) {
          throw new Error('Você não tem permissão para atualizar clientes');
        } else {
          throw new Error(`Erro do banco de dados: ${error.message}`);
        }
      }

      console.log('✅ Cliente atualizado com sucesso');

      // Atualizar estado local
      setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));

    } catch (err: any) {
      console.error('❌ Erro ao atualizar cliente:', err);
      const errorMessage = err.message || 'Erro desconhecido ao atualizar cliente';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const deleteClient = useCallback(async (clientId: string) => {
    try {
      setError(null);
      console.log('🔄 Excluindo cliente:', clientId);
      
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (error) {
        console.error('❌ Erro ao excluir cliente:', error);
        
        if (error.message.includes('permission') || error.message.includes('policy')) {
          throw new Error('Você não tem permissão para excluir clientes');
        } else {
          throw new Error(`Erro do banco de dados: ${error.message}`);
        }
      }

      console.log('✅ Cliente excluído com sucesso');

      // Atualizar estado local
      setClients(prev => prev.filter(c => c.id !== clientId));

    } catch (err: any) {
      console.error('❌ Erro ao excluir cliente:', err);
      const errorMessage = err.message || 'Erro desconhecido ao excluir cliente';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const addOpportunity = useCallback(async (opportunityData: Omit<Opportunity, 'id' | 'createdAt'>) => {
    try {
      setError(null);
      console.log('🔄 Adicionando oportunidade:', opportunityData.name);
      
      // Transform app format to database format
      const dbOpportunity = {
        name: opportunityData.name,
        client_name: opportunityData.clientName,
        value: opportunityData.value || 0,
        status: opportunityData.status || 'novo-lead',
        next_action: opportunityData.nextAction || null,
        description: opportunityData.description || null,
        expected_close_date: opportunityData.expectedCloseDate || null
      };

      const { data, error } = await supabase
        .from('opportunities')
        .insert([dbOpportunity])
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao inserir oportunidade:', error);
        throw error;
      }

      console.log('✅ Oportunidade inserida com sucesso:', data);

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

      // Atualizar estado local
      setOpportunities(prev => [newOpportunity, ...prev]);

    } catch (err: any) {
      console.error('❌ Erro ao adicionar oportunidade:', err);
      const errorMessage = err.message || 'Erro desconhecido ao adicionar oportunidade';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const updateOpportunity = useCallback(async (updatedOpportunity: Opportunity) => {
    try {
      setError(null);
      console.log('🔄 Atualizando oportunidade:', updatedOpportunity.name);
      
      // Transform app format to database format
      const dbOpportunity = {
        name: updatedOpportunity.name,
        client_name: updatedOpportunity.clientName,
        value: updatedOpportunity.value,
        status: updatedOpportunity.status,
        next_action: updatedOpportunity.nextAction || null,
        description: updatedOpportunity.description || null,
        expected_close_date: updatedOpportunity.expectedCloseDate || null
      };

      const { error } = await supabase
        .from('opportunities')
        .update(dbOpportunity)
        .eq('id', updatedOpportunity.id);

      if (error) {
        console.error('❌ Erro ao atualizar oportunidade:', error);
        throw error;
      }

      console.log('✅ Oportunidade atualizada com sucesso');

      // Atualizar estado local
      setOpportunities(prev => prev.map(o => o.id === updatedOpportunity.id ? updatedOpportunity : o));

    } catch (err: any) {
      console.error('❌ Erro ao atualizar oportunidade:', err);
      const errorMessage = err.message || 'Erro desconhecido ao atualizar oportunidade';
      setError(errorMessage);
      throw new Error(errorMessage);
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
    error,
    refreshData
  }), [clients, opportunities, addClient, updateClient, deleteClient, addOpportunity, updateOpportunity, isLoading, error, refreshData]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};