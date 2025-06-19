import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Users, 
  Briefcase, 
  Calendar, 
  MessageCircle, 
  Sparkles, 
  Power,
  Sun,
  Moon,
  X
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeView, 
  setActiveView, 
  onLogout, 
  isOpen, 
  onClose 
}) => {
  const { theme, toggleTheme } = useTheme();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'opportunities', label: 'Oportunidades', icon: Briefcase },
    { id: 'tasks', label: 'Tarefas', icon: Calendar },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
    { id: 'ai-agents', label: 'Agentes de IA', icon: Sparkles },
  ];

  const handleMenuClick = (viewId: string) => {
    setActiveView(viewId);
    onClose();
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex bg-gray-900 text-white w-64 flex-col shadow-2xl">
        <div className="p-6 border-b border-gray-700">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-center bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent"
          >
            Atractive CRM
          </motion.h1>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            
            return (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ x: 4 }}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                  isActive 
                    ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-500/25' 
                    : 'hover:bg-gray-800 text-gray-300 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
              </motion.button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-700 space-y-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={toggleTheme}
            className="w-full flex items-center justify-center px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 mr-2" /> : <Moon className="w-5 h-5 mr-2" />}
            {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onLogout}
            className="w-full flex items-center justify-center px-4 py-2 bg-danger-600 text-white rounded-lg hover:bg-danger-700 transition-colors"
          >
            <Power className="w-5 h-5 mr-2" />
            Sair
          </motion.button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white flex flex-col shadow-2xl lg:hidden"
          >
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
                Atractive CRM
              </h1>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <nav className="flex-1 px-4 py-6 space-y-2">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                
                return (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handleMenuClick(item.id)}
                    className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                      isActive 
                        ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-500/25' 
                        : 'hover:bg-gray-800 text-gray-300 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </motion.button>
                );
              })}
            </nav>

            <div className="p-4 border-t border-gray-700 space-y-2">
              <button
                onClick={toggleTheme}
                className="w-full flex items-center justify-center px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5 mr-2" /> : <Moon className="w-5 h-5 mr-2" />}
                {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
              </button>
              
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-center px-4 py-2 bg-danger-600 text-white rounded-lg hover:bg-danger-700 transition-colors"
              >
                <Power className="w-5 h-5 mr-2" />
                Sair
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
};