import React from 'react';
import Header from './components/Header';
import Home from './pages/Home';
import { ThemeProvider } from './context/ThemeContext';

const App = () => {
  return (
    <ThemeProvider>
      <div className="bg-gray-100 dark:bg-gray-900 min-h-screen transition-colors">
        <Header />
        <Home />
      </div>
    </ThemeProvider>
  );
};

export default App;
