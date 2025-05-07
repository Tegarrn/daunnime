// src/App.jsx
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import Header from './components/Header';
import AppRoutes from './routes/AppRoutes';
import { ThemeProvider } from './context/ThemeContext';
import ScrollToTop from './components/ScrollToTop';

const App = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="bg-gray-100 dark:bg-gray-900 min-h-screen transition-colors">
          <ScrollToTop />
          <Header />
          <main>
            <AppRoutes />
          </main>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;