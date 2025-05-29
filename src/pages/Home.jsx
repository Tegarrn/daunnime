// src/pages/Home.jsx
import { useState, useEffect, useCallback } from 'react'; // useCallback ditambahkan
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, TrendingUp, Clock, Search as SearchIcon, AlertTriangle } from 'lucide-react';
import {
  getHomeData,    // Ini adalah alias untuk getAnimeList (endpoint /otakudesu/home)
  getRecentAnime, // Ini adalah alias untuk getOngoingAnime
  getPopularAnime,  // Ini adalah alias untuk getCompletedAnime
  searchAnime
} from '../services/api';
import AnimeCard from '../components/AnimeCard';
import Loader from '../components/Loader';
import Pagination from '../components/Pagination';
import SearchBar from '../components/SearchBar';

const Home = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('q');
  const pageParam = searchParams.get('page');
  const currentPage = pageParam ? parseInt(pageParam) : 1;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [animeList, setAnimeList] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState(searchQuery ? 'search' : 'recent'); // Default ke 'recent' jika tidak ada pencarian
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  const fetchData = useCallback(async () => { // Dibungkus dengan useCallback
    try {
      setLoading(true);
      setError(null);
      setAnimeList([]);
      let rawData = {}; // Akan berisi data yang sudah di-unwrap oleh service API
      let flatList = [];
      let fetchedTotalPages = 1;
      let currentTitle = "DaunNime - Nonton Anime Sub Indo"; // Judul default

      if (searchQuery) {
        setActiveTab('search'); // Pastikan tab search aktif
        rawData = await searchAnime(searchQuery, currentPage);
        // Asumsi: rawData bisa berupa array atau objek { results: [...], pagination: {...} } atau { animeList: [...] }
        flatList = Array.isArray(rawData) 
          ? rawData 
          : rawData?.results || rawData?.animeList || [];
        fetchedTotalPages = rawData?.pagination?.totalPages || rawData?.totalPages || 1;
        currentTitle = `Pencarian: "${searchQuery}" - DaunNime`;
      } else if (activeTab === 'recent') {
        rawData = await getRecentAnime(currentPage);
        // Asumsi: rawData bisa berupa array atau objek { ongoing: [...], pagination: {...} } atau { animeList: [...] }
        flatList = Array.isArray(rawData) 
          ? rawData 
          : rawData?.ongoing || rawData?.animeList || [];
        fetchedTotalPages = rawData?.pagination?.totalPages || rawData?.totalPages || 1;
        currentTitle = `Anime Terbaru (Ongoing) - DaunNime`;
      } else if (activeTab === 'popular') {
        rawData = await getPopularAnime(currentPage);
        // Asumsi: rawData bisa berupa array atau objek { completed: [...], pagination: {...} } atau { animeList: [...] }
        flatList = Array.isArray(rawData) 
          ? rawData 
          : rawData?.completed || rawData?.animeList || [];
        fetchedTotalPages = rawData?.pagination?.totalPages || rawData?.totalPages || 1;
        currentTitle = `Anime Populer (Completed) - DaunNime`;
      } else { // Fallback jika tab tidak dikenal, bisa default ke 'recent' atau 'home' data
        // Untuk saat ini, karena default tab adalah 'recent', cabang ini mungkin jarang tercapai
        // Jika Anda ingin tab 'Home' khusus yang menggunakan getHomeData:
        // rawData = await getHomeData(); // /otakudesu/home
        // // Struktur /otakudesu/home mungkin: { ongoing: { animeList: [], pagination: {} }, completed: { ... } }
        // // Pilih list yang ingin ditampilkan, misal ongoing:
        // flatList = rawData?.ongoing?.animeList || [];
        // fetchedTotalPages = rawData?.ongoing?.pagination?.totalPages || 1;
        // Jika tidak, default ke 'recent' seperti di atas
        rawData = await getRecentAnime(currentPage); // Default ke recent jika activeTab aneh
        flatList = Array.isArray(rawData) ? rawData : rawData?.ongoing || rawData?.animeList || [];
        fetchedTotalPages = rawData?.pagination?.totalPages || rawData?.totalPages || 1;
        currentTitle = `Anime Terbaru (Ongoing) - DaunNime`;
        setActiveTab('recent'); // Set tab ke recent jika fallback
      }
      
      document.title = currentTitle;
      console.log("Home.jsx - Raw Data received from service:", JSON.stringify(rawData, null, 2));
      
      if (!Array.isArray(flatList)) {
          console.warn("Home.jsx - flatList is not an array after API call, defaulting to empty. Received:", flatList);
          flatList = [];
      }

      const normalizedList = flatList.map(item => {
        if (!item || typeof item !== 'object') {
          console.warn("Home.jsx - Invalid item in flatList:", item);
          return null;
        }
        
        let id = item.animeId || item.id || item.slug;
        if (!id && item.href) {
          const hrefStr = String(item.href);
          const match = hrefStr.match(/\/anime\/([^\/]+)\/?$/) || hrefStr.match(/\/([^\/]+)\/?$/); // Coba beberapa pola
          id = match ? match[1] : hrefStr.substring(hrefStr.lastIndexOf('/') + 1).replace(/\/$/, '');
        }
        id = id || String(Math.random());

        let episodeDisplay = item.latestEpisode || item.episode || item.current_episode || item.episode_count;
        if (episodeDisplay && !String(episodeDisplay).toLowerCase().includes('eps')) {
            episodeDisplay = `Ep ${episodeDisplay}`;
        } else if (!episodeDisplay && item.episodes && item.status && String(item.status).toLowerCase().includes('completed')) {
            episodeDisplay = `${item.episodes} Eps`;
        } else if (!episodeDisplay && item.episodes) {
            episodeDisplay = `Ep ${item.episodes}`;
        } else if (!episodeDisplay && item.latestReleaseDate) {
            episodeDisplay = item.latestReleaseDate;
        }
        
        return {
          id: id,
          title: item.title || item.name || 'Judul Tidak Diketahui',
          thumbnail: item.poster || item.thumbnail || item.image || item.img || '/placeholder-anime.jpg',
          episodeNumber: episodeDisplay,
          type: item.type || item.category || 'TV',
          rating: item.score || item.rating, // AnimeCard akan menampilkan rating jika ada
        };
      }).filter(Boolean);

      console.log("Home.jsx - NormalizedList:", JSON.stringify(normalizedList, null, 2));

      setAnimeList(normalizedList);
      setTotalPages(fetchedTotalPages > 0 ? fetchedTotalPages : 1);
    } catch (err) {
      console.error('Home.jsx - Error fetching data:', err);
      setError(`Gagal memuat data anime: ${err.message}. Silakan coba lagi nanti.`);
      setAnimeList([]);
      setTotalPages(1);
      document.title = "Error Memuat Anime - DaunNime";
    } finally {
      setLoading(false);
    }
  }, [searchQuery, currentPage, activeTab, setSearchParams]); // Tambahkan setSearchParams karena dipakai di handleTabChange

  useEffect(() => {
    fetchData();
  }, [fetchData]); // fetchData sudah di-memoize dengan useCallback

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const newSearchParams = new URLSearchParams(searchParams); // Pertahankan query pencarian jika ada
    if(searchQuery && tab !== 'search') { // Hapus query 'q' jika pindah dari tab search ke tab lain
        newSearchParams.delete('q');
    }
    newSearchParams.set('page', '1');
    setSearchParams(newSearchParams, {replace: true} );
    // Tidak perlu scroll di sini karena useEffect akan fetch ulang dan render ulang
  };

  const handlePageChange = (page) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('page', String(page));
    setSearchParams(newSearchParams, {replace: true});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchSubmit = (query) => { // Dipanggil oleh SearchBar
    const newSearchParams = new URLSearchParams();
    newSearchParams.set('q', query);
    newSearchParams.set('page', '1'); // Reset ke halaman 1 saat pencarian baru
    setSearchParams(newSearchParams, { replace: true });
    setActiveTab('search'); // Otomatis pindah ke tab search
  };


  const toggleSearch = () => {
    setIsSearchExpanded(!isSearchExpanded);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };
  
  const tabRecentText = "Sedang Tayang";
  const tabPopularText = "Sudah Tamat";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-800 dark:to-purple-800">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
              <span className="relative inline-block">
                Temukan
                <motion.span
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="absolute -top-1 -right-6"
                >
                  <Sparkles className="w-6 h-6 text-yellow-300" />
                </motion.span>
              </span> Anime Favoritmu Berikutnya
            </h1>
            <p className="text-lg md:text-xl text-blue-100 dark:text-blue-200 mb-8 max-w-2xl mx-auto">
              Streaming episode terbaru, jelajahi seri populer, dan temukan anime kesukaanmu.
            </p>
            <div className="max-w-lg mx-auto">
              {/* SearchBar di sini mungkin perlu prop onSearchSubmit jika ingin memicu handleSearchSubmit */}
              <SearchBar onSearch={handleSearchSubmit} heroStyle={true} />
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12">
        {searchQuery && activeTab === 'search' ? ( // Tampilkan header pencarian hanya jika sedang mencari
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold mb-8 text-gray-800 dark:text-white flex items-center"
          >
            <SearchIcon className="mr-3 text-blue-500" /> Hasil Pencarian untuk: "{searchQuery}"
          </motion.h1>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6 md:mb-8">
              <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Jelajahi Anime</h2>
              <div className="md:hidden">
                <button
                  onClick={toggleSearch}
                  className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                  aria-label="Toggle search bar"
                >
                  <SearchIcon size={20} />
                </button>
              </div>
              <div className="hidden md:block">
                <SearchBar onSearch={handleSearchSubmit} />
              </div>
            </div>

            <AnimatePresence>
              {isSearchExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mb-6 md:hidden overflow-hidden"
                >
                  <SearchBar onSearch={handleSearchSubmit} />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg mb-8 overflow-hidden">
              <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => handleTabChange('recent')}
                  className={`flex-1 py-3 sm:py-4 px-2 text-sm sm:text-base font-medium relative transition-colors duration-200 ${
                    activeTab === 'recent'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                >
                  <div className="flex justify-center items-center">
                    <Clock size={18} className="mr-2" />
                    <span>{tabRecentText}</span>
                  </div>
                  {activeTab === 'recent' && (
                    <motion.div 
                      layoutId="activeTabHighlightHome"
                      className="absolute bottom-0 left-0 right-0 h-0.5 sm:h-1 bg-blue-600 dark:bg-blue-400 rounded-t-sm"
                    />
                  )}
                </button>
                <div className="border-l border-gray-200 dark:border-gray-700 h-auto self-stretch my-2"></div>
                <button
                  onClick={() => handleTabChange('popular')}
                  className={`flex-1 py-3 sm:py-4 px-2 text-sm sm:text-base font-medium relative transition-colors duration-200 ${
                    activeTab === 'popular'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                >
                  <div className="flex justify-center items-center">
                    <TrendingUp size={18} className="mr-2" />
                    <span>{tabPopularText}</span>
                  </div>
                  {activeTab === 'popular' && (
                    <motion.div 
                      layoutId="activeTabHighlightHome"
                      className="absolute bottom-0 left-0 right-0 h-0.5 sm:h-1 bg-blue-600 dark:bg-blue-400 rounded-t-sm"
                    />
                  )}
                </button>
              </div>
            </div>
          </>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader />
          </div>
        ) : error ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
             <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
            <p className="text-red-500 text-lg mb-3">Oops, terjadi kesalahan!</p>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchData} // Menggunakan fetchData yang sudah di-memoize
              className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              Coba Lagi
            </motion.button>
          </motion.div>
        ) : animeList.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <SearchIcon className="mx-auto text-gray-400 dark:text-gray-500 mb-4" size={48} />
            <p className="text-lg text-gray-600 dark:text-gray-300">
              {searchQuery
                ? `Tidak ada hasil ditemukan untuk "${searchQuery}".`
                : 'Tidak ada anime untuk ditampilkan saat ini.'}
            </p>
             {searchQuery && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Coba kata kunci lain.</p>}
             {!searchQuery && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Silakan coba lagi nanti atau periksa tab lain.</p>}
          </motion.div>
        ) : (
          <>
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-6 md:gap-x-6 md:gap-y-8"
            >
              {animeList.map((anime, index) => (
                <motion.div
                  key={anime.id || index} // Gunakan index sebagai fallback key jika id masih bisa duplikat/null
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    transition: { 
                      delay: index * 0.03,
                      duration: 0.35
                    }
                  }}
                  whileHover={{ y: -5, transition: { duration: 0.15 } }}
                >
                  <AnimeCard anime={anime} />
                </motion.div>
              ))}
            </motion.div>

            {totalPages > 1 && (
                <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-10 sm:mt-12 flex justify-center"
                >
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />
                </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Home;