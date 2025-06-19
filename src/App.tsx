import { useState, useEffect } from 'react'; // 'React' foi removido da importação
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeProvider } from './contexts/ThemeContext';
import { FirebaseProvider } from './contexts/FirebaseContext';
import { DataProvider } from './contexts/DataContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Dashboard } from './components/dashboard/Dashboard';
import { LoginPage } from './components/auth/LoginPage';
import { ClientsList } from './components/clients/ClientsList';
import { OpportunitiesKanban } from './components/opportunities/OpportunitiesKanban';
import { TasksCalendar } from './components/tasks/TasksCalendar';
import { WhatsAppChat } from './components/whatsapp/WhatsAppChat';
import { AiAgentsManagement } from './components/ai-agents/AiAgentsManagement';
import { UserManagement } from './components/admin/UserManagement';
import { TicketsManagement } from './components/tickets/TicketsManagement';

function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar se há uma sessão salva ao carregar a aplicação
  useEffect(() => {
    const savedAuth = localStorage.getItem('crm_auth');
    const savedUser = localStorage.getItem('crm_current_user');
    
    if (savedAuth === 'true' && savedUser) {
      console.log('🔄 Restaurando sessão salva para:', savedUser);
      setIsAuthenticated(true);
      setCurrentUser(savedUser);
    }
    
    setIsLoading(false);
  }, []);

  const handleLogin = (username: string) => {
    console.log('✅ Login realizado para:', username);
    setIsAuthenticated(true);
    setCurrentUser(username);
    
    // Salvar a sessão no localStorage
    localStorage.setItem('crm_auth', 'true');
    localStorage.setItem('crm_current_user', username);
  };

  const handleLogout = () => {
    console.log('🔄 Fazendo logout...');
    setIsAuthenticated(false);
    setCurrentUser('');
    setActiveView('dashboard');
    setIsSidebarOpen(false);
    
    // Limpar a sessão do localStorage
    localStorage.removeItem('crm_auth');
    localStorage.removeItem('crm_current_user');
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard currentUser={currentUser} />;
      case 'clients':
        return <ClientsList currentUser={currentUser} />;
      case 'opportunities':
        return <OpportunitiesKanban currentUser={currentUser} />;
      case 'tasks':
        return <TasksCalendar />;
      case 'tickets':
        return <TicketsManagement currentUser={currentUser} />;
      case 'whatsapp':
        return <WhatsAppChat />;
      case 'ai-agents':
        return <AiAgentsManagement />;
      case 'user-management':
        return <UserManagement currentUser={currentUser} />;
      default:
        return <Dashboard currentUser={currentUser} />;
    }
  };

  // Mostrar loading enquanto verifica a sessão
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <FirebaseProvider>
        <DataProvider>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            <AnimatePresence mode="wait">
              {!isAuthenticated ? (
                <motion.div
                  key="login"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <LoginPage onLogin={handleLogin} />
                </motion.div>
              ) : (
                <motion.div
                  key="app"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex h-screen overflow-hidden"
                >
                  {/* Mobile Sidebar Overlay */}
                  {isSidebarOpen && (
                    <div 
                      className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
                      onClick={() => setIsSidebarOpen(false)}
                    />
                  )}
                  
                  <Sidebar
                    activeView={activeView}
                    setActiveView={setActiveView}
                    onLogout={handleLogout}
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                    currentUser={currentUser}
                  />
                  
                  <main className="flex-1 flex flex-col overflow-hidden">
                    <Header 
                      onLogout={handleLogout} 
                      currentUser={currentUser}
                      onMenuClick={() => setIsSidebarOpen(true)}
                    />
                    
                    <div className="flex-1 overflow-auto">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={activeView}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3 }}
                        >
                          {renderContent()}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </main>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </DataProvider>
      </FirebaseProvider>
    </ThemeProvider>
  );
}

export default App;