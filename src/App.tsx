import { useState } from 'react'; // 'React' foi removido da importação
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

function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogin = (username: string) => {
    setIsAuthenticated(true);
    setCurrentUser(username);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser('');
    setActiveView('dashboard');
    setIsSidebarOpen(false);
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'clients':
        return <ClientsList currentUser={currentUser} />;
      case 'opportunities':
        return <OpportunitiesKanban />;
      case 'tasks':
        return <TasksCalendar />;
      case 'whatsapp':
        return <WhatsAppChat />;
      case 'ai-agents':
        return <AiAgentsManagement />;
      case 'user-management':
        return <UserManagement currentUser={currentUser} />;
      default:
        return <Dashboard />;
    }
  };

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