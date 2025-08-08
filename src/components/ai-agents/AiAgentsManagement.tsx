import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Bot, Settings, Play, Pause, Trash2, Edit, Sparkles } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { AiAgentForm } from './AiAgentForm';
import { AGENT_TEMPLATES, AgentTemplate } from './agentTemplates';

interface AiAgent {
  id: string;
  name: string;
  description: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  isActive: boolean;
  triggerEvents: string[];
  createdAt: Date;
  lastUsed?: Date;
}

export const AiAgentsManagement: React.FC = () => {
  const [agents, setAgents] = useState<AiAgent[]>([]);
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AiAgent | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<AiAgent | null>(null);
  const [prefillFromTemplate, setPrefillFromTemplate] = useState<AgentTemplate | null>(null);

  const handleAddAgent = () => {
    setSelectedAgent(null);
    setIsAgentModalOpen(true);
  };

  const handleEditAgent = (agent: AiAgent) => {
    setSelectedAgent(agent);
    setIsAgentModalOpen(true);
  };

  const handleDeleteAgent = (agent: AiAgent) => {
    setAgentToDelete(agent);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (agentToDelete) {
      setAgents(prev => prev.filter(a => a.id !== agentToDelete.id));
      setAgentToDelete(null);
      setIsDeleteConfirmOpen(false);
    }
  };

  const handleAddFromTemplate = (template: AgentTemplate) => {
    setPrefillFromTemplate(template);
    setSelectedAgent(null);
    setIsAgentModalOpen(true);
  };

  const handleSaveAgent = (formData: Omit<AiAgent, 'id' | 'createdAt'>) => {
    if (selectedAgent) {
      setAgents(prev => prev.map(a => 
        a.id === selectedAgent.id 
          ? { ...a, ...formData }
          : a
      ));
    } else {
      const newAgent: AiAgent = {
        ...formData,
        id: Date.now().toString(),
        createdAt: new Date()
      };
      setAgents(prev => [...prev, newAgent]);
    }
    setIsAgentModalOpen(false);
  };

  const handleToggleAgent = (agentId: string) => {
    setAgents(prev => prev.map(agent => 
      agent.id === agentId 
        ? { ...agent, isActive: !agent.isActive }
        : agent
    ));
  };

  const getModelColor = (model: string) => {
    switch (model) {
      case 'gpt-4': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'gpt-3.5-turbo': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'claude-3': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Agentes de IA
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configure e gerencie seus assistentes de IA
          </p>
        </div>
        <Button onClick={handleAddAgent} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Novo Agente
        </Button>
      </motion.div>

      {/* Templates Grid */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-primary-600" />
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Criar Agentes I.A (Templates)</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {AGENT_TEMPLATES.map((tpl) => (
            <div key={tpl.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">{tpl.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{tpl.description}</p>
                </div>
              </div>
              <div className="mt-3 flex justify-between items-center">
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">{tpl.model}</span>
                <Button size="sm" onClick={() => handleAddFromTemplate(tpl)}>Usar template</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Agents Grid */}
      <AnimatePresence>
        {agents.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="text-center py-12">
              <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Nenhum agente configurado
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Crie seu primeiro agente de IA para automatizar tarefas
              </p>
              <Button onClick={handleAddAgent}>
                Criar Primeiro Agente
              </Button>
            </Card>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent, index) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card hover className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        agent.isActive ? 'bg-primary-100 dark:bg-primary-900/20' : 'bg-gray-100 dark:bg-gray-700'
                      }`}>
                        <Bot className={`w-5 h-5 ${
                          agent.isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'
                        }`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {agent.name}
                        </h3>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          agent.isActive 
                            ? 'bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {agent.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleToggleAgent(agent.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          agent.isActive
                            ? 'text-warning-600 hover:bg-warning-50 dark:hover:bg-warning-900/20'
                            : 'text-success-600 hover:bg-success-50 dark:hover:bg-success-900/20'
                        }`}
                        title={agent.isActive ? 'Pausar' : 'Ativar'}
                      >
                        {agent.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleEditAgent(agent)}
                        className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAgent(agent)}
                        className="p-2 text-gray-400 hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {agent.description}
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Modelo</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getModelColor(agent.model)}`}>
                        {agent.model}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Temperatura</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {agent.temperature}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Max Tokens</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {agent.maxTokens}
                      </span>
                    </div>
                    {agent.triggerEvents.length > 0 && (
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Eventos:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {agent.triggerEvents.slice(0, 2).map((event, idx) => (
                            <span key={idx} className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                              {event}
                            </span>
                          ))}
                          {agent.triggerEvents.length > 2 && (
                            <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                              +{agent.triggerEvents.length - 2}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {agent.lastUsed && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Último uso: {agent.lastUsed.toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Modais */}
      <Modal
        isOpen={isAgentModalOpen}
        onClose={() => { setIsAgentModalOpen(false); setPrefillFromTemplate(null); }}
        title={selectedAgent ? "Editar Agente" : "Novo Agente de IA"}
        size="lg"
      >
        <AiAgentForm
          agent={prefillFromTemplate ? {
            name: prefillFromTemplate.name,
            description: prefillFromTemplate.description,
            model: prefillFromTemplate.model,
            temperature: prefillFromTemplate.temperature,
            maxTokens: prefillFromTemplate.maxTokens,
            systemPrompt: prefillFromTemplate.systemPrompt,
            isActive: true,
            triggerEvents: prefillFromTemplate.triggerEvents,
          } as any : selectedAgent}
          onClose={() => { setIsAgentModalOpen(false); setPrefillFromTemplate(null); }}
          onSave={handleSaveAgent}
        />
      </Modal>

      <Modal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        title="Confirmar Exclusão"
        size="sm"
      >
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-danger-100 dark:bg-danger-900/20 mb-4">
            <Trash2 className="h-6 w-6 text-danger-600 dark:text-danger-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Excluir Agente
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Tem certeza que deseja excluir o agente "{agentToDelete?.name}"? 
            Esta ação não pode ser desfeita.
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              variant="ghost"
              onClick={() => setIsDeleteConfirmOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmDelete}
            >
              Excluir
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};