// src/pages/Home.jsx
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, TrendingUp, Clock, Search as SearchIcon } from 'lucide-react';
import {
  getHomeData,
  getRecentAnime,
  getPopularAnime,
  searchAnime
} from '../services/api';
import AnimeCard from '../components/AnimeCard';
import Loader from '../components/Loader';
import Pagination from '../components/Pagination';
import SearchBar from '../components/SearchBar';

const Home = () => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q');
  const pageParam = searchParams.get('page');
  const currentPage = pageParam ? parseInt(pageParam) : 1;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [animeList, setAnimeList] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState('recent');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        let rawData = {};
        let flatList = [];

        if (searchQuery) {
          rawData = await searchAnime(searchQuery, currentPage);
          setActiveTab('search');
        } else if (activeTab === 'recent') {
          rawData = await getRecentAnime(currentPage);
        } else if (activeTab === 'popular') {
          rawData = await getPopularAnime(currentPage);
        } else {
          rawData = await getHomeData();
        }
        
        // Extract data based on API response structure
        if (rawData && rawData.data) {
          if (Array.isArray(rawData.data)) {
            flatList = rawData.data;
          } else if (rawData.data.list && Array.isArray(rawData.data.list)) {
            flatList = rawData.data.list.flatMap(group => 
              Array.isArray(group.animeList) ? group.animeList : []
            );
          } else if (rawData.data.animeList && Array.isArray(rawData.data.animeList)) {
            flatList = rawData.data.animeList;
          } else if (Object.keys(rawData.data).length > 0) {
            for (const key in rawData.data) {
              if (Array.isArray(rawData.data[key])) {
                flatList = rawData.data[key];
                if (flatList.length > 0) break;
              }
            }
            
            if (flatList.length === 0 && rawData.data.title) {
              flatList = [rawData.data];
            }
          }
        }

        // Normalize the anime data
        const normalizedList = flatList.map(item => {
          if (!item) {
            return null;
          }
          
          return {
            id: item.animeId || item.id || item.slug || item.href || 
                 (item.link ? item.link.replace(/.*\/([^/]+)\/?$/, '$1') : Math.random().toString()),
            title: item.title || item.name || 'No Title',
            thumbnail: item.image || item.thumbnail || item.poster || item.img || '/placeholder-anime.jpg',
            episodeNumber: item.episodeNumber || item.episode || null,
            type: item.type || item.category || 'TV'
          };
        }).filter(Boolean);

        setAnimeList(normalizedList);
        setTotalPages(rawData?.pagination?.totalPages || 
                     rawData?.data?.pagination?.totalPages || 
                     Math.ceil(normalizedList.length / 20) || 1);
      } catch (err) {
        console.error('Error details:', err);
        setError('Failed to fetch anime data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchQuery, currentPage, activeTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handlePageChange = (page) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('page', page);
    window.history.pushState({}, '', `?${newSearchParams.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleSearch = () => {
    setIsSearchExpanded(!isSearchExpanded);
  };

  // Animation variants for cards
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const categoryVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-900 dark:to-purple-900">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
              <span className="relative inline-block">
                Discover
                <motion.span
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="absolute -top-1 -right-6"
                >
                  <Sparkles className="w-6 h-6 text-yellow-300" />
                </motion.span>
              </span> Your Next Anime Adventure
            </h1>
            <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Stream the latest episodes, explore popular series, and find your next favorite anime.
            </p>
            
            {/* Search Bar in Hero Section */}
            <div className="max-w-lg mx-auto">
              <SearchBar heroStyle={true} />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content Section */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        {searchQuery ? (
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold mb-8 dark:text-white flex items-center"
          >
            <SearchIcon className="mr-2" /> Search Results for: "{searchQuery}"
          </motion.h1>
        ) : (
          <motion.div 
            variants={categoryVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="flex items-center mb-8">
              <h2 className="text-3xl font-bold dark:text-white">Explore Anime</h2>
              <div className="ml-auto">
                <div className="md:hidden">
                  <button
                    onClick={toggleSearch}
                    className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                  >
                    <SearchIcon size={20} />
                  </button>
                </div>
                <div className="hidden md:block">
                  <SearchBar />
                </div>
              </div>
            </div>

            {/* Mobile Search Bar */}
            <AnimatePresence>
              {isSearchExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mb-6 md:hidden overflow-hidden"
                >
                  <SearchBar />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg mb-8 overflow-hidden">
              <div className="flex">
                <button
                  onClick={() => handleTabChange('recent')}
                  className={`flex-1 py-4 font-medium relative ${
                    activeTab === 'recent'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                >
                  <div className="flex justify-center items-center">
                    <Clock size={18} className="mr-2" />
                    <span>Recent Episodes</span>
                  </div>
                  {activeTab === 'recent' && (
                    <motion.div 
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 dark:bg-blue-400"
                    />
                  )}
                </button>
                <button
                  onClick={() => handleTabChange('popular')}
                  className={`flex-1 py-4 font-medium relative ${
                    activeTab === 'popular'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                >
                  <div className="flex justify-center items-center">
                    <TrendingUp size={18} className="mr-2" />
                    <span>Popular Anime</span>
                  </div>
                  {activeTab === 'popular' && (
                    <motion.div 
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 dark:bg-blue-400"
                    />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {loading ? (
          <Loader />
        ) : error ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-lg"
          >
            <p className="text-red-500 text-lg">{error}</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.reload()}
              className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            >
              Try Again
            </motion.button>
          </motion.div>
        ) : animeList.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-lg"
          >
            <p className="text-lg text-gray-600 dark:text-gray-300">
              {searchQuery
                ? 'No results found. Try a different search term.'
                : 'No anime found.'}
            </p>
          </motion.div>
        ) : (
          <>
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6"
            >
              {animeList.map((anime, index) => (
                <motion.div
                  key={anime.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    transition: { 
                      delay: index * 0.05,
                      duration: 0.4
                    }
                  }}
                  whileHover={{ y: -8, transition: { duration: 0.2 } }}
                >
                  <AnimeCard anime={anime} />
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-12"
            >
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

export default Home;