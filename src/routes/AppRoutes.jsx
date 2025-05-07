// src/routes/AppRoutes.jsx
import { Routes, Route } from 'react-router-dom';
import Home from '../pages/Home';
import AnimeDetail from '../pages/AnimeDetail';
import SearchResults from '../pages/SearchResults';
import Watch from '../pages/Watch';
import BatchDownload from '../pages/BatchDownload';
import NotFound from '../pages/NotFound';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/search" element={<SearchResults />} />
      <Route path="/anime/:animeId" element={<AnimeDetail />} />
      <Route path="/watch/:episodeId" element={<Watch />} />
      <Route path="/batch/:batchId" element={<BatchDownload />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;