// src/pages/Home.jsx
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom'; // Link dihapus jika tidak dipakai langsung di sini
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, TrendingUp, Clock, Search as SearchIcon, AlertTriangle } from 'lucide-react'; // ChevronRight, Zap, etc. dihapus jika Section tidak dipakai di sini
import {
  getHomeData,
  getRecentAnime, // Ini sekarang alias ke getOngoingAnime
  getPopularAnime, // Ini sekarang alias ke getCompletedAnime
  searchAnime
} from '../services/api';
import AnimeCard from '../components/AnimeCard'; //
import Loader from '../components/Loader'; //
import Pagination from '../components/Pagination'; //
import SearchBar from '../components/SearchBar'; //
// Helmet dihapus

const Home = () => {
  const [searchParams, setSearchParams] = useSearchParams(); // setSearchParams ditambahkan untuk navigasi halaman
  const searchQuery = searchParams.get('q');
  const pageParam = searchParams.get('page');
  const currentPage = pageParam ? parseInt(pageParam) : 1;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [animeList, setAnimeList] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState(searchQuery ? 'search' : 'recent');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        setAnimeList([]); // Kosongkan list sebelum fetch baru
        let rawData = {};
        let flatList = [];
        let fetchedTotalPages = 1;

        if (searchQuery) {
          // Untuk searchAnime, asumsikan 'currentPage' bisa dikirim jika API mendukung
          rawData = await searchAnime(searchQuery, currentPage);
          setActiveTab('search');
          // TODO: VERIFIKASI struktur data searchAnime dari Otakudesu
          // Asumsi: rawData.data adalah array, atau rawData.data.animeList, atau rawData.data.results
          flatList = rawData?.data?.animeList || rawData?.data?.results || (Array.isArray(rawData?.data) ? rawData.data : (Array.isArray(rawData) ? rawData : []));
          fetchedTotalPages = rawData?.pagination?.totalPages || rawData?.data?.pagination?.totalPages || 1;
        } else if (activeTab === 'recent') {
          rawData = await getRecentAnime(currentPage); // Ini memanggil getOngoingAnime
          // TODO: VERIFIKASI struktur data getOngoingAnime dari Otakudesu
          // Asumsi: rawData.data.ongoing (array) atau rawData.data.animeList (array)
          flatList = rawData?.data?.ongoing || rawData?.data?.animeList || (Array.isArray(rawData?.data) ? rawData.data : []);
          fetchedTotalPages = rawData?.pagination?.totalPages || rawData?.data?.pagination?.totalPages || 1;
        } else if (activeTab === 'popular') {
          rawData = await getPopularAnime(currentPage); // Ini memanggil getCompletedAnime
          // TODO: VERIFIKASI struktur data getCompletedAnime dari Otakudesu
          // Asumsi: rawData.data.completed (array) atau rawData.data.animeList (array)
          flatList = rawData?.data?.completed || rawData?.data?.animeList || (Array.isArray(rawData?.data) ? rawData.data : []);
          fetchedTotalPages = rawData?.pagination?.totalPages || rawData?.data?.pagination?.totalPages || 1;
        } else { // Fallback jika tidak ada tab aktif atau search (mungkin tab default "Home")
          rawData = await getHomeData(); // Ini memanggil getAnimeList (endpoint /otakudesu/home)
          // Berdasarkan JSON yang Anda berikan untuk /otakudesu/home:
          if (rawData && rawData.data && rawData.data.ongoing && Array.isArray(rawData.data.ongoing.animeList)) {
            flatList = rawData.data.ongoing.animeList;
          } else {
            flatList = [];
            console.warn("Struktur data /otakudesu/home tidak sesuai harapan, atau tidak ada ongoing.animeList.");
          }
          // Endpoint /otakudesu/home mungkin tidak memiliki pagination sendiri, jadi totalPages = 1
          fetchedTotalPages = rawData?.data?.ongoing?.pagination?.totalPages || 1;
        }
        
        console.log("Raw Data received in Home.jsx:", JSON.stringify(rawData, null, 2));
        console.log("FlatList extracted:", JSON.stringify(flatList, null, 2));

        if (!Array.isArray(flatList)) {
            console.error("flatList is not an array!", flatList);
            flatList = []; // Pastikan flatList adalah array untuk .map
        }

        // Normalisasi anime data
        const normalizedList = flatList.map(item => {
          if (!item || typeof item !== 'object') { // Tambah pengecekan tipe item
            console.warn("Invalid item in flatList:", item);
            return null;
          }
          
          // Sesuaikan dengan field dari JSON /otakudesu/home
          return {
            id: item.animeId || item.id || String(Math.random()), // animeId dari JSON Anda
            title: item.title || 'No Title',
            thumbnail: item.poster || '/placeholder-anime.jpg', // poster dari JSON Anda
            // Untuk episodeNumber di AnimeCard, kita gunakan latestReleaseDate atau jumlah episode
            episodeNumber: item.latestReleaseDate || (item.episodes ? `Eps: ${item.episodes}`: null), // episodes (jumlah) atau latestReleaseDate
            type: item.type || 'TV', // type tidak ada di JSON, default ke TV
            // score tidak ada di JSON Anda
            // releaseDay dari JSON Anda, bisa ditambahkan jika AnimeCard mendukung
          };
        }).filter(Boolean); // Hapus item yang null hasil dari normalisasi gagal

        console.log("NormalizedList:", JSON.stringify(normalizedList, null, 2));

        setAnimeList(normalizedList);
        setTotalPages(fetchedTotalPages > 0 ? fetchedTotalPages : 1); // Pastikan totalPages minimal 1
      } catch (err) {
        console.error('Error fetching data in Home.jsx:', err);
        setError('Gagal memuat data anime. Silakan coba lagi nanti.');
        setAnimeList([]); // Pastikan animeList kosong jika ada error
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Pengaturan judul dokumen
    if (searchQuery) {
        document.title = `Pencarian: ${searchQuery} - DaunNime`;
    } else if (activeTab === 'recent') {
        document.title = `Anime Terbaru (Ongoing) - DaunNime`;
    } else if (activeTab === 'popular') {
        document.title = `Anime Populer (Completed) - DaunNime`;
    } else {
        document.title = "DaunNime - Nonton Anime Sub Indo";
    }

  }, [searchQuery, currentPage, activeTab]); // activeTab sebagai dependency

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const newSearchParams = new URLSearchParams(); // Hapus query 'q' saat ganti tab
    newSearchParams.set('page', '1'); // Selalu ke halaman 1 saat ganti tab
    setSearchParams(newSearchParams, {replace: true} ); // Gunakan setSearchParams
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageChange = (page) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('page', String(page));
    setSearchParams(newSearchParams, {replace: true}); // Gunakan setSearchParams
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
  
  const tabRecentText = "Sedang Tayang";
  const tabPopularText = "Sudah Tamat";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
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
            className="text-3xl font-bold mb-8 text-gray-800 dark:text-white flex items-center"
          >
            <SearchIcon className="mr-3 text-blue-500" /> Hasil Pencarian untuk: "{searchQuery}"
          </motion.h1>
        ) : (
          <motion.div 
            variants={categoryVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="flex items-center mb-6 md:mb-8">
              <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Jelajahi Anime</h2>
              <div className="ml-auto">
                <div className="md:hidden">
                  <button
                    onClick={toggleSearch}
                    className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <SearchIcon size={20} />
                  </button>
                </div>
                <div className="hidden md:block">
                  <SearchBar />
                </div>
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
                  <SearchBar />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tabs */}
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
                      layoutId="activeTabHighlightHome" // Unique layoutId
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
                      layoutId="activeTabHighlightHome" // Same layoutId for smooth transition between these two tabs
                      className="absolute bottom-0 left-0 right-0 h-0.5 sm:h-1 bg-blue-600 dark:bg-blue-400 rounded-t-sm"
                    />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
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
              onClick={() => window.location.reload()}
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
                  key={anime.id} // Menggunakan anime.id yang sudah dinormalisasi
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
                  {/* Pastikan prop yang di-pass ke AnimeCard sesuai dengan yang diharapkan oleh AnimeCard.jsx */}
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