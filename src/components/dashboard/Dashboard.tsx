import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Users, Briefcase, Calendar, TrendingUp, Target, DollarSign, UserCheck, MapPin, MousePointerClick, ClipboardList, Plus } from 'lucide-react';
import { StatsCard } from '../ui/StatsCard';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { TicketForm } from '../tickets/TicketForm';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';
import { useData } from '../../contexts/DataContext';
import { supabase } from '../../lib/supabase';
import { ApprovedUser } from '../../types';

import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

import cities from '../../utils/brazil-cities.json';

// Objeto para mapear o código da UF para a sigla
const codigoUfParaSigla: { [key: number]: string } = {
    11: 'RO', 12: 'AC', 13: 'AM', 14: 'RR', 15: 'PA', 16: 'AP', 17: 'TO',
    21: 'MA', 22: 'PI', 23: 'CE', 24: 'RN', 25: 'PB', 26: 'PE', 27: 'AL', 28: 'SE', 29: 'BA',
    31: 'MG', 32: 'ES', 33: 'RJ', 35: 'SP',
    41: 'PR', 42: 'SC', 43: 'RS',
    50: 'MS', 51: 'MT', 52: 'GO', 53: 'DF'
};

// Componente para atualizar o estado do zoom (RENOMEADO)
const MapZoomHandler = ({ setZoom }: { setZoom: (zoom: number) => void }) => {
  const map = useMapEvents({
    zoomend: () => {
      setZoom(map.getZoom());
    },
  });
  return null;
}

interface DashboardProps {
  currentUser?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ currentUser }) => {
    const { isDarkMode } = useTheme();
    const { clients, opportunities } = useData();
    const [tasks, setTasks] = useState<any[]>([]);
    const [isClient, setIsClient] = useState(false);
    const [zoom, setZoom] = useState(4);

    // Estados para gerenciamento de chamados
    const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
    const [users, setUsers] = useState<ApprovedUser[]>([]);
    const [currentUserData, setCurrentUserData] = useState<ApprovedUser | null>(null);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);

    useEffect(() => {
        const loadedTasks = JSON.parse(localStorage.getItem('crm_tasks') || '[]');
        setTasks(loadedTasks);
        setIsClient(true);

        // Carregar dados do usuário se fornecido
        if (currentUser) {
            loadCurrentUserData();
        }
    }, [currentUser]);

    const loadCurrentUserData = async () => {
        if (!currentUser) return;

        try {
            setIsLoadingUsers(true);

            // Primeiro verificar se é admin
            const { data: adminData, error: adminError } = await supabase
                .from('admin_users')
                .select('*')
                .eq('username', currentUser)
                .eq('is_active', true);

            if (!adminError && adminData && adminData.length > 0) {
                // É um admin
                const admin = adminData[0];
                const adminUserData: ApprovedUser = {
                    id: admin.id,
                    username: admin.username,
                    email: admin.email,
                    fullName: admin.full_name,
                    role: 'admin',
                    userRole: {
                        id: 'admin-role',
                        name: 'admin',
                        displayName: 'Administrador',
                        level: 3,
                        permissions: [],
                        createdAt: ''
                    },
                    isActive: admin.is_active,
                    createdAt: admin.created_at,
                    lastLogin: admin.last_login
                };

                setCurrentUserData(adminUserData);

                // Load all users for assignment
                const { data: usersData, error: usersError } = await supabase
                    .from('approved_users')
                    .select(`
                        *,
                        user_roles (
                            id,
                            name,
                            display_name,
                            level
                        )
                    `)
                    .eq('is_active', true)
                    .order('full_name');

                if (!usersError && usersData) {
                    const transformedUsers: ApprovedUser[] = usersData.map(user => ({
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        fullName: user.full_name,
                        role: user.role,
                        roleId: user.role_id,
                        userRole: user.user_roles ? {
                            id: user.user_roles.id,
                            name: user.user_roles.name,
                            displayName: user.user_roles.display_name,
                            level: user.user_roles.level,
                            permissions: [],
                            createdAt: ''
                        } : undefined,
                        isActive: user.is_active,
                        createdAt: user.created_at
                    }));

                    setUsers(transformedUsers);
                }
                return;
            }

            // Se não é admin, verificar na tabela de usuários aprovados
            const { data: userData, error: userError } = await supabase
                .from('approved_users')
                .select(`
                    *,
                    user_roles (
                        id,
                        name,
                        display_name,
                        level,
                        permissions
                    )
                `)
                .eq('username', currentUser)
                .single();

            if (userError) throw userError;

            const transformedCurrentUser: ApprovedUser = {
                id: userData.id,
                username: userData.username,
                email: userData.email,
                fullName: userData.full_name,
                role: userData.role,
                roleId: userData.role_id,
                userRole: userData.user_roles ? {
                    id: userData.user_roles.id,
                    name: userData.user_roles.name,
                    displayName: userData.user_roles.display_name,
                    level: userData.user_roles.level,
                    permissions: userData.user_roles.permissions || [],
                    createdAt: ''
                } : undefined,
                isActive: userData.is_active,
                createdAt: userData.created_at,
                lastLogin: userData.last_login
            };

            setCurrentUserData(transformedCurrentUser);

            // Load all users for assignment (only if current user is admin/manager)
            if (transformedCurrentUser.userRole?.level && transformedCurrentUser.userRole.level >= 2) {
                const { data: usersData, error: usersError } = await supabase
                    .from('approved_users')
                    .select(`
                        *,
                        user_roles (
                            id,
                            name,
                            display_name,
                            level
                        )
                    `)
                    .eq('is_active', true)
                    .order('full_name');

                if (usersError) throw usersError;

                const transformedUsers: ApprovedUser[] = (usersData || []).map(user => ({
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    fullName: user.full_name,
                    role: user.role,
                    roleId: user.role_id,
                    userRole: user.user_roles ? {
                        id: user.user_roles.id,
                        name: user.user_roles.name,
                        displayName: user.user_roles.display_name,
                        level: user.user_roles.level,
                        permissions: [],
                        createdAt: ''
                    } : undefined,
                    isActive: user.is_active,
                    createdAt: user.created_at
                }));

                setUsers(transformedUsers);
            }

        } catch (error) {
            console.error('Error loading user data:', error);
        } finally {
            setIsLoadingUsers(false);
        }
    };

    const handleSaveTicket = async (formData: any) => {
        try {
            if (!currentUserData) {
                alert('Erro: Dados do usuário não carregados.');
                return;
            }

            // Create new ticket
            const { error } = await supabase
                .from('tickets')
                .insert([{
                    title: formData.title,
                    description: formData.description,
                    type: formData.type,
                    priority: formData.priority,
                    status: formData.status,
                    assigned_to: formData.assignedTo || null,
                    assigned_by: currentUserData.id,
                    due_date: formData.dueDate || null,
                    due_time: formData.dueTime || null
                }]);

            if (error) throw error;

            alert('✅ Chamado criado com sucesso!');
            setIsTicketModalOpen(false);
        } catch (error) {
            console.error('Error saving ticket:', error);
            alert('Erro ao criar chamado. Tente novamente.');
        }
    };

    const canManageTickets = () => {
        // Verificar se é admin (Victor ou Guilherme) ou se tem nível >= 2
        const isAdmin = currentUser === 'Victor' || currentUser === 'Guilherme';
        const hasManagerLevel = currentUserData?.userRole?.level && currentUserData.userRole.level >= 2;
        
        return isAdmin || hasManagerLevel;
    };

    const statsData = useMemo(() => {
        const newClients = clients.filter(c => c.status === 'Novo').length;
        const totalOpportunities = opportunities.length;
        const pendingTasks = tasks.filter(t => t.status !== 'Concluída').length;
        const closedWonOpportunities = opportunities.filter(o => o.status === 'fechado-ganhou');
        const conversionRate = totalOpportunities > 0 ? Math.round((closedWonOpportunities.length / totalOpportunities) * 100) : 0;
        const totalRevenue = closedWonOpportunities.reduce((sum, o) => sum + (o.value || 0), 0);
        return { newClients, totalOpportunities, pendingTasks, closedWonOpportunities, conversionRate, totalRevenue };
    }, [clients, opportunities, tasks]);

    const lastClientAdded = clients.length > 0
        ? [...clients].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
        : null;

    const stats = [
        { title: 'Novos Clientes', value: statsData.newClients.toString(), icon: Users, color: 'primary' as const },
        { title: 'Oportunidades Ativas', value: statsData.totalOpportunities.toString(), icon: Briefcase, color: 'secondary' as const },
        { title: 'Tarefas Pendentes', value: statsData.pendingTasks.toString(), icon: Calendar, color: 'warning' as const },
        { title: 'Vendas Realizadas', value: statsData.closedWonOpportunities.length, icon: UserCheck, color: 'success' as const},
        { title: 'Taxa de Conversão', value: `${statsData.conversionRate}%`, icon: Target, color: 'success' as const},
        { title: 'Receita Total', value: `R$ ${statsData.totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'primary' as const},
    ];

    const clientLocations = useMemo(() => {
        const normalizeString = (str: string) => str.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const locations: { lat: number, lng: number, nomeCompleto: string }[] = [];

        clients.forEach(client => {
            if (client.cidade && client.estado) {
                const normalizedClientCidade = normalizeString(client.cidade);
                const normalizedClientEstado = normalizeString(client.estado);

                const cityData = cities.find(c => {
                    const siglaEstado = codigoUfParaSigla[c.codigo_uf as keyof typeof codigoUfParaSigla] || '';
                    const normalizedJsonCidade = normalizeString(c.nome);
                    const normalizedJsonEstado = normalizeString(siglaEstado);
                    return normalizedJsonCidade === normalizedClientCidade && normalizedJsonEstado === normalizedClientEstado;
                });

                if (cityData) {
                    locations.push({ lat: cityData.latitude, lng: cityData.longitude, nomeCompleto: client.nomeCompleto });
                }
            }
        });
        return locations;
    }, [clients]);

    const monthlySalesData = useMemo(() => Array.from({ length: 12 }, (_, index) => {
        const year = new Date().getFullYear();
        const month = new Date(year, index).toLocaleDateString('pt-BR', { month: 'short' });
        const monthlyRevenue = statsData.closedWonOpportunities
            .filter(o => {
                const oppDate = new Date(o.createdAt);
                return oppDate.getMonth() === index && oppDate.getFullYear() === year;
            })
            .reduce((sum, o) => sum + (o.value || 0), 0);
        return { name: month, 'Vendas (R$)': Math.round(monthlyRevenue) };
    }), [statsData.closedWonOpportunities]);

    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
    const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.3 } } };

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="p-4 lg:p-6 space-y-6 lg:space-y-8">
            <motion.div variants={itemVariants}>
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Dashboard</h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            Visão geral do seu negócio e métricas importantes.
                            {lastClientAdded?.createdBy && (
                                <span className="text-sm block mt-1">
                                    Último cliente adicionado por: <strong className="text-primary-600 dark:text-primary-400">{lastClientAdded.createdBy}</strong>
                                </span>
                            )}
                        </p>
                        {currentUserData && (
                            <div className="mt-2 text-sm text-blue-600 dark:text-blue-400">
                                👤 <strong>{currentUserData.fullName}</strong> ({currentUserData.userRole?.displayName || 'Usuário'})
                            </div>
                        )}
                    </div>
                    {currentUser && canManageTickets() && (
                        <Button 
                            onClick={() => setIsTicketModalOpen(true)} 
                            className="flex items-center gap-2"
                            variant="secondary"
                        >
                            <ClipboardList className="w-4 h-4" />
                            Abrir Chamado
                        </Button>
                    )}
                </div>
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {stats.map((stat) => (<StatsCard key={stat.title} {...stat} />))}
            </motion.div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <motion.div variants={itemVariants}>
                    <Card className="h-96">
                        <h3 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Vendas Mensais (R$)</h3>
                        <ResponsiveContainer width="100%" height="90%"><LineChart data={monthlySalesData}><CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} /><XAxis dataKey="name" stroke={isDarkMode ? '#9ca3af' : '#6b7280'} /><YAxis stroke={isDarkMode ? '#9ca3af' : '#6b7280'} /><Tooltip contentStyle={{ backgroundColor: isDarkMode ? '#1f2937' : '#ffffff', border: 'none', borderRadius: '8px' }} /><Legend /><Line type="monotone" dataKey="Vendas (R$)" stroke="#6366f1" strokeWidth={3} /></LineChart></ResponsiveContainer>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <Card className="h-96 flex flex-col">
                        <h3 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Vendas Recentes</h3>
                        <div className="flex-1 overflow-y-auto space-y-3">
                            {statsData.closedWonOpportunities.length > 0 ? (
                                statsData.closedWonOpportunities.map(opp => (
                                    <div key={opp.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <div className="min-w-0">
                                            <p className="font-medium text-gray-800 dark:text-gray-200 truncate">{opp.name}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{opp.clientName}</p>
                                        </div>
                                        <div className="flex items-center text-sm font-semibold text-success-600">
                                            <DollarSign className="w-4 h-4 mr-1" />
                                            {opp.value.toLocaleString('pt-BR')}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
                                    <p>Nenhuma venda fechada ainda.<br/>Mova uma oportunidade para "Fechado (Ganhou)".</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </motion.div>
            </div>

            <motion.div variants={itemVariants}>
                <Card className="h-[600px] flex flex-col">
                    <h3 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <MapPin className="w-5 h-5"/>
                        Localização dos Clientes
                    </h3>
                    <div className='text-sm text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-2'>
                        <MousePointerClick className="w-4 h-4"/>
                        <span>Clique nos marcadores para ver o nome do cliente.</span>
                    </div>
                    {isClient && (
                        <MapContainer center={[-14.2350, -51.9253]} zoom={zoom} scrollWheelZoom={true} style={{ height: '100%', borderRadius: '8px', flexGrow: 1 }}>
                            <MapZoomHandler setZoom={setZoom} />
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            {clientLocations.map((location, index) => (
                                <Marker key={index} position={[location.lat, location.lng]}>
                                    <Popup>{location.nomeCompleto}</Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                    )}
                </Card>
            </motion.div>

            {/* Modal para criar chamado */}
            <Modal
                isOpen={isTicketModalOpen}
                onClose={() => setIsTicketModalOpen(false)}
                title="Abrir Novo Chamado"
                size="lg"
            >
                {!isLoadingUsers && currentUserData && (
                    <TicketForm
                        ticket={null}
                        users={users}
                        currentUser={currentUserData}
                        onClose={() => setIsTicketModalOpen(false)}
                        onSave={handleSaveTicket}
                    />
                )}
                {isLoadingUsers && (
                    <div className="flex items-center justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                )}
            </Modal>
        </motion.div>
    );
};