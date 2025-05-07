import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Header = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 shadow-md">
      <h1 className="text-2xl font-bold dark:text-white">Daunnime</h1>
      <button onClick={toggleTheme} className="text-gray-800 dark:text-gray-200">
        {theme === 'light' ? <Moon size={24} /> : <Sun size={24} />}
      </button>
    </header>
  );
};

export default Header;
