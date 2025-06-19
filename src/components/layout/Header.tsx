import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Power, User, Menu } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface HeaderProps {
  onLogout: () => void;
  currentUser: string;
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onLogout, currentUser, onMenuClick }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors lg:hidden mr-3"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-xl lg:text-2xl font-semibold text-gray-900 dark:text-gray-100"
          >
            Atractive CRM
          </motion.h1>
        </div>
        
        <div className="flex items-center space-x-2 lg:space-x-4">
          {currentUser && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <User className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {currentUser}
              </span>
            </div>
          )}
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onLogout}
            className="p-2 bg-danger-600 text-white rounded-lg hover:bg-danger-700 transition-colors"
          >
            <Power className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </header>
  );
};