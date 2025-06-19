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
  cidade?: string;
  estado?: string;
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

export interface Meeting {
  id: string;
  title: string;
  description: string;
  clientName: string;
  meetingDate: string;
  meetingTime: string;
  durationMinutes: number;
  location: string;
  meetingType: 'presencial' | 'online' | 'telefone';
  status: 'agendada' | 'confirmada' | 'realizada' | 'cancelada';
  attendees: string[];
  notes: string;
  createdBy: string;
  createdAt: string;
}