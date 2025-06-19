import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  User, 
  Flag, 
  Clock, 
  MessageSquare, 
  Send,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { Ticket, TicketComment, ApprovedUser } from '../../types';

interface TicketDetailsProps {
  ticket: Ticket;
  currentUser: ApprovedUser | null;
  onClose: () => void;
  onUpdate: () => void;
}

export const TicketDetails: React.FC<TicketDetailsProps> = ({ 
  ticket, 
  currentUser, 
  onClose, 
  onUpdate 
}) => {
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    loadComments();
  }, [ticket.id]);

  const loadComments = async () => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('ticket_comments')
        .select(`
          *,
          user:user_id (
            id,
            username,
            full_name,
            user_roles (display_name)
          )
        `)
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const transformedComments: TicketComment[] = (data || []).map(comment => ({
        id: comment.id,
        ticketId: comment.ticket_id,
        userId: comment.user_id,
        user: comment.user ? {
          id: comment.user.id,
          username: comment.user.username,
          fullName: comment.user.full_name,
          email: '',
          role: 'user',
          isActive: true,
          createdAt: '',
          userRole: comment.user.user_roles ? {
            displayName: comment.user.user_roles.display_name,
            id: '',
            name: '',
            level: 1,
            permissions: [],
            createdAt: ''
          } : undefined
        } : undefined,
        comment: comment.comment,
        createdAt: comment.created_at
      }));

      setComments(transformedComments);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !currentUser) return;

    try {
      setIsSending(true);

      const { error } = await supabase
        .from('ticket_comments')
        .insert([{
          ticket_id: ticket.id,
          user_id: currentUser.id,
          comment: newComment.trim()
        }]);

      if (error) throw error;

      setNewComment('');
      await loadComments();
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Erro ao adicionar comentário.');
    } finally {
      setIsSending(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      setIsUpdatingStatus(true);

      const updateData: any = { status: newStatus };
      
      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('tickets')
        .update(updateData)
        .eq('id', ticket.id);

      if (error) throw error;

      onUpdate();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Erro ao atualizar status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-400';
      case 'in_progress': return 'bg-warning-100 text-warning-800 dark:bg-warning-900/20 dark:text-warning-400';
      case 'cancelled': return 'bg-danger-100 text-danger-800 dark:bg-danger-900/20 dark:text-danger-400';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default: return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'task': return 'Tarefa';
      case 'objective': return 'Objetivo';
      case 'training': return 'Treinamento';
      case 'meeting': return 'Reunião';
      default: return type;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Aberto';
      case 'in_progress': return 'Em Andamento';
      case 'completed': return 'Concluído';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Urgente';
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      case 'low': return 'Baixa';
      default: return priority;
    }
  };

  const canUpdateStatus = () => {
    return currentUser?.id === ticket.assignedTo || 
           (currentUser?.userRole?.level && currentUser.userRole.level >= 2);
  };

  return (
    <div className="space-y-6">
      {/* Ticket Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
          {ticket.title}
        </h3>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(ticket.status)}`}>
            {ticket.status === 'completed' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {getStatusLabel(ticket.status)}
          </span>
          <span className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full ${getPriorityColor(ticket.priority)}`}>
            <Flag className="w-4 h-4" />
            {getPriorityLabel(ticket.priority)}
          </span>
          <span className="inline-flex px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
            {getTypeLabel(ticket.type)}
          </span>
        </div>

        {ticket.description && (
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            {ticket.description}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {ticket.assignedToUser && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <User className="w-4 h-4" />
              <span>
                <strong>Atribuído para:</strong> {ticket.assignedToUser.fullName}
                {ticket.assignedToUser.userRole && (
                  <span className="text-gray-500 ml-1">
                    ({ticket.assignedToUser.userRole.displayName})
                  </span>
                )}
              </span>
            </div>
          )}

          {ticket.assignedByUser && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <User className="w-4 h-4" />
              <span>
                <strong>Criado por:</strong> {ticket.assignedByUser.fullName}
              </span>
            </div>
          )}

          {ticket.dueDate && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>
                <strong>Prazo:</strong> {new Date(ticket.dueDate).toLocaleDateString('pt-BR')}
                {ticket.dueTime && ` às ${ticket.dueTime}`}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Clock className="w-4 h-4" />
            <span>
              <strong>Criado em:</strong> {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}
            </span>
          </div>
        </div>

        {ticket.completionNotes && (
          <div className="mt-4 p-3 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg">
            <h5 className="font-medium text-success-900 dark:text-success-100 mb-2">
              Observações de Conclusão:
            </h5>
            <p className="text-sm text-success-800 dark:text-success-200">
              {ticket.completionNotes}
            </p>
          </div>
        )}
      </div>

      {/* Status Actions */}
      {canUpdateStatus() && ticket.status !== 'completed' && ticket.status !== 'cancelled' && (
        <div className="flex gap-2">
          {ticket.status === 'open' && (
            <Button
              onClick={() => handleUpdateStatus('in_progress')}
              disabled={isUpdatingStatus}
              variant="warning"
              size="sm"
            >
              Iniciar Trabalho
            </Button>
          )}
          {ticket.status === 'in_progress' && (
            <Button
              onClick={() => handleUpdateStatus('completed')}
              disabled={isUpdatingStatus}
              variant="success"
              size="sm"
            >
              Marcar como Concluído
            </Button>
          )}
          <Button
            onClick={() => handleUpdateStatus('cancelled')}
            disabled={isUpdatingStatus}
            variant="danger"
            size="sm"
          >
            Cancelar
          </Button>
        </div>
      )}

      {/* Comments Section */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Comentários ({comments.length})
        </h4>

        {/* Comments List */}
        <div className="space-y-4 mb-6">
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : comments.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              Nenhum comentário ainda. Seja o primeiro a comentar!
            </p>
          ) : (
            comments.map((comment, index) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {comment.user?.fullName || 'Usuário'}
                    </span>
                    {comment.user?.userRole && (
                      <span className="text-xs px-2 py-1 bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-400 rounded-full">
                        {comment.user.userRole.displayName}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(comment.createdAt).toLocaleString('pt-BR')}
                  </span>
                </div>
                <p className="text-gray-700 dark:text-gray-300">
                  {comment.comment}
                </p>
              </motion.div>
            ))
          )}
        </div>

        {/* Add Comment */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex gap-3">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Adicione um comentário..."
              rows={3}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
            <Button
              onClick={handleAddComment}
              disabled={!newComment.trim() || isSending}
              isLoading={isSending}
              className="self-end"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};