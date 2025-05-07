// src/App.jsx
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/Header';
import AppRoutes from './routes/AppRoutes';
import ScrollToTop from './components/ScrollToTop';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
          <ScrollToTop />
          <Header />
          <main className="pb-16">
            <AppRoutes />
          </main>
          <footer className="py-6 text-center text-gray-500 dark:text-gray-400 text-sm">
            <p>&copy; {new Date().getFullYear()} AnimeStream - Your Anime Streaming Site</p>
          </footer>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;