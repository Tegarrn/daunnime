// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import ScrollToTop from './components/ScrollToTop';
import { ThemeProvider } from './context/ThemeContext';

// Import pages
import Home from './pages/Home';
import SearchResults from './pages/SearchResults';
import BatchDownload from './pages/BatchDownload';
import AnimeDetail from './pages/AnimeDetail';
import Watch from './pages/Watch';
import NotFound from './pages/NotFound';

const App = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="bg-gray-100 dark:bg-gray-900 min-h-screen transition-colors">
          <ScrollToTop />
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/batch/:batchId" element={<BatchDownload />} />
              {/* Tambahkan route yang hilang */}
              <Route path="/anime/:animeId" element={<AnimeDetail />} />
              <Route path="/watch/:episodeId" element={<Watch />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;