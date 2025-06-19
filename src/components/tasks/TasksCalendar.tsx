import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, User, CheckCircle, Circle, AlertCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { TaskForm } from './TaskForm';

interface Task {
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

const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const TasksCalendar: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  // Load tasks from localStorage on component mount
  useEffect(() => {
    const savedTasks = localStorage.getItem('crm_tasks');
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
  }, []);

  // Save tasks to localStorage whenever tasks change
  useEffect(() => {
    localStorage.setItem('crm_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const handleAddTask = (date?: Date) => {
    setSelectedTask(null);
    setSelectedDate(date || null);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = (formData: Omit<Task, 'id' | 'createdAt'>) => {
    if (selectedTask) {
      setTasks(prev => prev.map(t => 
        t.id === selectedTask.id 
          ? { ...t, ...formData }
          : t
      ));
    } else {
      const newTask: Task = {
        ...formData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      setTasks(prev => [...prev, newTask]);
    }
    setIsTaskModalOpen(false);
  };

  const handleToggleTaskStatus = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, status: task.status === 'Concluída' ? 'Pendente' : 'Concluída' }
        : task
    ));
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getTasksForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return tasks.filter(task => task.dueDate === dateString);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Alta': return 'bg-danger-100 text-danger-800 border-danger-200';
      case 'Média': return 'bg-warning-100 text-warning-800 border-warning-200';
      case 'Baixa': return 'bg-success-100 text-success-800 border-success-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Concluída': return <CheckCircle className="w-4 h-4 text-success-600" />;
      case 'Em Andamento': return <AlertCircle className="w-4 h-4 text-warning-600" />;
      default: return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const days = getDaysInMonth(currentDate);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Tarefas e Agendamentos
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gerencie suas tarefas e compromissos
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'calendar' ? 'primary' : 'ghost'}
              onClick={() => setViewMode('calendar')}
              size="sm"
              className="flex-1 sm:flex-none"
            >
              <CalendarIcon className="w-4 h-4 mr-2" />
              Calendário
            </Button>
            <Button
              variant={viewMode === 'list' ? 'primary' : 'ghost'}
              onClick={() => setViewMode('list')}
              size="sm"
              className="flex-1 sm:flex-none"
            >
              Lista
            </Button>
          </div>
          <Button onClick={() => handleAddTask()} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nova Tarefa
          </Button>
        </div>
      </motion.div>

      {viewMode === 'calendar' ? (
        <Card className="p-4 lg:p-6">
          {/* Calendar Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
              >
                Hoje
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Week day headers */}
            {weekDays.map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {days.map((date, index) => {
              if (!date) {
                return <div key={index} className="p-2 h-20 lg:h-24" />;
              }

              const dayTasks = getTasksForDate(date);
              const isCurrentDay = isToday(date);

              return (
                <motion.div
                  key={date.toISOString()}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.01 }}
                  className={`p-2 h-20 lg:h-24 border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                    isCurrentDay ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-700' : ''
                  }`}
                  onClick={() => handleAddTask(date)}
                >
                  <div className={`text-sm font-medium mb-1 ${
                    isCurrentDay ? 'text-primary-600 dark:text-primary-400' : 'text-gray-900 dark:text-gray-100'
                  }`}>
                    {date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {dayTasks.slice(0, 2).map(task => (
                      <div
                        key={task.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditTask(task);
                        }}
                        className={`text-xs p-1 rounded border truncate ${getPriorityColor(task.priority)} hover:shadow-sm transition-shadow`}
                      >
                        {task.name}
                      </div>
                    ))}
                    {dayTasks.length > 2 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        +{dayTasks.length - 2} mais
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {tasks.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Card className="text-center py-12">
                  <CalendarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Nenhuma tarefa cadastrada
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Comece criando sua primeira tarefa
                  </p>
                  <Button onClick={() => handleAddTask()}>
                    Criar Primeira Tarefa
                  </Button>
                </Card>
              </motion.div>
            ) : (
              tasks
                .sort((a, b) => new Date(a.dueDate + 'T' + (a.dueTime || '00:00')).getTime() - new Date(b.dueDate + 'T' + (b.dueTime || '00:00')).getTime())
                .map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card hover className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <button
                            onClick={() => handleToggleTaskStatus(task.id)}
                            className="mt-1"
                          >
                            {getStatusIcon(task.status)}
                          </button>
                          <div className="flex-1">
                            <h3 className={`font-medium ${
                              task.status === 'Concluída' 
                                ? 'line-through text-gray-500 dark:text-gray-400' 
                                : 'text-gray-900 dark:text-gray-100'
                            }`}>
                              {task.name}
                            </h3>
                            {task.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {task.description}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <CalendarIcon className="w-4 h-4" />
                                {new Date(task.dueDate).toLocaleDateString()}
                              </div>
                              {task.dueTime && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {task.dueTime}
                                </div>
                              )}
                              {task.assignedTo && (
                                <div className="flex items-center gap-1">
                                  <User className="w-4 h-4" />
                                  {task.assignedTo}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditTask(task)}
                          >
                            Editar
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title={selectedTask ? "Editar Tarefa" : "Nova Tarefa"}
      >
        <TaskForm
          task={selectedTask}
          selectedDate={selectedDate}
          onClose={() => setIsTaskModalOpen(false)}
          onSave={handleSaveTask}
        />
      </Modal>
    </div>
  );
};