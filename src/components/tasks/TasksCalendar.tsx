import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, User, CheckCircle, Circle, AlertCircle, Users } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { TaskForm } from './TaskForm';
import { MeetingForm } from '../meetings/MeetingForm';
import { supabase } from '../../lib/supabase';

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

interface Meeting {
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

const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const TasksCalendar: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [isLoading, setIsLoading] = useState(true);

  // Load tasks and meetings from Supabase
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Load tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .order('due_date', { ascending: true });

      if (tasksError) throw tasksError;

      const transformedTasks: Task[] = (tasksData || []).map(task => ({
        id: task.id,
        name: task.name,
        description: task.description || '',
        dueDate: task.due_date,
        dueTime: task.due_time || '',
        priority: task.priority,
        status: task.status,
        assignedTo: task.assigned_to || '',
        createdAt: task.created_at
      }));

      setTasks(transformedTasks);

      // Load meetings
      const { data: meetingsData, error: meetingsError } = await supabase
        .from('meetings')
        .select('*')
        .order('meeting_date', { ascending: true });

      if (meetingsError) throw meetingsError;

      const transformedMeetings: Meeting[] = (meetingsData || []).map(meeting => ({
        id: meeting.id,
        title: meeting.title,
        description: meeting.description || '',
        clientName: meeting.client_name || '',
        meetingDate: meeting.meeting_date,
        meetingTime: meeting.meeting_time || '',
        durationMinutes: meeting.duration_minutes,
        location: meeting.location || '',
        meetingType: meeting.meeting_type,
        status: meeting.status,
        attendees: meeting.attendees || [],
        notes: meeting.notes || '',
        createdBy: meeting.created_by || '',
        createdAt: meeting.created_at
      }));

      setMeetings(transformedMeetings);

    } catch (error) {
      console.error('Error loading data:', error);
      // Fallback to localStorage
      const savedTasks = localStorage.getItem('crm_tasks');
      if (savedTasks) setTasks(JSON.parse(savedTasks));
      
      const savedMeetings = localStorage.getItem('crm_meetings');
      if (savedMeetings) setMeetings(JSON.parse(savedMeetings));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTask = (date?: Date) => {
    setSelectedTask(null);
    setSelectedDate(date || null);
    setIsTaskModalOpen(true);
  };

  const handleAddMeeting = (date?: Date) => {
    setSelectedMeeting(null);
    setSelectedDate(date || null);
    setIsMeetingModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleEditMeeting = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setIsMeetingModalOpen(true);
  };

  const handleSaveTask = async (formData: Omit<Task, 'id' | 'createdAt'>) => {
    try {
      if (selectedTask) {
        // Update existing task
        const dbTask = {
          name: formData.name,
          description: formData.description,
          due_date: formData.dueDate,
          due_time: formData.dueTime || null,
          priority: formData.priority,
          status: formData.status,
          assigned_to: formData.assignedTo || null
        };

        const { error } = await supabase
          .from('tasks')
          .update(dbTask)
          .eq('id', selectedTask.id);

        if (error) throw error;

        setTasks(prev => prev.map(t => 
          t.id === selectedTask.id 
            ? { ...selectedTask, ...formData }
            : t
        ));
      } else {
        // Create new task
        const dbTask = {
          name: formData.name,
          description: formData.description,
          due_date: formData.dueDate,
          due_time: formData.dueTime || null,
          priority: formData.priority,
          status: formData.status,
          assigned_to: formData.assignedTo || null
        };

        const { data, error } = await supabase
          .from('tasks')
          .insert([dbTask])
          .select()
          .single();

        if (error) throw error;

        const newTask: Task = {
          id: data.id,
          name: data.name,
          description: data.description || '',
          dueDate: data.due_date,
          dueTime: data.due_time || '',
          priority: data.priority,
          status: data.status,
          assignedTo: data.assigned_to || '',
          createdAt: data.created_at
        };

        setTasks(prev => [...prev, newTask]);
      }
    } catch (error) {
      console.error('Error saving task:', error);
      // Fallback to localStorage
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
    }
    
    setIsTaskModalOpen(false);
    // Also save to localStorage as backup
    localStorage.setItem('crm_tasks', JSON.stringify(tasks));
  };

  const handleSaveMeeting = async (formData: any) => {
    try {
      if (selectedMeeting) {
        // Update existing meeting
        const dbMeeting = {
          title: formData.title,
          description: formData.description,
          client_name: formData.clientName || null,
          meeting_date: formData.meetingDate,
          meeting_time: formData.meetingTime || null,
          duration_minutes: formData.durationMinutes,
          location: formData.location || null,
          meeting_type: formData.meetingType,
          status: formData.status,
          attendees: formData.attendees,
          notes: formData.notes || null
        };

        const { error } = await supabase
          .from('meetings')
          .update(dbMeeting)
          .eq('id', selectedMeeting.id);

        if (error) throw error;

        setMeetings(prev => prev.map(m => 
          m.id === selectedMeeting.id 
            ? { ...selectedMeeting, ...formData }
            : m
        ));
      } else {
        // Create new meeting
        const dbMeeting = {
          title: formData.title,
          description: formData.description,
          client_name: formData.clientName || null,
          meeting_date: formData.meetingDate,
          meeting_time: formData.meetingTime || null,
          duration_minutes: formData.durationMinutes,
          location: formData.location || null,
          meeting_type: formData.meetingType,
          status: formData.status,
          attendees: formData.attendees,
          notes: formData.notes || null,
          created_by: 'current_user' // You can get this from auth context
        };

        const { data, error } = await supabase
          .from('meetings')
          .insert([dbMeeting])
          .select()
          .single();

        if (error) throw error;

        const newMeeting: Meeting = {
          id: data.id,
          title: data.title,
          description: data.description || '',
          clientName: data.client_name || '',
          meetingDate: data.meeting_date,
          meetingTime: data.meeting_time || '',
          durationMinutes: data.duration_minutes,
          location: data.location || '',
          meetingType: data.meeting_type,
          status: data.status,
          attendees: data.attendees || [],
          notes: data.notes || '',
          createdBy: data.created_by || '',
          createdAt: data.created_at
        };

        setMeetings(prev => [...prev, newMeeting]);
      }
    } catch (error) {
      console.error('Error saving meeting:', error);
      // Fallback to localStorage
      if (selectedMeeting) {
        setMeetings(prev => prev.map(m => 
          m.id === selectedMeeting.id 
            ? { ...m, ...formData }
            : m
        ));
      } else {
        const newMeeting: Meeting = {
          ...formData,
          id: Date.now().toString(),
          createdBy: 'current_user',
          createdAt: new Date().toISOString()
        };
        setMeetings(prev => [...prev, newMeeting]);
      }
    }
    
    setIsMeetingModalOpen(false);
    // Also save to localStorage as backup
    localStorage.setItem('crm_meetings', JSON.stringify(meetings));
  };

  const handleToggleTaskStatus = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newStatus = task.status === 'Concluída' ? 'Pendente' : 'Concluída';

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (error) throw error;

      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, status: newStatus }
          : task
      ));
    } catch (error) {
      console.error('Error updating task status:', error);
      // Fallback to local update
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, status: newStatus }
          : task
      ));
    }
    
    // Also save to localStorage as backup
    localStorage.setItem('crm_tasks', JSON.stringify(tasks));
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

  const getMeetingsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return meetings.filter(meeting => meeting.meetingDate === dateString);
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

  const getMeetingStatusColor = (status: string) => {
    switch (status) {
      case 'confirmada': return 'bg-success-100 text-success-800 border-success-200';
      case 'realizada': return 'bg-primary-100 text-primary-800 border-primary-200';
      case 'cancelada': return 'bg-danger-100 text-danger-800 border-danger-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const days = getDaysInMonth(currentDate);

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Tarefas e Reuniões
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
          <div className="flex gap-2">
            <Button onClick={() => handleAddTask()} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nova Tarefa
            </Button>
            <Button onClick={() => handleAddMeeting()} variant="secondary" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Nova Reunião
            </Button>
          </div>
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
                return <div key={index} className="p-2 h-24 lg:h-28" />;
              }

              const dayTasks = getTasksForDate(date);
              const dayMeetings = getMeetingsForDate(date);
              const isCurrentDay = isToday(date);

              return (
                <motion.div
                  key={date.toISOString()}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.01 }}
                  className={`p-2 h-24 lg:h-28 border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
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
                    {dayTasks.slice(0, 1).map(task => (
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
                    {dayMeetings.slice(0, 1).map(meeting => (
                      <div
                        key={meeting.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditMeeting(meeting);
                        }}
                        className={`text-xs p-1 rounded border truncate ${getMeetingStatusColor(meeting.status)} hover:shadow-sm transition-shadow`}
                      >
                        <Users className="w-3 h-3 inline mr-1" />
                        {meeting.title}
                      </div>
                    ))}
                    {(dayTasks.length + dayMeetings.length) > 2 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        +{(dayTasks.length + dayMeetings.length) - 2} mais
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
            {tasks.length === 0 && meetings.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Card className="text-center py-12">
                  <CalendarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Nenhuma tarefa ou reunião cadastrada
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Comece criando sua primeira tarefa ou agendando uma reunião
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={() => handleAddTask()}>
                      Criar Primeira Tarefa
                    </Button>
                    <Button onClick={() => handleAddMeeting()} variant="secondary">
                      Agendar Reunião
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ) : (
              <>
                {/* Tasks Section */}
                {tasks.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Tarefas</h3>
                    {tasks
                      .sort((a, b) => new Date(a.dueDate + 'T' + (a.dueTime || '00:00')).getTime() - new Date(b.dueDate + 'T' + (b.dueTime || '00:00')).getTime())
                      .map((task, index) => (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Card hover className="p-4 mb-3">
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
                      ))}
                  </div>
                )}

                {/* Meetings Section */}
                {meetings.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Reuniões</h3>
                    {meetings
                      .sort((a, b) => new Date(a.meetingDate + 'T' + (a.meetingTime || '00:00')).getTime() - new Date(b.meetingDate + 'T' + (b.meetingTime || '00:00')).getTime())
                      .map((meeting, index) => (
                        <motion.div
                          key={meeting.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Card hover className="p-4 mb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3 flex-1">
                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                                    {meeting.title}
                                  </h3>
                                  {meeting.description && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                      {meeting.description}
                                    </p>
                                  )}
                                  <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                                    <div className="flex items-center gap-1">
                                      <CalendarIcon className="w-4 h-4" />
                                      {new Date(meeting.meetingDate).toLocaleDateString()}
                                    </div>
                                    {meeting.meetingTime && (
                                      <div className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        {meeting.meetingTime}
                                      </div>
                                    )}
                                    {meeting.clientName && (
                                      <div className="flex items-center gap-1">
                                        <User className="w-4 h-4" />
                                        {meeting.clientName}
                                      </div>
                                    )}
                                  </div>
                                  {meeting.attendees.length > 0 && (
                                    <div className="mt-2">
                                      <span className="text-xs text-gray-500 dark:text-gray-400">Participantes: </span>
                                      <span className="text-xs text-gray-700 dark:text-gray-300">
                                        {meeting.attendees.join(', ')}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getMeetingStatusColor(meeting.status)}`}>
                                  {meeting.status}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditMeeting(meeting)}
                                >
                                  Editar
                                </Button>
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                  </div>
                )}
              </>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Modals */}
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

      <Modal
        isOpen={isMeetingModalOpen}
        onClose={() => setIsMeetingModalOpen(false)}
        title={selectedMeeting ? "Editar Reunião" : "Nova Reunião"}
        size="lg"
      >
        <MeetingForm
          meeting={selectedMeeting}
          selectedDate={selectedDate}
          onClose={() => setIsMeetingModalOpen(false)}
          onSave={handleSaveMeeting}
        />
      </Modal>
    </div>
  );
};