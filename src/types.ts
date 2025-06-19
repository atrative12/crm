// src/types.ts

export interface Client {
  id: string;
  nomeCompleto: string;
  email: string;
  telefone: string;
  origem: string;
  status: string;
  valorPotencial: number;
  observacoes: string;
  createdAt: string;
  createdBy?: string;
  cidade?: string;   // <-- Linha necessária
  estado?: string;   // <-- Linha necessária
}

export interface Opportunity {
  id: string;
  name: string;
  clientName: string;
  value: number;
  status: string;
  nextAction: string;
  description: string;
  createdAt: string;
  expectedCloseDate?: string;
}

export interface Task {
    id: string;
    name: string;
    description: string;
    dueDate: string;
    dueTime: string;
    priority: 'Alta' | 'Média' | 'Baixa';
    status: 'Pendente' | 'Em Andamento' | 'Concluída';
    assignedTo: string;
    createdAt: string;
}