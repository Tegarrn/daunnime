// src/components/Header.jsx
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import SearchBar from './SearchBar';
import { Moon, Sun } from 'lucide-react';

const Header = () => {
  const { darkMode, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 shadow-md">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <h1 className="font-bold text-2xl text-blue-600 dark:text-blue-400">AnimeStream</h1>
        </Link>
        
        <div className="flex items-center gap-4">
          <SearchBar />
          
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            aria-label="Toggle theme"
          >
            {darkMode ? (
              <Sun size={20} className="text-yellow-400" />
            ) : (
              <Moon size={20} className="text-gray-700" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;