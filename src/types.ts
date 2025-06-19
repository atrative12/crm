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

export interface UserRegistration {
  id: string;
  username: string;
  email: string;
  fullName: string;
  passwordHash: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
}

export interface UserRole {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  level: number;
  permissions: string[];
  createdAt: string;
}

export interface ApprovedUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: 'user' | 'admin';
  roleId?: string;
  userRole?: UserRole;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface Ticket {
  id: string;
  title: string;
  description?: string;
  type: 'task' | 'objective' | 'training' | 'meeting';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo?: string;
  assignedBy?: string;
  assignedToUser?: ApprovedUser;
  assignedByUser?: ApprovedUser;
  dueDate?: string;
  dueTime?: string;
  completionNotes?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  userId: string;
  user?: ApprovedUser;
  comment: string;
  createdAt: string;
}

export interface UserPermission {
  id: string;
  userId: string;
  permissionName: string;
  granted: boolean;
  grantedBy?: string;
  grantedAt?: string;
  createdAt: string;
}

export interface Permission {
  name: string;
  label: string;
  description: string;
  category: string;
}

export const AVAILABLE_PERMISSIONS: Permission[] = [
  {
    name: 'view_dashboard',
    label: 'Ver Dashboard',
    description: 'Acesso ao painel principal com métricas e gráficos',
    category: 'Visualização'
  },
  {
    name: 'manage_clients',
    label: 'Gerenciar Clientes',
    description: 'Criar, editar e excluir clientes',
    category: 'Clientes'
  },
  {
    name: 'manage_opportunities',
    label: 'Gerenciar Oportunidades',
    description: 'Criar, editar e mover oportunidades no pipeline',
    category: 'Vendas'
  },
  {
    name: 'manage_tasks',
    label: 'Gerenciar Tarefas',
    description: 'Criar, editar e concluir tarefas',
    category: 'Produtividade'
  },
  {
    name: 'manage_meetings',
    label: 'Gerenciar Reuniões',
    description: 'Agendar, editar e cancelar reuniões',
    category: 'Produtividade'
  },
  {
    name: 'view_whatsapp',
    label: 'WhatsApp',
    description: 'Acesso ao módulo de WhatsApp Business',
    category: 'Comunicação'
  },
  {
    name: 'manage_ai_agents',
    label: 'Agentes de IA',
    description: 'Configurar e gerenciar agentes de inteligência artificial',
    category: 'Automação'
  },
  {
    name: 'view_reports',
    label: 'Relatórios',
    description: 'Visualizar relatórios e análises',
    category: 'Relatórios'
  },
  {
    name: 'export_data',
    label: 'Exportar Dados',
    description: 'Exportar dados em PDF e outros formatos',
    category: 'Relatórios'
  },
  {
    name: 'manage_users',
    label: 'Gerenciar Usuários',
    description: 'Aprovar, editar e gerenciar usuários do sistema',
    category: 'Administração'
  },
  {
    name: 'manage_tickets',
    label: 'Gerenciar Chamados',
    description: 'Criar, editar e gerenciar chamados e atividades',
    category: 'Gestão'
  },
  {
    name: 'assign_tickets',
    label: 'Atribuir Chamados',
    description: 'Atribuir chamados e atividades para outros usuários',
    category: 'Gestão'
  },
  {
    name: 'view_tickets',
    label: 'Ver Chamados',
    description: 'Visualizar chamados atribuídos',
    category: 'Gestão'
  }
];